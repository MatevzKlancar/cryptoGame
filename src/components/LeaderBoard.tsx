import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";

export const LeaderBoard: React.FC = () => {
  const { walletService } = useWallet();
  const [topScores, setTopScores] = useState<
    Array<{ score: number; wallet_address: string }>
  >([]);

  useEffect(() => {
    const loadScores = async () => {
      if (walletService) {
        const scores = await walletService.getTopScores();
        setTopScores(scores);
      }
    };

    loadScores();

    // Refresh scores when new ones are added
    const handleScoreUpdate = () => {
      loadScores();
    };

    document.addEventListener("scoreUpdated", handleScoreUpdate);
    return () => {
      document.removeEventListener("scoreUpdated", handleScoreUpdate);
    };
  }, [walletService]);

  return (
    <div className="leaderboard">
      <h2>Top Scores</h2>
      <div className="scores-list">
        {topScores.map((score, index) => (
          <div key={index} className="score-item">
            <span className="rank">#{index + 1}</span>
            <span className="address">
              {score.wallet_address.slice(0, 4)}...
              {score.wallet_address.slice(-4)}
            </span>
            <span className="score">{score.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
