import { WalletService } from "./wallet";

export class Renderer {
  private walletService: WalletService;
  private gameStarted: boolean = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, walletService: WalletService) {
    this.walletService = walletService;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d")!;

    if (!this.walletService.isConnected()) {
      throw new Error("Wallet must be connected to initialize game");
    }

    this.initializeGame();
    this.initializeGameControls();
  }

  private initializeGame(): void {
    // Only initialize if wallet is connected
    if (!this.walletService.isConnected()) {
      return;
    }

    // Your existing initialization code
  }

  private initializeWalletUI(): void {
    const connectButton = document.getElementById("connect-wallet");
    const walletInfo = document.getElementById("wallet-info");
    const livesDisplay = document.getElementById("lives-count");
    const walletDisplay = document.getElementById("wallet-address");

    if (!connectButton || !walletInfo || !livesDisplay || !walletDisplay)
      return;

    connectButton.addEventListener("click", async () => {
      const connected = await this.walletService.connectWallet();
      if (connected) {
        const address = this.walletService.getWalletAddress();
        walletDisplay.textContent = `${address?.slice(0, 4)}...${address?.slice(
          -4
        )}`;
        livesDisplay.textContent = this.walletService
          .getRemainingLives()
          .toString();
        connectButton.style.display = "none";
        walletInfo.style.display = "block";
      }
    });
  }

  private initializeGameControls(): void {
    // Space key to start game
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault(); // Prevent page scroll
        if (!this.walletService.isConnected()) {
          alert("Please connect your wallet to play!");
          return;
        }
        if (!this.gameStarted) {
          this.Start();
        }
      }
    });

    // Click/touch to start game
    this.canvas.addEventListener("click", () => {
      if (!this.walletService.isConnected()) {
        alert("Please connect your wallet to play!");
        return;
      }
      if (!this.gameStarted) {
        this.Start();
      }
    });
  }

  public Start(): void {
    if (this.gameStarted) return;

    this.gameStarted = true;
    this.gameLoop();
  }

  private gameLoop = (): void => {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update game state and render
    this.update();
    this.render();

    // Continue the game loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    // Update game logic here
  }

  private render(): void {
    // Set black background
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw game grid or background pattern
    this.drawBackground();

    // Draw player and other game elements
    this.drawGameElements();
  }

  private drawBackground(): void {
    // Draw grid pattern
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawGameElements(): void {
    // Draw player
    this.ctx.fillStyle = "#66eeff";
    this.ctx.fillRect(
      this.canvas.width / 2 - 25,
      this.canvas.height / 2 - 25,
      50,
      50
    );

    // TODO: Add other game elements
  }

  public Stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.gameStarted = false;
  }

  private handlePlayerDeath(): void {
    if (!this.walletService.useLife()) {
      this.gameStarted = false;
      // Handle game over
      this.showGameOver();
      return;
    }
    // Continue game or restart level
  }

  private showGameOver(): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Show game over message
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Game Over - Connect wallet to play again!",
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }

  // ... rest of your existing renderer code
}
