import React, { createContext, useContext, useState, useEffect } from "react";
import { WalletService } from "../wallet";

interface WalletContextType {
  walletService: WalletService;
  isConnected: boolean;
  remainingLives: number;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [walletService] = useState(() => new WalletService());
  const [isConnected, setIsConnected] = useState(false);
  const [remainingLives, setRemainingLives] = useState(10);

  useEffect(() => {
    // Update state when wallet connection changes
    const updateState = () => {
      setIsConnected(walletService.isConnected());
      setRemainingLives(walletService.getRemainingLives());
    };

    // Initial state
    updateState();

    // Add event listeners for wallet state changes
    document.addEventListener("walletConnected", updateState);
    document.addEventListener("walletDisconnected", updateState);

    return () => {
      document.removeEventListener("walletConnected", updateState);
      document.removeEventListener("walletDisconnected", updateState);
    };
  }, [walletService]);

  return (
    <WalletContext.Provider
      value={{ walletService, isConnected, remainingLives }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
