import React, { createContext, useContext, useState, useEffect } from "react";
import { WalletService } from "../wallet";

interface WalletContextType {
  isConnected: boolean;
  walletService: WalletService;
  connect: () => Promise<void>;
  remainingLives: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletService] = useState(() => new WalletService());
  const [remainingLives, setRemainingLives] = useState<string>("0");

  useEffect(() => {
    const updateLives = async () => {
      const lives = await walletService.getRemainingLives();
      setRemainingLives(lives);
    };

    const handleConnect = () => {
      setIsConnected(true);
      updateLives();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setRemainingLives("0");
    };

    const handleLivesUpdate = () => {
      updateLives();
    };

    document.addEventListener("walletConnected", handleConnect);
    document.addEventListener("walletDisconnected", handleDisconnect);
    document.addEventListener("livesUpdated", handleLivesUpdate);

    // Initial check
    if (walletService.isConnected()) {
      setIsConnected(true);
      updateLives();
    }

    return () => {
      document.removeEventListener("walletConnected", handleConnect);
      document.removeEventListener("walletDisconnected", handleDisconnect);
      document.removeEventListener("livesUpdated", handleLivesUpdate);
    };
  }, [walletService]);

  const connect = async () => {
    try {
      await walletService.connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletService,
        connect,
        remainingLives,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
