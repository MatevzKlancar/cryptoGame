export class Player {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private velocity: number;
  private gravity: number;
  private isJumping: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.velocity = 0;
    this.gravity = 0.8;
    this.isJumping = false;
  }

  jump() {
    if (!this.isJumping) {
      this.velocity = -15;
      this.isJumping = true;
    }
  }

  update(groundY: number) {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (this.y + this.height > groundY) {
      this.y = groundY - this.height;
      this.velocity = 0;
      this.isJumping = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getPosition() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
