export interface Point {
  x: number;
  y: number;
}

export interface MovingPoint extends Point {
  dX: number;
  dY: number;
}

export interface Rectangle extends Point {
  width: number;
  height: number;
}

export interface Renderable {
  isAlive: boolean;
  Render(renderContext: CanvasRenderingContext2D): Renderable[];
}

export interface SoundOptions {
  volume?: number;
  isLooping?: boolean;
} 