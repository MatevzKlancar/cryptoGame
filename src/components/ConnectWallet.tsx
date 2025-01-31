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
    <div className="wallet-info-container">
      <button
        onClick={handleConnect}
        className="connect-wallet-btn"
      >
        {isConnected ? "Connected" : "Connect Wallet"}
      </button>
      {isConnected && (
        <div className="wallet-info">
          {walletService.getWalletAddress() && (
            <span>
              Wallet: {walletService.getWalletAddress()?.slice(0, 4)}...
              {walletService.getWalletAddress()?.slice(-4)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
