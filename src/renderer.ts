import { Controller } from "./components/controller";
import { WalletService } from "./wallet";
import { Volume } from "./components/volume";
import { Player } from "./components/player";
import { Background } from "./components/background";
import { Platform } from "./components/platform";
import { Scoreboard } from "./components/scoreboard";
import { Viewport } from "./components/viewport";
import { Menu } from "./components/menu";
import { MovingPoint, Point } from "./components/point";
import { ScoreHistory } from "./components/scoreHistory";
import { Sound } from "./components/sound";

export class Renderer {
  private static defaultGravity: number = 0.2;
  private static gameWidth: number = 480;
  private static minimumPlatformReboundSpeed: number = 2;
  private static readonly CALLBACK_COOLDOWN = 1000; // 1 second cooldown

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private controller: Controller;
  private walletService: WalletService;
  private volume: Volume;
  private backgroundMusic: Sound;
  private deathSound: Sound;
  private player: Player;
  private background: Background;
  private platform: Platform;
  private scoreboard: Scoreboard;
  private menu: Menu;
  private viewport: Viewport;
  private scoreHistory: ScoreHistory;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastCallbackTime: number = 0;
  private isProcessingCallback: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    controller: Controller,
    walletService: WalletService
  ) {
    console.log("Renderer initialized with wallet service:", walletService);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.controller = controller;
    this.walletService = walletService;

    this.volume = new Volume(
      {
        x: this.canvas.width,
        y: this.canvas.height,
      },
      controller
    );

    this.backgroundMusic = this.volume.createSound("snd/music.wav", {
      isLooping: true,
    });
    this.backgroundMusic.play();

    this.deathSound = this.volume.createSound("snd/death.wav", {});

    let playerPosition: MovingPoint = {
      dX: 2,
      dY: -2,
      x: 30,
      y: 110,
    };
    let playerDimensions: Point = {
      x: 30,
      y: 30,
    };
    this.player = new Player(
      playerPosition,
      playerDimensions,
      "#FF0000",
      controller,
      Renderer.defaultGravity,
      Renderer.gameWidth,
      this.volume
    );

    this.background = new Background(
      { x: 0, y: 0 },
      { x: this.canvas.width, y: this.canvas.height },
      "#222222",
      this.player
    );

    let platformPosition: MovingPoint = {
      dX: 2,
      dY: 2,
      x: 30,
      y: 690,
    };
    let platformDimensions: Point = {
      x: 90,
      y: 20,
    };
    this.platform = new Platform(
      platformPosition,
      platformDimensions,
      "#FFFFFF",
      -Renderer.defaultGravity,
      this.volume,
      Renderer.gameWidth
    );
    this.platform.onBounce = () => {
      if (this.platform.ySpeed < Renderer.minimumPlatformReboundSpeed) {
        this.platform.ySpeed = Renderer.minimumPlatformReboundSpeed;
      }
    };

    let scoreboardPosition: MovingPoint = {
      dX: 0,
      dY: 0,
      x: 20,
      y: 370,
    };
    let scoreboardDimensions: Point = {
      x: 0,
      y: 0,
    };
    this.scoreboard = new Scoreboard(
      this.player,
      scoreboardPosition,
      scoreboardDimensions,
      "rgba(255,255,255, 0.1)"
    );

    this.menu = new Menu(
      {
        x: this.canvas.width,
        y: this.canvas.height,
      },
      controller,
      this.background,
      async () => {
        console.log("Menu start callback triggered");
        const hasLives = await walletService.hasLivesRemaining();
        console.log("Has lives check:", hasLives);
        if (hasLives) {
          console.log("Starting game");
          if (!(await walletService.hasUnlimitedPlays())) {
            await walletService.decrementLives();
          }
          this.player.Reset();
          this.platform.Reset();
          this.viewport.Reset();
          this.scoreboard.Reset();
          this.background.Reset();
          this.isRunning = true;
          console.log("Game started, isRunning:", this.isRunning);
        } else {
          this.Stop();
          this.isRunning = false;
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      },
      this.volume,
      walletService
    );

    this.viewport = new Viewport(
      this.ctx,
      [this.background, this.scoreboard],
      [],
      [this.player, this.platform]
    );

    this.platform.viewport = this.viewport;

    let originalOnMove: (amountMoved: Point) => void = this.player.onMove;
    this.player.onMove = async (amountMoved: Point) => {
      this.viewport.SlideUpTo(-this.player.yPosition + 50);
      this.background.SlideUpTo(-this.player.yPosition);

      if (
        this.player.yPosition > -(this.viewport.offset - this.canvas.height)
      ) {
        this.isRunning = false;
        this.deathSound.play();

        const finalScore = this.scoreboard.totalPoints;
        console.log("Death detected, final score:", finalScore);

        try {
          // First update the UI
          console.log("Adding score to history...");
          await this.scoreHistory.addScore(finalScore, this.player.fillColor);
          console.log("Score added to history");

          // Verify wallet connection
          console.log("Wallet connected:", this.walletService.isConnected());
        } catch (error) {
          console.error("Error handling death:", error);
        }

        this.menu.showMenu(finalScore, this.player.fillColor);
      }

      if (originalOnMove) {
        originalOnMove(amountMoved);
      }
    };

    console.log(
      "Initializing ScoreHistory with wallet service:",
      walletService
    );
    this.scoreHistory = new ScoreHistory();

    this.initializeGameControls();
  }

  public Start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }

  public Stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;
    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    // Game update logic
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.viewport.Render();
    this.menu.Render(this.ctx);
  }

  private initializeGameControls(): void {
    // Handle keyboard events
    document.addEventListener("keydown", async (event) => {
      const now = Date.now();

      // Check if we're in cooldown or already processing a callback
      if (
        this.isProcessingCallback ||
        now - this.lastCallbackTime < Renderer.CALLBACK_COOLDOWN
      ) {
        event.preventDefault();
        return;
      }

      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();

        if (!this.walletService.isConnected()) {
          alert("Please connect your wallet to play!");
          return;
        }

        // Only trigger if game is not running and menu is open
        if (!this.isRunning && this.menu.menuOpen) {
          try {
            this.isProcessingCallback = true;
            this.lastCallbackTime = now;
            await this.menu.triggerPlayCallback();
          } finally {
            this.isProcessingCallback = false;
          }
        }
      }
    });
  }
}
