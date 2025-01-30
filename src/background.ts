export class Background {
  private obstacles: Array<{ x: number; width: number; height: number }>;
  private speed: number;
  private groundY: number;

  constructor(groundY: number) {
    this.obstacles = [];
    this.speed = 5;
    this.groundY = groundY;
    this.addObstacle();
  }

  addObstacle() {
    const minHeight = 50;
    const maxHeight = 150;
    const minWidth = 20;
    const maxWidth = 60;

    this.obstacles.push({
      x: 800,
      width: Math.random() * (maxWidth - minWidth) + minWidth,
      height: Math.random() * (maxHeight - minHeight) + minHeight,
    });
  }

  update() {
    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.speed;
      if (this.obstacles[i].x + this.obstacles[i].width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    // Add new obstacle if needed
    if (
      this.obstacles.length === 0 ||
      this.obstacles[this.obstacles.length - 1].x < 400
    ) {
      this.addObstacle();
    }

    // Increase speed over time
    this.speed += 0.001;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw ground
    ctx.fillStyle = "#333";
    ctx.fillRect(0, this.groundY, ctx.canvas.width, 2);

    // Draw obstacles
    ctx.fillStyle = "#FF5252";
    this.obstacles.forEach((obstacle) => {
      ctx.fillRect(
        obstacle.x,
        this.groundY - obstacle.height,
        obstacle.width,
        obstacle.height
      );
    });
  }

  checkCollision(player: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    return this.obstacles.some((obstacle) => {
      return (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y + player.height > this.groundY - obstacle.height
      );
    });
  }

  getGroundY() {
    return this.groundY;
  }
}
