import React from "react";
import { useWallet } from "../context/WalletContext";

export const ConnectWallet: React.FC = () => {
  const { walletService, isConnected } = useWallet();

  const handleConnect = async () => {
    try {
      await walletService.connectWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="connect-wallet-btn"
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        padding: "10px 20px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "16px",
        zIndex: 1000,
      }}
    >
      {isConnected ? "Connected" : "Connect Wallet"}
    </button>
  );
};
