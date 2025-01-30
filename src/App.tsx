import { useEffect, useRef } from 'react';
import { Renderer } from './components/renderer';
import { Controller } from './components/controller';
import './styles/main.scss';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const controller = new Controller(canvas);
    const renderer = new Renderer(canvas, controller);
    renderer.Start();

    // Ensure keyboard events when loaded in an iframe (fix for itch.io)
    window.focus();
    window.onclick = () => {
      window.focus();
    };

    return () => {
      // Add any cleanup if needed
    };
  }, []);

  return (
    <div className="game-container">
      <canvas 
        ref={canvasRef} 
        id="viewport" 
        width="480" 
        height="800"
      />
    </div>
  );
}

export default App; 