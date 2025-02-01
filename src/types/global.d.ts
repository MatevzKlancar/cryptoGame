import { Transaction } from "@solana/web3.js";

declare global {
  interface Window {
    Buffer: typeof Buffer;
    solana?: {
      isConnected: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      signTransaction(transaction: Transaction): Promise<Transaction>;
      on(event: string, callback: () => void): void;
      publicKey?: { toString(): string };
    };
  }
}
