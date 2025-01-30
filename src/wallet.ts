import { Connection, PublicKey } from "@solana/web3.js";

// Type definitions for Phantom wallet
interface PhantomWindow extends Window {
  solana?: {
    connect(): Promise<{ publicKey: PublicKey }>;
    disconnect(): Promise<void>;
    on(event: string, callback: () => void): void;
    isPhantom?: boolean;
  };
}

declare const window: PhantomWindow;

export class WalletService {
  private isWalletConnected: boolean = false;
  private walletAddress: string | null = null;
  private remainingLives: number = 10;
  private phantomWallet: PhantomWindow["solana"];

  constructor() {
    this.phantomWallet = window?.solana;
    this.setupWalletListeners();
    this.loadLivesFromStorage();
  }

  private loadLivesFromStorage(): void {
    if (this.walletAddress) {
      const lives = localStorage.getItem(`lives_${this.walletAddress}`);
      if (lives !== null) {
        this.remainingLives = parseInt(lives);
      }
    }
  }

  private saveLivesToStorage(): void {
    if (this.walletAddress) {
      localStorage.setItem(
        `lives_${this.walletAddress}`,
        this.remainingLives.toString()
      );
    }
  }

  public decrementLives(): void {
    if (this.remainingLives > 0) {
      this.remainingLives--;
      this.saveLivesToStorage();
      // Dispatch event for UI update
      document.dispatchEvent(new Event("livesUpdated"));
    }
  }

  public getRemainingLives(): number {
    return this.remainingLives;
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

      const resp = await this.phantomWallet.connect();
      this.walletAddress = resp.publicKey.toString();
      this.isWalletConnected = true;
      this.loadLivesFromStorage();
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.isWalletConnected;
  }

  public getWalletAddress(): string | null {
    return this.walletAddress;
  }

  private setupWalletListeners(): void {
    if (this.phantomWallet) {
      this.phantomWallet.on("connect", () => {
        document.dispatchEvent(new Event("walletConnected"));
      });

      this.phantomWallet.on("disconnect", () => {
        this.isWalletConnected = false;
        this.walletAddress = null;
        document.dispatchEvent(new Event("walletDisconnected"));
      });
    }
  }

  private updateUIState(): void {
    const walletStatus = document.querySelector(".wallet-status");
    if (walletStatus instanceof HTMLElement) {
      walletStatus.style.display = this.isWalletConnected ? "none" : "block";
    }

    // Update any game controls that should be disabled when wallet is not connected
    const gameControls = document.querySelectorAll(".game-control");
    gameControls.forEach((control) => {
      if (control instanceof HTMLElement) {
        control.style.pointerEvents = this.isWalletConnected ? "auto" : "none";
        control.style.opacity = this.isWalletConnected ? "1" : "0.5";
      }
    });
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
