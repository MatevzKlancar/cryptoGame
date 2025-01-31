import { createRoot } from "react-dom/client";
import React from "react";
import { supabase } from "@/lib/supabase";

// Add Phantom wallet type definition
declare global {
  interface Window {
    solana?: {
      isConnected: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      publicKey?: { toString(): string };
    };
  }
}

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
      console.log("Checking high score for:", points);
      try {
        // First get the current high score
        const { data: currentHighScore } = await supabase
          .from("player_scores")
          .select("score")
          .eq("wallet_address", wallet.publicKey.toString())
          .order("score", { ascending: false })
          .limit(1)
          .single();

        // Only save if it's a new high score
        if (!currentHighScore || points > currentHighScore.score) {
          console.log("New high score! Saving:", points);
          const { error } = await supabase.from("player_scores").upsert(
            {
              wallet_address: wallet.publicKey.toString(),
              score: points,
            },
            {
              onConflict: "wallet_address", // This requires a unique constraint on wallet_address
              ignoreDuplicates: false,
            }
          );

          if (error) {
            console.error("Error saving high score:", error);
          } else {
            console.log("High score saved successfully");
          }
        } else {
          console.log(
            "Not a new high score. Current best:",
            currentHighScore.score
          );
        }
      } catch (error) {
        console.error("Error handling high score:", error);
      }
    }
  }

  private updateScoreDisplay(): void {
    this.root.render(<ScoreHistoryComponent scores={this.scores} />);
  }
}
