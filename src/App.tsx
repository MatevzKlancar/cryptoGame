import { useEffect, useRef, useState } from "react";
import { Renderer } from "./components/renderer";
import { Controller } from "./components/controller";
import { useWallet } from "./context/WalletContext";
import { ConnectWallet } from "./components/ConnectWallet";
import "./styles/main.scss";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, walletService } = useWallet();
  const [remainingLives, setRemainingLives] = useState(
    walletService.getRemainingLives()
  );

  useEffect(() => {
    if (!canvasRef.current || !isConnected) return;

    const canvas = canvasRef.current;
    const controller = new Controller(canvas);
    const renderer = new Renderer(canvas, controller, walletService);
    renderer.Start();

    // Ensure keyboard events when loaded in an iframe (fix for itch.io)
    window.focus();
    window.onclick = () => {
      window.focus();
    };

    return () => {
      // Add cleanup if needed
      renderer.Stop();
    };
  }, [isConnected, walletService]);

  useEffect(() => {
    const updateLives = () => {
      setRemainingLives(walletService.getRemainingLives());
    };

    document.addEventListener("livesUpdated", updateLives);
    return () => {
      document.removeEventListener("livesUpdated", updateLives);
    };
  }, [walletService]);

  return (
    <div className="game-container">
      <ConnectWallet />

      {isConnected && (
        <>
          <div className="wallet-info">
            <span>
              Wallet: {walletService.getWalletAddress()?.slice(0, 4)}...
              {walletService.getWalletAddress()?.slice(-4)}
            </span>
            <span>Lives: {remainingLives}</span>
          </div>
          {remainingLives > 0 ? (
            <canvas ref={canvasRef} id="viewport" width="480" height="800" />
          ) : (
            <div className="no-lives-message">
              <h2>No more free tries remaining!</h2>
              <p>Purchase more lives to continue playing.</p>
            </div>
          )}
        </>
      )}

      {!isConnected && (
        <div className="connect-prompt">
          <h1>Please connect your wallet to play</h1>
          <p>You'll get 10 free tries!</p>
        </div>
      )}
    </div>
  );
}

export default App;
