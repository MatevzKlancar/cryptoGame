import { Point } from "./point";

export class ScoreHistory {
    private scores: { points: number; color: string }[] = [];
    private maxScores: number = 8;
    private scoreContainer: HTMLDivElement | undefined;
    
    constructor() {
        this.createScoreContainer();
    }

    private createScoreContainer() {
        this.scoreContainer = document.createElement('div');
        this.scoreContainer.className = 'score-history';
        document.body.appendChild(this.scoreContainer);
        
        const title = document.createElement('h2');
        title.textContent = 'Recent Scores';
        this.scoreContainer.appendChild(title);
    }

    public addScore(points: number, color: string): void {
        this.scores.unshift({ points, color });
        if (this.scores.length > this.maxScores) {
            this.scores.pop();
        }
        this.updateScoreDisplay();
    }

    private updateScoreDisplay(): void {
        // Clear existing scores except title
        while (this.scoreContainer?.childNodes.length && this.scoreContainer?.childNodes.length > 1) {
            this.scoreContainer?.removeChild(this.scoreContainer?.lastChild as Node);
        }

        // Add each score
        this.scores.forEach(score => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-item';
            scoreElement.textContent = score.points.toString();
            scoreElement.style.color = score.color;
            this.scoreContainer?.appendChild(scoreElement);
        });
    }
} 