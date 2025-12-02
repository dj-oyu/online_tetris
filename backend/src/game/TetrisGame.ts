import { v4 as uuidv4 } from 'uuid';
import { GameState, PlayerState, TetrominoType, MiniBoardState } from './GameState';
import { Piece, PieceGenerator } from './Piece';
import { ScoreCalculator } from './ScoreCalculator';
import { PenaltyManager } from './PenaltyManager';

// ボードのサイズ
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

export class TetrisGame {
  private gameState: GameState;
  private pieceGenerators: Map<string, PieceGenerator> = new Map();
  private scoreCalculator: ScoreCalculator;
  private penaltyManager: PenaltyManager;

  constructor() {
    this.gameState = {
      id: uuidv4(),
      players: {},
      activePlayers: [],
      spectators: [],
      startTime: 0,
      isActive: false,
      winner: null
    };
    this.scoreCalculator = new ScoreCalculator();
    this.penaltyManager = new PenaltyManager();
  }

  // プレイヤーをゲームに追加
  addPlayer(playerId: string, username: string): boolean {
    if (this.gameState.activePlayers.length >= 8) {
      // 観戦者として追加
      if (!this.gameState.spectators.includes(playerId)) {
        this.gameState.spectators.push(playerId);
      }
      return false;
    }

    // 新しいプレイヤー用のピース生成器を作成
    const pieceGenerator = new PieceGenerator();
    this.pieceGenerators.set(playerId, pieceGenerator);

    // 最初のピースと次のピースを取得
    const nextPiece = pieceGenerator.getNextPiece();

    // プレイヤー状態を初期化
    const playerState: PlayerState = {
      id: playerId,
      username,
      board: Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(0)),
      score: 0,
      linesCleared: 0,
      currentPiece: null,
      nextPiece: nextPiece,
      isGameOver: false,
      penaltiesGiven: 0,
      penaltiesReceived: 0
    };

    // プレイヤーをゲームに追加
    this.gameState.players[playerId] = playerState;
    this.gameState.activePlayers.push(playerId);

