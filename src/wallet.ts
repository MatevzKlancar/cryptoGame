import { supabase } from "./lib/supabase";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

// Type definitions for Phantom wallet
interface PhantomWindow extends Window {
  solana?: {
    isConnected: boolean;
    connect(): Promise<{ publicKey: { toString(): string } }>;
    disconnect(): Promise<void>;
    on(event: string, callback: () => void): void;
    publicKey?: { toString(): string };
  };
}

declare const window: PhantomWindow;

export class WalletService {
  private isWalletConnected: boolean = false;
  private walletAddress: string | null = null;
  private phantomWallet: PhantomWindow["solana"] | undefined;
  private connection: Connection;
  private readonly REQUIRED_SOL = 0.1;
  private isPremium: boolean | null = null;

  constructor() {
    this.phantomWallet = (window as PhantomWindow)?.solana;
    this.connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    this.setupWalletListeners();
    // Try to get wallet address if already connected
    if (this.phantomWallet?.isConnected) {
      this.walletAddress = this.phantomWallet.publicKey?.toString() || null;
      this.isWalletConnected = true;
    }
  }

  private async loadLivesFromSupabase(address: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("player_lives")
        .select("remaining_lives")
        .eq("wallet_address", address)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found
          // First time user, set initial lives
          await this.saveLivesToSupabase(address);
        } else {
          console.error("Error loading lives:", error);
        }
        return;
      }

      if (data) {
        this.isPremium = await this.checkSolBalance(address);
      }
    } catch (error) {
      console.error("Error in loadLivesFromSupabase:", error);
    }
  }

  private async saveLivesToSupabase(address: string): Promise<void> {
    try {
      const { error } = await supabase.from("player_lives").upsert(
        {
          wallet_address: address,
          remaining_lives: 10,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "wallet_address",
        }
      );

      if (error) {
        console.error("Error saving lives:", error);
      }
    } catch (error) {
      console.error("Error in saveLivesToSupabase:", error);
    }
  }

  public async decrementLives(): Promise<void> {
    try {
      if (!this.walletAddress) {
        console.error("No wallet address available");
        return;
      }

      if (await this.hasUnlimitedPlays()) {
        return; // Don't decrement if they have unlimited plays
      }

      console.log("Decrementing lives for wallet:", this.walletAddress);

      // First get current lives
      const { data: currentData, error: readError } = await supabase
        .from("player_lives")
        .select("remaining_lives")
        .eq("wallet_address", this.walletAddress)
        .single();

      if (readError) {
        console.error("Error reading current lives:", readError);
        return;
      }

      // Calculate new lives count
      const currentLives = currentData?.remaining_lives || 0;
      const newLives = Math.max(0, currentLives - 1);

      console.log("Updating lives:", {
        currentLives,
        newLives,
        wallet: this.walletAddress,
      });

      // Update the lives count
      const { error: updateError } = await supabase
        .from("player_lives")
        .update({ remaining_lives: newLives })
        .eq("wallet_address", this.walletAddress);

      if (updateError) {
        console.error("Error updating lives:", updateError);
        return;
      }

      // Dispatch event to update UI
      document.dispatchEvent(new Event("livesUpdated"));
    } catch (error) {
      console.error("Error in decrementLives:", error);
    }
  }

  private async checkSolBalance(address: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      console.log("Current SOL balance:", solBalance);
      return solBalance >= this.REQUIRED_SOL;
    } catch (error) {
      console.error("Error checking SOL balance:", error);
      return false;
    }
  }

  public async hasLivesRemaining(): Promise<boolean> {
    try {
      // First check if they have enough SOL for unlimited plays
      if (await this.hasUnlimitedPlays()) {
        return true;
      }

      // If not, check if they have remaining lives
      const lives = await this.getRemainingLives();
      return parseInt(lives) > 0;
    } catch (error) {
      console.error("Error in hasLivesRemaining:", error);
      return false;
    }
  }

  public async connectWallet(): Promise<void> {
    try {
      if (!this.phantomWallet) {
        throw new Error("Phantom wallet not found!");
      }

      const response = await this.phantomWallet.connect();
      this.walletAddress = response.publicKey.toString();
      this.isWalletConnected = true;

      // Initialize lives in DB when connecting
      await this.initializeLives();

      document.dispatchEvent(new Event("walletConnected"));
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  private async initializeLives(): Promise<void> {
    if (!this.walletAddress) return;

    try {
      // Check if record exists
      const { data, error } = await supabase
        .from("player_lives")
        .select("remaining_lives")
        .eq("wallet_address", this.walletAddress)
        .single();

      if (error && error.code === "PGRST116") {
        // No record found, create initial record
        await supabase.from("player_lives").insert([
          {
            wallet_address: this.walletAddress,
            remaining_lives: 5, // Initial lives
          },
        ]);
      }
    } catch (error) {
      console.error("Error initializing lives:", error);
    }
  }

  private setupWalletListeners(): void {
    if (!this.phantomWallet) return;

    this.phantomWallet.on("connect", async () => {
      this.isWalletConnected = true;
      this.walletAddress = this.phantomWallet?.publicKey?.toString() || null;
      if (this.walletAddress) {
        await this.loadLivesFromSupabase(this.walletAddress);
        this.isPremium = null;
      }
      document.dispatchEvent(new Event("walletConnected"));
    });

    this.phantomWallet.on("disconnect", () => {
      this.isWalletConnected = false;
      this.walletAddress = null;
      this.isPremium = null;
      document.dispatchEvent(new Event("walletDisconnected"));
    });

    if (this.phantomWallet.isConnected) {
      this.isWalletConnected = true;
      this.walletAddress = this.phantomWallet.publicKey?.toString() || null;
      if (this.walletAddress) {
        this.loadLivesFromSupabase(this.walletAddress).catch(console.error);
      }
      document.dispatchEvent(new Event("walletConnected"));
    }
  }

  public isConnected(): boolean {
    return this.isWalletConnected && this.walletAddress !== null;
  }

  public getWalletAddress(): string | null {
    return this.walletAddress;
  }

  public async getRemainingLives(): Promise<string> {
    try {
      if (!this.walletAddress) {
        console.error("No wallet address available");
        return "0";
      }

      // Check for unlimited plays first
      if (await this.hasUnlimitedPlays()) {
        return "∞";
      }

      const { data, error } = await supabase
        .from("player_lives")
        .select("remaining_lives")
        .eq("wallet_address", this.walletAddress)
        .maybeSingle();

      // If no data found or error, initialize with 5 lives
      if (!data || error) {
        const { data: newData, error: insertError } = await supabase
          .from("player_lives")
          .insert([
            {
              wallet_address: this.walletAddress,
              remaining_lives: 5,
            },
          ])
          .select("remaining_lives")
          .single();

        if (insertError) {
          console.error("Error creating initial record:", insertError);
          return "0";
        }

        return newData.remaining_lives.toString();
      }

      return data.remaining_lives.toString();
    } catch (error) {
      console.error("Error in getRemainingLives:", error);
      return "0";
    }
  }

  public async hasUnlimitedPlays(): Promise<boolean> {
    try {
      if (!this.walletAddress) return false;

      const publicKey = new PublicKey(this.walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      return solBalance >= this.REQUIRED_SOL;
    } catch (error) {
      console.error("Error checking SOL balance:", error);
      return false;
    }
  }
}
