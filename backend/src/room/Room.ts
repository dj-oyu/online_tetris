import { v4 as uuidv4 } from 'uuid';
import { TetrisGame } from '../game/TetrisGame';

// ルームの最大プレイヤー数
const MAX_PLAYERS = 8;

// ルームの状態
export enum RoomState {
  WAITING = 'waiting',
  STARTING = 'starting',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export interface RoomPlayer {
  id: string;
  username: string;
  socketId: string;
  isReady: boolean;
}

export class Room {
  private id: string;
  private name: string;
  private state: RoomState;
  private players: Map<string, RoomPlayer>;
  private spectators: Set<string>;
  private game: TetrisGame;
  private createdAt: number;
  private startCountdown: NodeJS.Timeout | null = null;
  private lastActivity: number;
  private firstJoinTimestamp: number | null = null;

  constructor(name: string = 'テトリス部屋') {
    this.id = uuidv4();
    this.name = name;
    this.state = RoomState.WAITING;
    this.players = new Map();
    this.spectators = new Set();
    this.game = new TetrisGame();
    this.createdAt = Date.now();
    this.lastActivity = this.createdAt;
  }

  // ルームIDを取得
  getId(): string {
    return this.id;
  }

  // ルーム名を取得
  getName(): string {
    return this.name;
  }

  // ルームの状態を取得
  getState(): RoomState {
    return this.state;
  }

  // プレイヤー数を取得
  getPlayerCount(): number {
    return this.players.size;
  }

  // 観戦者数を取得
  getSpectatorCount(): number {
    return this.spectators.size;
  }

  // 参加可能かどうかを確認
  canJoin(): boolean {
    return this.state === RoomState.WAITING && this.players.size < MAX_PLAYERS;
  }

  // プレイヤーをルームに追加
  addPlayer(playerId: string, username: string, socketId: string): boolean {
    // プレイヤーが既に存在する場合は更新
    if (this.players.has(playerId)) {
      const player = this.players.get(playerId)!;
      player.socketId = socketId;
      this.players.set(playerId, player);
      this.updateLastActivity();
      return true;
    }

    // ルームが満員か、ゲーム中の場合は観戦者として追加
    if (!this.canJoin()) {
      this.spectators.add(playerId);
      this.updateLastActivity();
      return false;
    }

    // 新しいプレイヤーを追加
    this.players.set(playerId, {
      id: playerId,
      username,
      socketId,
      isReady: false
    });

    // ゲームにもプレイヤーを追加
    this.game.addPlayer(playerId, username);
    this.updateLastActivity();

    // 1人目が入室したタイミングを記録
    if (this.players.size === 1 && !this.firstJoinTimestamp) {
      this.firstJoinTimestamp = Date.now();
    }

    // 2人以上のプレイヤーがいれば開始カウントダウンを始める
    if (this.players.size >= 2 && !this.startCountdown) {
      this.startGame();
    }

    return true;
  }

  // プレイヤーをルームから削除
  removePlayer(playerId: string): boolean {
    if (this.players.has(playerId)) {
      this.players.delete(playerId);
      this.game.removePlayer(playerId);
      this.updateLastActivity();
      
      // プレイヤーがいなくなったらカウントダウンを中止
      if (this.players.size < 2 && this.startCountdown) {
        clearTimeout(this.startCountdown);
        this.startCountdown = null;
        this.state = RoomState.WAITING;
      }

      // すべてのプレイヤーがいなくなったらゲーム終了
      if (this.players.size === 0) {
        this.state = RoomState.FINISHED;
        this.firstJoinTimestamp = null;
      }
      
      return true;
    } else if (this.spectators.has(playerId)) {
      this.spectators.delete(playerId);
      this.updateLastActivity();
      return true;
    }
    
    return false;
  }

  // プレイヤーの準備状態を設定
  setPlayerReady(playerId: string, isReady: boolean): boolean {
    if (!this.players.has(playerId)) return false;
    
    const player = this.players.get(playerId)!;
    player.isReady = isReady;
    this.players.set(playerId, player);
    this.updateLastActivity();
    
    // すべてのプレイヤーが準備完了したらゲーム開始
    if (this.allPlayersReady() && this.players.size >= 2) {
      this.startGame();
    }
    
    return true;
  }

  // すべてのプレイヤーが準備完了しているか確認
  allPlayersReady(): boolean {
    for (const player of this.players.values()) {
      if (!player.isReady) return false;
    }
    return this.players.size > 0;
  }

  // ゲーム開始カウントダウン
  startGame(): void {
    if (this.state !== RoomState.WAITING) return;
    
    this.state = RoomState.STARTING;
    this.updateLastActivity();

    // 5秒後にゲーム開始
    this.startCountdown = setTimeout(() => {
      this.state = RoomState.PLAYING;
      this.game.startGame();
      this.startCountdown = null;
      this.firstJoinTimestamp = null;
      this.updateLastActivity();
    }, 5000);
  }

  // ゲーム終了
  endGame(): void {
    if (this.state !== RoomState.PLAYING) return;
    
    this.state = RoomState.FINISHED;
    this.updateLastActivity();
  }

  // ゲームの状態を取得
  getGameState(): any {
    return this.game.getGameState();
  }

  // プレイヤーのアクションを処理
  processPlayerAction(playerId: string, action: string, data: any): boolean {
    if (this.state !== RoomState.PLAYING) return false;
    
    const result = this.game.processPlayerAction(playerId, action, data);
    if (result) {
      this.updateLastActivity();
    }
    
    return result;
  }

  // ルームの情報を取得
  getRoomInfo() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      playerCount: this.players.size,
      spectatorCount: this.spectators.size,
      players: Array.from(this.players.values()).map(player => ({
        id: player.id,
        username: player.username,
        isReady: player.isReady
      })),
      createdAt: this.createdAt,
      firstJoinTimestamp: this.firstJoinTimestamp
    };
  }

  // 1人目入室からの経過秒数
  getFirstJoinElapsedSec(): number | null {
    if (!this.firstJoinTimestamp) return null;
    return Math.floor((Date.now() - this.firstJoinTimestamp) / 1000);
  }

  // 強制スタート用
  forceStartGame(): void {
    if (this.state === RoomState.WAITING) {
      this.startGame();
      this.firstJoinTimestamp = null;
    }
  }

  // 最後のアクティビティ時間を更新
  private updateLastActivity(): void {
    this.lastActivity = Date.now();
  }

  // ルームの有効期限が切れているか確認
  isExpired(): boolean {
    // 2時間以上アクティビティがなければ期限切れ
    return Date.now() - this.lastActivity > 2 * 60 * 60 * 1000;
  }
}
