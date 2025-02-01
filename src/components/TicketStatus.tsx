import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { supabase } from "@/lib/supabase";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

export const TicketStatus: React.FC = () => {
  const { walletService } = useWallet();
  const [ticketAmount, setTicketAmount] = useState(1);
  const [remainingTickets, setRemainingTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!walletService?.isConnected()) return;

      const walletAddress = walletService.getWalletAddress();
      if (!walletAddress) return;

      try {
        // Load tickets
        const { data } = await supabase
          .from("player_tickets")
          .select("remaining_tickets")
          .eq("wallet_address", walletAddress)
          .single();

        setRemainingTickets(data?.remaining_tickets || 0);

        // Load USDC balance
        const connection = new Connection("https://api.devnet.solana.com");
        const userTokenAccount = await getAssociatedTokenAddress(
          new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"),
          new PublicKey(walletAddress)
        );

        try {
          const account = await getAccount(connection, userTokenAccount);
          setUsdcBalance(Number(account.amount) / 1_000_000); // Convert from lamports
        } catch (e) {
          setUsdcBalance(0); // Account doesn't exist or has no balance
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
    window.addEventListener("ticketsUpdated", loadData);
    return () => window.removeEventListener("ticketsUpdated", loadData);
  }, [walletService]);

  const handleBuyTickets = async () => {
    if (!walletService?.isConnected() || loading) return;

    setLoading(true);
    try {
      const success = await walletService.buyTickets(ticketAmount);
      if (success) {
        window.dispatchEvent(new Event("ticketsUpdated"));
      }
    } catch (error) {
      console.error("Error buying tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if wallet is not connected
  if (!walletService?.isConnected() || !walletService.getWalletAddress()) {
    return null;
  }

  return (
    <div className="ticket-status">
      <div className="ticket-info">
        <span>Competition Tickets: {remainingTickets}</span>
        {usdcBalance !== null && (
          <span>USDC Balance: {usdcBalance.toFixed(2)}</span>
        )}
        <div className="tooltip">
          ⓘ
          <span className="tooltip-text">
            1 USDC = 1 Ticket. Use tickets to record your scores on the
            leaderboard!
          </span>
        </div>
      </div>

      <div className="ticket-purchase">
        <input
          type="number"
          min="1"
          max="100"
          value={ticketAmount}
          onChange={(e) =>
            setTicketAmount(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="ticket-amount-input"
        />
        <button
          className="buy-tickets-btn"
          onClick={handleBuyTickets}
          disabled={
            loading || (usdcBalance !== null && usdcBalance < ticketAmount)
          }
        >
          {loading ? "Buying..." : `Buy Tickets (${ticketAmount} USDC)`}
        </button>
      </div>
    </div>
  );
};
