// ゲーム関連の型定義

export interface Position {
  x: number
  y: number
}

export interface PieceData {
  type: string
  position: Position
  rotation: number
}

export interface PlayerState {
  id: string
  username: string
  board: number[][]
  score: number
  linesCleared: number
  currentPiece: PieceData | null
  nextPiece: string
  isGameOver: boolean
  penaltiesGiven: number
  penaltiesReceived: number
}

export interface GameState {
  id: string
  players: { [playerId: string]: PlayerState }
  activePlayers: string[]
  spectators: string[]
  startTime: number
  isActive: boolean
  winner: string | null
}

export interface RoomInfo {
  id: string
  name: string
  state: 'waiting' | 'starting' | 'playing' | 'finished'
  players: PlayerInfo[]
  playerCount: number
  spectatorCount: number
  maxPlayers: number
}

export interface PlayerInfo {
  id: string
  username: string
  isReady: boolean
}

export interface ChatMessage {
  id: number
  playerId?: string
  username?: string
  message: string
  timestamp?: number
  system?: boolean
}
