export enum DonutType {
  STRAWBERRY = 'STRAWBERRY',
  VANILLA = 'VANILLA',
  LEMON = 'LEMON',
  CHOCOLATE = 'CHOCOLATE',
  MATCHA = 'MATCHA',
  SODA = 'SODA',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  RAINBOW = 'RAINBOW'
}

export interface GameAsset {
  id: string;
  url: string;
  type: 'background' | 'donut';
  donutType?: DonutType;
}

export interface GridCell {
  id: string; // Unique ID for React keys
  type: DonutType;
  isMatched: boolean;
  isNew?: boolean; // Controls drop animation entry
  special?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'RAINBOW';
}

export type Grid = GridCell[][];

export interface Position {
  row: number;
  col: number;
}

export enum GameState {
  INIT = 'INIT',
  GENERATING_ASSETS = 'GENERATING_ASSETS',
  READY = 'READY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN'
}