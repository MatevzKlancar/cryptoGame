import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  wallet_address: string;
  score: number;
  created_at: string;
}

export const Leaderboard: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState<"daily" | "weekly" | "all">("all");
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("player_scores")
          .select("wallet_address, score, created_at")
          .order("score", { ascending: false })
          .limit(10);

        // Add time frame filters
        if (timeFrame === "daily") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          query = query.gte("created_at", yesterday.toISOString());
        } else if (timeFrame === "weekly") {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          query = query.gte("created_at", lastWeek.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching leaderboard:", error);
          return;
        }

        setScores(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();

    // Set up real-time subscription for new scores
    const subscription = supabase
      .channel("leaderboard_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_scores" },
        fetchScores
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [timeFrame]);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="timeframe-selector">
        <button
          className={timeFrame === "daily" ? "active" : ""}
          onClick={() => setTimeFrame("daily")}
        >
          Daily
        </button>
        <button
          className={timeFrame === "weekly" ? "active" : ""}
          onClick={() => setTimeFrame("weekly")}
        >
          Weekly
        </button>
        <button
          className={timeFrame === "all" ? "active" : ""}
          onClick={() => setTimeFrame("all")}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="scores-list">
          {scores.map((entry, index) => (
            <div
              key={`${entry.wallet_address}-${entry.created_at}`}
              className="score-entry"
            >
              <span className="rank">{index + 1}</span>
              <span className="address">
                {entry.wallet_address.slice(0, 4)}...
                {entry.wallet_address.slice(-4)}
              </span>
              <span className="score">{entry.score}</span>
            </div>
          ))}
          {scores.length === 0 && (
            <div className="no-scores">No scores yet!</div>
          )}
        </div>
      )}
    </div>
  );
};