    return true;
  }

  // プレイヤーをゲームから削除
  removePlayer(playerId: string): boolean {
    if (this.gameState.activePlayers.includes(playerId)) {
      this.gameState.activePlayers = this.gameState.activePlayers.filter(id => id !== playerId);
      delete this.gameState.players[playerId];
      this.pieceGenerators.delete(playerId);
      return true;
    } else if (this.gameState.spectators.includes(playerId)) {
      this.gameState.spectators = this.gameState.spectators.filter(id => id !== playerId);
      return true;
    }
    return false;
  }

  // ゲームを開始
  startGame(): boolean {
    if (this.gameState.activePlayers.length < 1) {
      return false;
    }

    // 各プレイヤーに最初のピースを生成
    for (const playerId of this.gameState.activePlayers) {
      const pieceGenerator = this.pieceGenerators.get(playerId);
      if (pieceGenerator) {
        const nextPiece = this.gameState.players[playerId].nextPiece;
        const newPiece = new Piece(nextPiece);
        this.gameState.players[playerId].currentPiece = newPiece.getData();
        this.gameState.players[playerId].nextPiece = pieceGenerator.getNextPiece();
      }
    }

    this.gameState.startTime = Date.now();
    this.gameState.isActive = true;
    return true;
  }

  // ゲームの現在の状態を取得
  getGameState(): GameState {
    return { ...this.gameState };
  }

  // プレイヤーのミニボード状態を計算
  getMiniBoardState(playerId: string): MiniBoardState | null {
    const playerState = this.gameState.players[playerId];
    if (!playerState) return null;

    const board = playerState.board;
    
    // 埋まり率を計算
    let filledCells = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x] !== 0) {
          filledCells++;
        }
      }
    }
    const density = filledCells / (BOARD_WIDTH * BOARD_HEIGHT);

    // 平均の高さを計算
    const heights = Array(BOARD_WIDTH).fill(0);
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (board[y][x] !== 0) {
          heights[x] = BOARD_HEIGHT - y;
          break;
        }
      }
    }
    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / BOARD_WIDTH;

    // ペナルティレベルをスコアから計算
    // スコアが高い方がペナルティも受けやすくなる
    const penaltyLevel = playerState.score / 10000; // 適当な正規化

    return {
      density,
      height: avgHeight,
      penaltyLevel
    };
  }

  // プレイヤーのアクションを処理
  processPlayerAction(playerId: string, action: string, data: any): boolean {
    if (!this.gameState.isActive || !this.gameState.activePlayers.includes(playerId)) {
      return false;
    }

    const playerState = this.gameState.players[playerId];
    if (playerState.isGameOver) {
      return false;
    }

    switch (action) {
      case 'moveLeft':
        return this.moveCurrentPiece(playerId, -1, 0);
      case 'moveRight':
        return this.moveCurrentPiece(playerId, 1, 0);
      case 'moveDown':
        return this.moveCurrentPiece(playerId, 0, 1);
      case 'rotate':
        return this.rotateCurrentPiece(playerId, data?.clockwise !== false);
      case 'hardDrop':
        return this.hardDrop(playerId);
      default:
        return false;
    }
  }

  // 現在のピースを移動
  private moveCurrentPiece(playerId: string, dx: number, dy: number): boolean {
    const playerState = this.gameState.players[playerId];
    if (!playerState || !playerState.currentPiece) return false;

    const currentPieceData = playerState.currentPiece;
    const piece = new Piece(
      currentPieceData.type,
      { ...currentPieceData.position },
      currentPieceData.rotation
    );

    // 仮に移動させて衝突チェック
    piece.move(dx, dy);
    const newPositions = piece.getShape();
    
    if (this.checkCollision(playerState.board, newPositions)) {
      // 下方向の移動で衝突した場合
      if (dy > 0) {
        // ピースを着地させる
        const landed = this.landPiece(playerId);
        // 着地後にゲームオーバーチェック
        if (landed) {
          this.checkGameOver(playerId);
        }
      }
      return false;
    }

    // 衝突しなければ位置を更新
    playerState.currentPiece.position.x += dx;
    playerState.currentPiece.position.y += dy;
    return true;
  }

  // 現在のピースを回転
  private rotateCurrentPiece(playerId: string, clockwise: boolean): boolean {
    const playerState = this.gameState.players[playerId];
    if (!playerState || !playerState.currentPiece) return false;

    const currentPieceData = playerState.currentPiece;
    const piece = new Piece(
      currentPieceData.type,
      { ...currentPieceData.position },
      currentPieceData.rotation
    );

    // 仮に回転させて衝突チェック
    piece.rotate(clockwise);
    const newPositions = piece.getShape();
    
    if (this.checkCollision(playerState.board, newPositions)) {
      // 壁蹴りを試みる
      const wallKickOffsets = [
        { x: 1, y: 0 },  // 右
        { x: -1, y: 0 }, // 左
        { x: 0, y: -1 }, // 上
        { x: 2, y: 0 },  // 右2
        { x: -2, y: 0 }  // 左2
      ];

      let kicked = false;
      for (const offset of wallKickOffsets) {
        piece.move(offset.x, offset.y);
        const kickedPositions = piece.getShape();
        
        if (!this.checkCollision(playerState.board, kickedPositions)) {
          // 壁蹴り成功
          playerState.currentPiece.rotation = piece.getData().rotation;
          playerState.currentPiece.position.x += offset.x;
          playerState.currentPiece.position.y += offset.y;
          kicked = true;
          break;
        }
        
        // 元に戻して次のオフセットを試す
        piece.move(-offset.x, -offset.y);
      }

      return kicked;
    }

    // 衝突しなければ回転を更新
    playerState.currentPiece.rotation = piece.getData().rotation;
    return true;
  }

  // ハードドロップ（即時着地）
  private hardDrop(playerId: string): boolean {
    const playerState = this.gameState.players[playerId];
    if (!playerState || !playerState.currentPiece) return false;

    // 着地するまで下に移動
    let dropDistance = 0;
    while (this.moveCurrentPiece(playerId, 0, 1)) {
      dropDistance++;
    }

    // ピースを着地させる
    return this.landPiece(playerId);
  }

  // ピースを着地させる
  private landPiece(playerId: string): boolean {
    const playerState = this.gameState.players[playerId];
    if (!playerState || !playerState.currentPiece) return false;

    const currentPieceData = playerState.currentPiece;
    const piece = new Piece(
      currentPieceData.type,
      { ...currentPieceData.position },
      currentPieceData.rotation
    );

    // ピースの位置を盤面に反映
    const positions = piece.getShape();
    const color = piece.getColor();
    
    for (const pos of positions) {
      if (pos.y >= 0 && pos.y < BOARD_HEIGHT && pos.x >= 0 && pos.x < BOARD_WIDTH) {
        playerState.board[pos.y][pos.x] = color;
      }
    }

    // ライン消去チェック
    const linesCleared = this.checkLines(playerId);
    
    if (linesCleared > 0) {
      // スコア加算
      const scoreIncrease = this.scoreCalculator.calculateScore(linesCleared);
      playerState.score += scoreIncrease;
      playerState.linesCleared += linesCleared;
      
      // ペナルティ発動チェック（2ライン以上消した場合）
      if (linesCleared >= 2) {
        this.applyPenalty(playerId, linesCleared);
      }
    }

    // 次のピースを生成
    this.generateNextPiece(playerId);
    
    // ゲームオーバーチェックは移動失敗時に行うため、ここでは削除
    // this.checkGameOver(playerId); 
    
    // 勝者チェック
    this.checkWinner();
    
    return true;
  }

  // ライン消去チェック
  private checkLines(playerId: string): number {
    const playerState = this.gameState.players[playerId];
    const board = playerState.board;
    const linesToClear: number[] = [];

    // 消去すべきライン（完全に埋まった行）を検出
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y].every(cell => cell !== 0)) {
        linesToClear.push(y);
      }
    }

    // ラインを消去して上の行を落とす
    for (const line of linesToClear) {
      // 指定された行を消去
      for (let y = line; y > 0; y--) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = board[y - 1][x];
        }
      }
      // 最上段は空にする
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[0][x] = 0;
      }
    }

    return linesToClear.length;
  }

  // 次のピースを生成
  private generateNextPiece(playerId: string): boolean {
    const playerState = this.gameState.players[playerId];
    const pieceGenerator = this.pieceGenerators.get(playerId);
    
    if (!playerState || !pieceGenerator) return false;
    
    const nextPiece = playerState.nextPiece;
    playerState.currentPiece = new Piece(nextPiece).getData();
    playerState.nextPiece = pieceGenerator.getNextPiece();
    
    return true;
  }

  // 衝突チェック
  private checkCollision(board: number[][], positions: { x: number, y: number }[]): boolean {
    for (const pos of positions) {
      // 盤面の外に出た場合
      if (pos.x < 0 || pos.x >= BOARD_WIDTH || pos.y >= BOARD_HEIGHT) {
        return true;
      }
      
      // 既存のブロックと衝突した場合（ただし上部は無視）
      if (pos.y >= 0 && board[pos.y][pos.x] !== 0) {
        return true;
      }
    }
    return false;
  }

  // ゲームオーバーチェック
  private checkGameOver(playerId: string): boolean {
    const playerState = this.gameState.players[playerId];
    if (!playerState || !playerState.currentPiece) return false;
    
    // 新しいピースが配置時に既存ブロックと衝突する場合はゲームオーバー
    const positions = new Piece(
      playerState.currentPiece.type,
      playerState.currentPiece.position,
      playerState.currentPiece.rotation
    ).getShape();
    
    if (this.checkCollision(playerState.board, positions)) {
      playerState.isGameOver = true;
      
      // アクティブプレイヤーから観戦者へ移動
      this.gameState.activePlayers = this.gameState.activePlayers.filter(id => id !== playerId);
      this.gameState.spectators.push(playerId);
      
      return true;
    }
    
    return false;
  }

  // 勝者チェック
  private checkWinner(): boolean {
    // アクティブプレイヤーが1人だけならそのプレイヤーが勝者
    if (this.gameState.activePlayers.length === 1) {
      this.gameState.winner = this.gameState.activePlayers[0];
      this.gameState.isActive = false;
      return true;
    }
    
    // アクティブプレイヤーがいなくなった場合、最後にゲームオーバーになったプレイヤーが勝者
    if (this.gameState.activePlayers.length === 0 && this.gameState.spectators.length > 0) {
      this.gameState.winner = this.gameState.spectators[this.gameState.spectators.length - 1];
      this.gameState.isActive = false;
      return true;
    }
    
    return false;
  }

  // ペナルティの適用
  private applyPenalty(sourcePlayerId: string, linesCleared: number): boolean {
    // ペナルティ対象プレイヤーを選定
    const targetPlayerId = this.penaltyManager.selectTarget(
      sourcePlayerId,
      this.gameState.activePlayers,
      this.gameState.players
    );
    
    if (!targetPlayerId) return false;
    
    // ペナルティラインの数を決定（消したライン数によって変化）
    const penaltyLines = Math.min(linesCleared - 1, 4); // 最大4行
    
    // ペナルティラインを生成（穴の位置をランダムに設定）
    const penaltyRows = this.penaltyManager.generatePenaltyRows(penaltyLines, BOARD_WIDTH);
    
    // ターゲットプレイヤーの盤面にペナルティラインを追加
    const targetState = this.gameState.players[targetPlayerId];
    
    // 上部のラインを押し上げる
    for (let y = 0; y < BOARD_HEIGHT - penaltyLines; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        targetState.board[y][x] = targetState.board[y + penaltyLines][x];
      }
    }
    
    // 下部にペナルティラインを追加
    for (let i = 0; i < penaltyLines; i++) {
      const rowIndex = BOARD_HEIGHT - penaltyLines + i;
      targetState.board[rowIndex] = [...penaltyRows[i]];
    }
    
    // ペナルティ統計を更新
    this.gameState.players[sourcePlayerId].penaltiesGiven++;
    targetState.penaltiesReceived++;
    
    return true;
  }
}
