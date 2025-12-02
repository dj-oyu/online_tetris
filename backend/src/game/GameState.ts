// ゲーム状態の型定義
export interface Point {
    x: number;
    y: number;
  }
  
  export enum TetrominoType {
    I = 'I',
    J = 'J',
    L = 'L',
    O = 'O',
    S = 'S',
    T = 'T',
    Z = 'Z'
  }
  
  export interface Tetromino {
    type: TetrominoType;
    position: Point;
    rotation: number;
  }
  
  export interface PlayerState {
    id: string;
    username: string;
    board: number[][];
    score: number;
    linesCleared: number;
    currentPiece: Tetromino | null;
    nextPiece: TetrominoType;
    isGameOver: boolean;
    penaltiesGiven: number;
    penaltiesReceived: number;
  }
  
  export interface MiniBoardState {
    density: number;  // 埋まり率
    height: number;   // 平均の高さ
    penaltyLevel: number; // ペナルティの受けやすさ（スコアベース）
  }
  
  export interface GameState {
    id: string;
    players: Record<string, PlayerState>;
    activePlayers: string[];
    spectators: string[];
    startTime: number;
    isActive: boolean;
    winner: string | null;
  }
