import { Player } from "./player";
import { Background } from "./background";
import { Scoreboard } from "./scoreboard";

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private background: Background;
  private scoreboard: Scoreboard;
  private gameOver: boolean;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.canvas.width = 800;
    this.canvas.height = 400;

    this.player = new Player(100, 200);
    this.background = new Background(300);
    this.scoreboard = new Scoreboard();
    this.gameOver = false;

    // Event listeners
    document.addEventListener("keydown", (e) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && !this.gameOver) {
        this.player.jump();
      }
      if (e.code === "Space" && this.gameOver) {
        this.restart();
      }
    });

    document.addEventListener("touchstart", () => {
      if (!this.gameOver) {
        this.player.jump();
      } else {
        this.restart();
      }
    });

    this.gameLoop();
  }

  private gameLoop() {
    if (!this.gameOver) {
      // Clear canvas
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Update game objects
      this.player.update(this.background.getGroundY());
      this.background.update();
      this.scoreboard.update();

      // Check collision
      if (this.background.checkCollision(this.player.getPosition())) {
        this.gameOver = true;
      }

      // Draw game objects
      this.background.draw(this.ctx);
      this.player.draw(this.ctx);
    } else {
      // Draw game over screen
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = "white";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Game Over",
        this.canvas.width / 2,
        this.canvas.height / 2
      );

      this.ctx.font = "24px Arial";
      this.ctx.fillText(
        "Press Space to Restart",
        this.canvas.width / 2,
        this.canvas.height / 2 + 40
      );
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  private restart() {
    this.player = new Player(100, 200);
    this.background = new Background(300);
    this.scoreboard.reset();
    this.gameOver = false;
  }
}

// Start the game
new GameRenderer();
