
export enum TreeState {
  CLOSED = 'CLOSED',
  EXPLODED = 'EXPLODED',
  ZOOMED = 'ZOOMED'
}

export interface ParticleData {
  initialPosition: [number, number, number];
  explodedPosition: [number, number, number];
  currentPosition: [number, number, number];
  type: 'sphere' | 'cube' | 'candy';
  color: string;
}

export interface PhotoData {
  id: string;
  url: string;
  texture: any;
  initialPosition: [number, number, number];
  explodedPosition: [number, number, number];
}

export interface HandGestureResult {
  gesture: 'FIST' | 'OPEN' | 'PINCH' | 'NONE';
  position: { x: number, y: number, z: number };
  rotation: { x: number, y: number, z: number };
}
