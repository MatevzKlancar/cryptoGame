import { useEffect, useRef, useState } from "react";
import { Renderer } from "./components/renderer";
import { Controller } from "./components/controller";
import { useWallet } from "./context/WalletContext";
import { ConnectWallet } from "./components/ConnectWallet";
import "./styles/main.scss";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, walletService } = useWallet();
  const [remainingLives, setRemainingLives] = useState<string>("0");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState<boolean>(false);

  useEffect(() => {
    const updateLives = async () => {
      if (walletService) {
        console.log("Updating lives in App.tsx");
        const lives = await walletService.getRemainingLives();
        const hasUnlimited = await walletService.hasUnlimitedPlays();
        console.log("App.tsx state update:", {
          lives,
          hasUnlimited,
          isConnected,
        });
        setRemainingLives(lives);
        setCanPlay(parseInt(lives) > 0 || hasUnlimited);
      }
    };

    updateLives();

    const handleLivesUpdate = () => {
      console.log("Lives updated event received");
      updateLives();
    };
    document.addEventListener("livesUpdated", handleLivesUpdate);

    return () => {
      document.removeEventListener("livesUpdated", handleLivesUpdate);
    };
  }, [walletService, isConnected]);

  useEffect(() => {
    console.log("Canvas initialization check:", {
      hasCanvas: !!canvasRef.current,
      isConnected,
      hasWalletService: !!walletService,
      canPlay,
    });

    if (!canvasRef.current || !isConnected || !walletService) return;

    const canvas = canvasRef.current;
    const controller = new Controller(canvas);
    const renderer = new Renderer(canvas, controller, walletService);

    console.log("Starting renderer");
    renderer.Start();

    // Ensure keyboard events when loaded in an iframe (fix for itch.io)
    window.focus();
    window.onclick = () => {
      window.focus();
    };

    return () => {
      console.log("Cleaning up renderer");
      renderer.Stop();
    };
  }, [isConnected, walletService, canPlay]);

  useEffect(() => {
    if (walletService) {
      setWalletAddress(walletService.getWalletAddress());
    }
  }, [walletService]);

  return (
    <div className="game-container">
      <ConnectWallet />

      {isConnected && (
        <>
          <div className="wallet-info">
            {walletAddress && (
              <span>
                Wallet: {walletAddress.slice(0, 4)}...
                {walletAddress.slice(-4)}
              </span>
            )}
            <span>Lives: {remainingLives}</span>
          </div>
          {canPlay ? (
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
