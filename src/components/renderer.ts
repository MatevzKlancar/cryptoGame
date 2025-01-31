import { Player } from "./player";
import { Controller } from "./controller";
import { MovingPoint, Point } from "../types";
import { Collider } from "./collider";
import { Scoreboard } from "./scoreboard";
import { Background } from "./background";
import { Viewport } from "./viewport";
import { Sound } from "./sound";
import { Menu } from "./menu";
import { Volume } from "./volume";
import { Platform } from "./platform";
import { ScoreHistory } from "./scoreHistory";
import { WalletService } from "../wallet";

export class Renderer {
  // Constants
  private static defaultGravity: number = 0.2;
  private static gameWidth: number = 480;
  private static minimumPlatformReboundSpeed: number = 10;
  private static timescale: number = 16;
  private static readonly FPS = 60;
  private static readonly FRAME_TIME = 1000 / Renderer.FPS;
  private static readonly DEATH_SCREEN_DURATION: number = 4000; // 4 seconds in milliseconds

  // Rendering references
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  // State
  private isRunning: boolean = false;
  private player: Player;
  private platform: Platform;
  private scoreboard: Scoreboard;
  private background: Background;
  private menu: Menu;
  private viewport: Viewport;
  private lastTimestamp: number = 0;
  private lastFps: number = 0;
  private backgroundMusic: Sound;
  private deathSound: Sound;
  private volume: Volume;
  private controller: Controller;
  private scoreHistory: ScoreHistory;
  private animationFrameId: number | null = null;
  private walletService: WalletService;
  private lastLogTime: number = 0;
  private lastFrameTime: number = 0;
  private isDeathScreen: boolean = false;
  private deathScreenTimer: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    controller: Controller,
    walletService: WalletService
  ) {
    console.log("Renderer initialized with wallet service:", walletService);
    this.canvas = canvas;
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.controller = controller;
    this.walletService = walletService;

    this.volume = new Volume(
      {
        x: this.canvas.width,
        y: this.canvas.height,
      },
      controller
    );

    this.backgroundMusic = this.volume.createSound("snd/music.mp3", {
      isLooping: true,
    });
    this.backgroundMusic.play();

    this.deathSound = this.volume.createSound("snd/death.mp3", {});

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
          this.isDeathScreen = false;
          this.startBackgroundMusic();
          this.isRunning = true;
          console.log("Game started, isRunning:", this.isRunning);
        }
      },
      this.volume,
      walletService
    );

    this.viewport = new Viewport(
      this.context,
      [this.background, this.scoreboard],
      [],
      [this.player, this.platform]
    );

    this.platform.viewport = this.viewport;

    let originalOnMove: (amountMoved: Point) => void = this.player.onMove;
    this.player.onMove = (amountMoved: Point) => {
      this.viewport.SlideUpTo(-this.player.yPosition + 50);
      this.background.SlideUpTo(-this.player.yPosition);

      if (this.player.yPosition > -(this.viewport.offset - this.canvas.height)) {
        this.isRunning = false;
        this.isDeathScreen = true;
        this.deathScreenTimer = performance.now();
        this.stopBackgroundMusic();
        this.deathSound.play();
      }

      if (originalOnMove) {
        originalOnMove(amountMoved);
      }
    };

    this.scoreHistory = new ScoreHistory();
  }

  public Start(): void {
    console.log("Renderer Start called, isRunning:", this.isRunning);
    if (this.isRunning) return;
    requestAnimationFrame((time: number) => this.Tick(time));
  }

  public Stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
  }

  private Tick(timestamp: number): void {
    let deltaTime: number = this.lastTimestamp
      ? timestamp - this.lastTimestamp
      : 0;
    let scaledTime: number = deltaTime / Renderer.timescale;
    this.lastTimestamp = timestamp;
    this.lastFps = Math.round(1000 / deltaTime);

    this.Draw();

    if (this.isRunning) {
      this.player.Tick(scaledTime);
      this.platform.Tick(scaledTime);
      Collider.processCollisions([this.player, this.platform]);
    }

    this.controller.clearClick();
    requestAnimationFrame((time: number) => this.Tick(time));
  }

  private Draw(): void {
    if (this.isRunning) {
      this.viewport.Render(this.lastFps);
    } else if (this.isDeathScreen) {
      this.viewport.Render(this.lastFps);
      
      this.context.save();
      this.context.fillStyle = "rgba(255, 0, 0, 0.3)";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.context.font = "60px Oswald";
      this.context.fillStyle = "white";
      this.context.textAlign = "center";
      this.context.fillText("YOU'RE BROKE BOI", this.canvas.width / 2, this.canvas.height / 2);
      
      if (performance.now() - this.deathScreenTimer >= Renderer.DEATH_SCREEN_DURATION) {
        this.isDeathScreen = false;
        this.scoreHistory.addScore(
          this.scoreboard.totalPoints,
          this.player.fillColor
        );
        this.menu.showMenu(this.scoreboard.totalPoints, this.player.fillColor);
      }
      this.context.restore();
    } else {
      this.menu.Render(this.context);
    }

    this.volume.Render(this.context);
  }

  private stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  private startBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.play();
    }
  }
}
