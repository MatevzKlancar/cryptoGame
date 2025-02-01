import { createRoot } from "react-dom/client";
import React from "react";
import { supabase } from "@/lib/supabase";

interface Score {
  points: number;
  color: string;
}

const ScoreHistoryComponent: React.FC<{ scores: Score[] }> = ({ scores }) => {
  return (
    <div className="score-history">
      <h2>Recent Scores</h2>
      {scores.map((score, index) => (
        <div key={index} className="score-item" style={{ color: score.color }}>
          {score.points}
        </div>
      ))}
    </div>
  );
};

export class ScoreHistory {
  private scores: Score[] = [];
  private maxScores: number = 8;
  private container: HTMLDivElement;
  private root: any;

  constructor() {
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
    this.updateScoreDisplay();
  }

  public async addScore(points: number, color: string): Promise<void> {
    // Add to UI history
    this.scores.unshift({ points, color });
    if (this.scores.length > this.maxScores) {
      this.scores.pop();
    }
    this.updateScoreDisplay();

    // Save to database if wallet is connected
    const wallet = window.solana;
    if (wallet?.isConnected && wallet.publicKey) {
      try {
        // Check if player has tickets
        const { data: ticketData } = await supabase
          .from("player_tickets")
          .select("remaining_tickets")
          .eq("wallet_address", wallet.publicKey.toString())
          .single();

        if (ticketData && ticketData.remaining_tickets > 0) {
          console.log("Recording competitive score:", points);

          // Use a ticket first
          const { error: ticketError } = await supabase
            .from("player_tickets")
            .update({
              remaining_tickets: ticketData.remaining_tickets - 1,
              updated_at: new Date().toISOString(),
            })
            .eq("wallet_address", wallet.publicKey.toString());

          if (ticketError) {
            console.error("Error using ticket:", ticketError);
            return;
          }

          // Save the score - now with timestamp to allow multiple scores
          const { error: scoreError } = await supabase
            .from("player_scores")
            .insert([
              {
                wallet_address: wallet.publicKey.toString(),
                score: points,
                created_at: new Date().toISOString(),
              },
            ]);

          if (scoreError) {
            console.error("Error saving score:", scoreError);
          } else {
            console.log("Competitive score saved successfully");
            window.dispatchEvent(new Event("ticketsUpdated"));
          }
        } else {
          console.log("Practice run - score not recorded in leaderboard");
        }
      } catch (error) {
        console.error("Error handling score:", error);
      }
    }
  }

  private updateScoreDisplay(): void {
    this.root.render(<ScoreHistoryComponent scores={this.scores} />);
  }
}
