import { Connection, PublicKey } from "@solana/web3.js";

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
  private remainingLives: number = 10;
  private phantomWallet: PhantomWindow["solana"] | undefined;

  constructor() {
    this.phantomWallet = (window as PhantomWindow)?.solana;
    this.setupWalletListeners();
  }

  private loadLivesFromStorage(address: string): void {
    const lives = localStorage.getItem(`lives_${address}`);
    if (lives === null) {
      // First time user, set initial lives
      this.remainingLives = 10;
      this.saveLivesToStorage(address);
    } else {
      this.remainingLives = parseInt(lives);
    }
  }

  private saveLivesToStorage(address: string): void {
    localStorage.setItem(`lives_${address}`, this.remainingLives.toString());
  }

  public decrementLives(): void {
    if (this.walletAddress && this.remainingLives > 0) {
      this.remainingLives--;
      this.saveLivesToStorage(this.walletAddress);
      document.dispatchEvent(new Event("livesUpdated"));
    }
  }

  public hasLivesRemaining(): boolean {
    return this.remainingLives > 0;
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (!this.phantomWallet) {
        window.open("https://phantom.app/", "_blank");
        throw new Error("Please install Phantom wallet!");
      }

      // Check if already connected
      if (this.phantomWallet.isConnected) {
        this.walletAddress = this.phantomWallet.publicKey?.toString() || null;
        this.isWalletConnected = true;
        if (this.walletAddress) {
          this.loadLivesFromStorage(this.walletAddress);
        }
        document.dispatchEvent(new Event("walletConnected"));
        return true;
      }

      const resp = await this.phantomWallet.connect();
      this.walletAddress = resp.publicKey.toString();
      this.isWalletConnected = true;
      this.loadLivesFromStorage(this.walletAddress);
      document.dispatchEvent(new Event("walletConnected"));
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return false;
    }
  }

  private setupWalletListeners(): void {
    if (!this.phantomWallet) return;

    this.phantomWallet.on("connect", () => {
      this.isWalletConnected = true;
      this.walletAddress = this.phantomWallet?.publicKey?.toString() || null;
      if (this.walletAddress) {
        this.loadLivesFromStorage(this.walletAddress);
      }
      document.dispatchEvent(new Event("walletConnected"));
    });

    this.phantomWallet.on("disconnect", () => {
      this.isWalletConnected = false;
      this.walletAddress = null;
      document.dispatchEvent(new Event("walletDisconnected"));
    });

    // Check if already connected on initialization
    if (this.phantomWallet.isConnected) {
      this.isWalletConnected = true;
      this.walletAddress = this.phantomWallet.publicKey?.toString() || null;
      if (this.walletAddress) {
        this.loadLivesFromStorage(this.walletAddress);
      }
      document.dispatchEvent(new Event("walletConnected"));
    }
  }

  public isConnected(): boolean {
    return this.isWalletConnected;
  }

  public getWalletAddress(): string | null {
    return this.walletAddress;
  }

  public getRemainingLives(): number {
    return this.remainingLives;
  }

  initializePlayer(): void {
    this.remainingLives = 10;
    this.loadGameState();
  }

  useLife(): boolean {
    if (this.remainingLives > 0) {
      this.remainingLives--;
      this.saveGameState();
      return true;
    }
    this.handleNoLives();
    return false;
  }

  handleNoLives(): void {
    alert(
      "Free trial is over! You'll need tickets to compete on the leaderboard."
    );
  }

  private saveGameState(): void {
    localStorage.setItem(
      "gameState",
      JSON.stringify({
        walletAddress: this.walletAddress,
        remainingLives: this.remainingLives,
      })
    );
  }

  private loadGameState(): void {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.walletAddress === this.walletAddress) {
        this.remainingLives = state.remainingLives;
      }
    }
  }
}
