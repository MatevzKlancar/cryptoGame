import { Point } from "../types";
import { Click, Controller } from "./controller";
import { Background } from "./background";
import { Volume } from "./volume";
import { WalletService } from "../wallet";

export class Menu {
  private dimensions: Point;
  private controller: Controller;
  private background: Background;
  private onStart: () => void;
  private volume: Volume;
  private lastRenderTime: number = 0;
  private walletService: WalletService;
  private showingMenu: boolean = true;
  private showingControls: boolean = false;
  private score: number = 0;
  private color: string = "#FFFFFF";

  constructor(
    dimensions: Point,
    controller: Controller,
    background: Background,
    onStart: () => void,
    volume: Volume,
    walletService: WalletService
  ) {
    console.log("Menu constructor", dimensions);
    this.dimensions = dimensions;
    this.controller = controller;
    this.background = background;
    this.onStart = onStart;
    this.volume = volume;
    this.walletService = walletService;
  }

  public async Render(context: CanvasRenderingContext2D): Promise<void> {
    if (!this.showingMenu) return;

    // Draw background
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, this.dimensions.x, this.dimensions.y);

    const click = this.controller.getClick();
    const hasLives = await this.walletService.hasLivesRemaining();
    const isPremium = await this.walletService.hasUnlimitedPlays();

    if (this.showingControls) {
      // Show controls screen
      context.fillStyle = "#FFFFFF";
      context.font = "30px Oswald";
      context.textAlign = "center";
      context.fillText(
        "Controls",
        this.dimensions.x / 2,
        this.dimensions.y / 2 - 100
      );
      context.font = "20px Oswald";
      context.fillText(
        "Click and hold to move left/right",
        this.dimensions.x / 2,
        this.dimensions.y / 2 - 20
      );
      context.fillText(
        "Release to jump",
        this.dimensions.x / 2,
        this.dimensions.y / 2 + 20
      );
      context.fillText(
        "Click anywhere to start",
        this.dimensions.x / 2,
        this.dimensions.y / 2 + 80
      );

      if (click) {
        if (hasLives) {
          this.showingControls = false;
          this.showingMenu = false;
          await this.onStart();
        }
        this.controller.clearClick();
      }
      return;
    }

    // Main menu
    if (this.score > 0) {
      context.fillStyle = this.color;
      context.font = "40px Oswald";
      context.textAlign = "center";
      context.fillText(
        `Score: ${this.score}`,
        this.dimensions.x / 2,
        this.dimensions.y / 2 - 50
      );
    }

    context.fillStyle = "#FFFFFF";
    context.font = "30px Oswald";
    context.textAlign = "center";
    context.fillText(
      "Click to Play",
      this.dimensions.x / 2,
      this.dimensions.y / 2
    );

    context.font = "20px Oswald";
    context.fillText(
      isPremium
        ? "Premium Player - Unlimited Plays!"
        : `Remaining Lives: ${await this.walletService.getRemainingLives()}`,
      this.dimensions.x / 2,
      this.dimensions.y / 2 + 40
    );

    if (click && this.isClickInPlayArea(click)) {
      if (hasLives) {
        this.showingControls = true;
      }
      this.controller.clearClick();
    }
  }

  public showMenu(score: number, color: string): void {
    this.showingMenu = true;
    this.showingControls = false;
    this.score = score;
    this.color = color;
  }

  private isClickInPlayArea(click: Click): boolean {
    // Make click area larger and centered
    const buttonWidth = 300;
    const buttonHeight = 150;
    const buttonX = this.dimensions.x / 2 - buttonWidth / 2;
    const buttonY = this.dimensions.y / 2 - buttonHeight / 2;

    const isInArea =
      click.x >= buttonX &&
      click.x <= buttonX + buttonWidth &&
      click.y >= buttonY &&
      click.y <= buttonY + buttonHeight;

    console.log(
      "Click in play area:",
      isInArea,
      "Click:",
      click,
      "Button area:",
      { buttonX, buttonY, buttonWidth, buttonHeight }
    );
    return isInArea;
  }
}
