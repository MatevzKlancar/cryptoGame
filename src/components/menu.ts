import { Renderable } from "./renderable";
import { Controller, Click } from "./controller";
import { Background } from "./background";
import { Sound } from "./sound";
import { Volume } from "./volume";
import { Sprite } from "./sprite";
import { Point } from "./point";
import { WalletService } from "../wallet";

export class Menu implements Renderable {
  private static titleFontSizeInPx: number = 90;
  private static scoreFontSizeInPx: number = 50;
  private static playFontSizeInPx: number = 50;
  private static buttonWidth: number = 225;
  private static buttonHeight: number = 100;
  private static fadeInRate: number = 0.02;

  public isAlive: boolean = true;
  private renderDimensions: Point;
  private background: Background;
  private isMenuOpen: boolean;
  private playButtonPosition: Point;
  private isButtonHovered: boolean;
  private controller: Controller;
  private onStartGame: () => void;
  private opacity: number;
  private lastPoints: number | undefined;
  private scoreColor: string | undefined;
  private buttonHover: Sound;
  private buttonUnhover: Sound;
  private buttonClick: Sound;
  private controlPosition: Point;
  private controlDiagram: Sprite;
  private walletService: WalletService;
  private hasLives: boolean = true;
  private isPremium: boolean = false;
  private remainingLives: string = "10";

  public constructor(
    renderDimensions: Point,
    controller: Controller,
    background: Background,
    onStartGame: () => void,
    volume: Volume,
    walletService: WalletService
  ) {
    this.renderDimensions = renderDimensions;
    this.background = background;
    this.isMenuOpen = true;
    this.isButtonHovered = false;
    this.controller = controller;
    this.onStartGame = onStartGame;
    this.opacity = 0;
    this.walletService = walletService;

    this.playButtonPosition = {
      x: (renderDimensions.x - Menu.buttonWidth) / 2,
      y: renderDimensions.y - Menu.buttonHeight * 2 + 0.5,
    };

    this.buttonHover = volume.createSound("snd/button_on.wav", {});
    this.buttonUnhover = volume.createSound("snd/button_off.wav", {});
    this.buttonClick = volume.createSound("snd/button_click.wav", {});
    this.controlPosition = { x: 45, y: 300 };
    this.controlDiagram = new Sprite("img/controls.png", { x: 390, y: 237 });

    this.updateWalletStatus();
  }

  private async updateWalletStatus(): Promise<void> {
    if (this.walletService) {
      this.hasLives = await this.walletService.hasLivesRemaining();
      this.isPremium = await this.walletService.hasUnlimitedPlays();
      this.remainingLives = await this.walletService.getRemainingLives();
    }
  }

  public Render(renderContext: CanvasRenderingContext2D): Renderable[] {
    const mouseClick: Click | null = this.controller.getClick();
    if (
      ((mouseClick && this.isPointOnButton(mouseClick)) ||
        this.controller.isKeyPressed("enter") ||
        this.controller.isKeyPressed("e")) &&
      this.hasLives
    ) {
      this.buttonClick.play();
      this.onStartGame();
      this.updateWalletStatus();
    }

    const mousePos = this.controller.getMousePosition();
    let buttonIsNowHovered: boolean = mousePos
      ? this.isPointOnButton(mousePos)
      : false;
    if (buttonIsNowHovered && !this.isButtonHovered) {
      this.buttonHover.play();
    } else if (!buttonIsNowHovered && this.isButtonHovered) {
      this.buttonUnhover.play();
    }
    this.isButtonHovered = buttonIsNowHovered;

    this.background.Render(renderContext);
    let horizontalCenter: number = this.renderDimensions.x / 2;

    renderContext.save();
    renderContext.font = `${Menu.titleFontSizeInPx}px Oswald`;
    renderContext.fillStyle = `rgba(255,255,255,${this.opacity})`;
    renderContext.textAlign = "center";
    renderContext.fillText(
      "Quadrilactic",
      horizontalCenter,
      Menu.titleFontSizeInPx + 50
    );

    if (this.lastPoints) {
      renderContext.save();
      renderContext.font = `${Menu.scoreFontSizeInPx}px Oswald`;
      renderContext.fillStyle = this.scoreColor ?? "";
      renderContext.globalAlpha = this.opacity;
      renderContext.textAlign = "center";
      renderContext.fillText(
        `Score: ${this.lastPoints}`,
        horizontalCenter,
        Menu.titleFontSizeInPx + Menu.scoreFontSizeInPx + 70
      );
      renderContext.restore();
    }

    // Draw wallet status
    renderContext.font = "20px Oswald";
    renderContext.fillStyle = `rgba(255,255,255,${this.opacity})`;
    renderContext.fillText(
      this.isPremium
        ? "Premium Player - Unlimited Plays!"
        : `Remaining Lives: ${this.remainingLives}`,
      horizontalCenter,
      Menu.titleFontSizeInPx + Menu.scoreFontSizeInPx + 120
    );

    if (this.isButtonHovered) {
      renderContext.fillRect(
        this.playButtonPosition.x,
        this.playButtonPosition.y,
        Menu.buttonWidth,
        Menu.buttonHeight
      );
    }

    renderContext.strokeStyle = `rgba(255,255,255,${this.opacity})`;
    renderContext.lineWidth = 3;
    renderContext.strokeRect(
      this.playButtonPosition.x,
      this.playButtonPosition.y,
      Menu.buttonWidth,
      Menu.buttonHeight
    );

    renderContext.font = `${Menu.playFontSizeInPx}px Oswald`;
    renderContext.fillStyle = `${
      this.isButtonHovered ? "rgba(0,0,0," : "rgba(255,255,255,"
    }${this.opacity})`;
    renderContext.textAlign = "center";
    renderContext.fillText(
      "Play",
      horizontalCenter,
      Menu.playFontSizeInPx * 1.45 + this.playButtonPosition.y
    );

    // Draw the controls
    renderContext.globalAlpha = this.opacity;
    renderContext.translate(this.controlPosition.x, this.controlPosition.y);
    this.controlDiagram.Render(renderContext);
    renderContext.restore();

    this.opacity = Math.min(1, this.opacity + Menu.fadeInRate);
    return [];
  }

  public showMenu(totalPoints: number, scoreColor: string): void {
    this.isMenuOpen = true;
    this.opacity = 0;
    this.lastPoints = totalPoints;
    this.scoreColor = scoreColor;
    this.updateWalletStatus();
  }

  private isPointOnButton(point: Point | Click): boolean {
    return (
      point &&
      point.x > this.playButtonPosition.x &&
      point.x < this.playButtonPosition.x + Menu.buttonWidth &&
      point.y > this.playButtonPosition.y &&
      point.y < this.playButtonPosition.y + Menu.buttonHeight
    );
  }
}
