import {Point} from "./point";
import {Renderable} from "./renderable";
import {Player} from "./player";
import {Sprite} from "./sprite";

export class Background implements Renderable {
	public isAlive: boolean = true;
	public showArrow: boolean = false;

	private renderPosition: Point;
	private renderDimensions: Point;
	private color: string;
	private offset: number = 0;
	private staticBackground: Sprite;
	private stars1: Sprite;
	private stars2: Sprite;
	private upArrow: Sprite;
	private matrixCanvas: HTMLCanvasElement;
	private matrixCtx: CanvasRenderingContext2D;
	private matrixCharacters: string[];
	private matrixDrops: number[];
	private readonly MATRIX_FONT_SIZE = 14;

	public constructor(
		renderPosition: Point,
		renderDimensions: Point,
		color: string,
		player: Player
	) {
		this.renderPosition = renderPosition;
		this.renderDimensions = renderDimensions;
		this.color = "rgba(0, 8, 20, 0.8)";

		this.staticBackground = new Sprite("img/staticBackground.png", renderDimensions);
		this.stars1 = new Sprite("img/stars1.png", { x: renderDimensions.x, y: renderDimensions.y * 2 });
		this.stars2 = new Sprite("img/stars2.png", { x: renderDimensions.x, y: renderDimensions.y * 2 });
		this.upArrow = new Sprite("img/upArrow.png", { x: 120, y: 99 });

		// Initialize matrix effect
		this.matrixCanvas = document.createElement('canvas');
		this.matrixCanvas.width = renderDimensions.x;
		this.matrixCanvas.height = 200; // Height of matrix effect at bottom
		this.matrixCtx = this.matrixCanvas.getContext('2d')!;
		
		// Matrix setup
		this.matrixCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%".split("");
		const columns = this.matrixCanvas.width/this.MATRIX_FONT_SIZE;
		this.matrixDrops = Array(Math.floor(columns)).fill(1);
		
		// Start matrix animation
		setInterval(() => this.drawMatrix(), 35);
	}

	private drawMatrix(): void {
		// Clear with fade effect
		this.matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
		this.matrixCtx.fillRect(0, 0, this.matrixCanvas.width, this.matrixCanvas.height);
		
		// Matrix characters
		this.matrixCtx.fillStyle = '#0F0';
		this.matrixCtx.font = this.MATRIX_FONT_SIZE + "px monospace";
		
		for(let i = 0; i < this.matrixDrops.length; i++) {
			const text = this.matrixCharacters[Math.floor(Math.random() * this.matrixCharacters.length)];
			
			// Calculate opacity based on position
			const yPos = this.matrixDrops[i] * this.MATRIX_FONT_SIZE;
			const opacity = Math.min(yPos / this.matrixCanvas.height, 1);
			this.matrixCtx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
			
			this.matrixCtx.fillText(text, i * this.MATRIX_FONT_SIZE, yPos);
			
			if(yPos > this.matrixCanvas.height && Math.random() > 0.975) {
				this.matrixDrops[i] = 0;
			}
			this.matrixDrops[i]++;
		}
	}

	public SlideUpTo(y: number): void {
		if (y > this.offset) {
			this.offset = y;
		}
	}

	public Render(renderContext: CanvasRenderingContext2D): Renderable[] {
		let result: Renderable[] = [];

		result = result.concat(this.staticBackground.Render(renderContext));

		let lowerYPosition1: number = this.offset % (this.renderDimensions.y * 2);
		let upperYPosition1: number = lowerYPosition1 - (this.renderDimensions.y * 2);

		renderContext.save();
		renderContext.translate(0, lowerYPosition1);
		result = result.concat(this.stars1.Render(renderContext));
		renderContext.restore();

		renderContext.save();
		renderContext.translate(0, upperYPosition1);
		result = result.concat(this.stars1.Render(renderContext));
		renderContext.restore();

		let lowerYPosition2: number = (this.offset / 2) % (this.renderDimensions.y * 2);
		let upperYPosition2: number = lowerYPosition2 - (this.renderDimensions.y * 2);

		renderContext.save();
		renderContext.translate(0, lowerYPosition2);
		result = result.concat(this.stars2.Render(renderContext));
		renderContext.restore();

		renderContext.save();
		renderContext.translate(0, upperYPosition2);
		result = result.concat(this.stars2.Render(renderContext));
		renderContext.restore();

		if (this.showArrow && this.offset < (this.renderDimensions.y * 2)) {
			renderContext.save();

			renderContext.globalAlpha = 0.5;
			renderContext.translate(300, this.offset + 40);
			this.upArrow.Render(renderContext);

			renderContext.restore();
		}

		// Draw matrix effect at the bottom
		renderContext.drawImage(
			this.matrixCanvas, 
			0, 
			this.renderDimensions.y - this.matrixCanvas.height
		);

		return result;
	}

	public Reset(): void {
		this.showArrow = true;
		this.offset = 0;
	}
}
