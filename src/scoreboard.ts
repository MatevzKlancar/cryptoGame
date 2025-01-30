export class Scoreboard {
  private score: number;
  private highScore: number;
  private element: HTMLElement;

  constructor() {
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("highScore") || "0");
    this.element = document.getElementById("score") as HTMLElement;
  }

  update() {
    this.score++;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("highScore", this.highScore.toString());
    }
    this.element.textContent = `Score: ${Math.floor(
      this.score / 10
    )} | High Score: ${Math.floor(this.highScore / 10)}`;
  }

  reset() {
    this.score = 0;
  }
}
