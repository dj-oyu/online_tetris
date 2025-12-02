import { Server, Socket } from 'socket.io';
import { RoomManager } from '../room/RoomManager';
import { Room, RoomState } from '../room/Room';

interface UserData {
  id: string;
  username: string;
  roomId: string | null;
}

// ソケット接続とユーザーIDのマッピング
const socketToUser = new Map<string, UserData>();

// 各プレイヤーの最後の自動落下時刻を記録（key: playerId）
const lastAutoDropTime = new Map<string, number>();

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  // 定期的なゲーム状態の更新
  setInterval(() => {
    const activeRooms = roomManager.getActiveRooms();
    const currentTime = Date.now();

    for (const room of activeRooms) {
      // 強制スタート判定
      if (
        room.getState() === RoomState.WAITING &&
        room.getPlayerCount() >= 1 &&
        room.getFirstJoinElapsedSec() !== null &&
        room.getFirstJoinElapsedSec()! >= 30
      ) {
        const now = new Date().toISOString();
        console.log(`${now} [FORCE START] room: ${room.getId()} (${room.getName()}) 30秒経過で強制スタート`);
        io.to(`room:${room.getId()}`).emit('forceStart', { message: '30秒経過で強制スタート' });
        room.forceStartGame();
      }

      if (room.getState() === RoomState.PLAYING) {
        const gameState = room.getGameState();

        // 自動落下処理：各アクティブプレイヤーについて処理
        if (gameState.isActive && gameState.activePlayers) {
          for (const playerId of gameState.activePlayers) {
            const lastDropTime = lastAutoDropTime.get(playerId) || 0;
            const timeSinceLastDrop = currentTime - lastDropTime;

            // 1秒（1000ms）経過したら自動落下
            if (timeSinceLastDrop >= 1000) {
              room.processPlayerAction(playerId, 'moveDown', {});
              lastAutoDropTime.set(playerId, currentTime);
            }
          }
        }

        // 更新されたゲーム状態を送信
        const updatedGameState = room.getGameState();
        io.to(`room:${room.getId()}`).emit('gameState', updatedGameState);

        // ゲーム終了判定
        if (updatedGameState.winner) {
          room.endGame();
          io.to(`room:${room.getId()}`).emit('gameOver', {
            winner: updatedGameState.winner,
            playerName: updatedGameState.players[updatedGameState.winner]?.username || 'Unknown'
          });

          // 終了したプレイヤーの記録を削除
          for (const playerId of Object.keys(updatedGameState.players)) {
            lastAutoDropTime.delete(playerId);
          }
        }
      }
    }
  }, 100); // 100msごとに更新（10fps）

  // 定期的な非アクティブルームのクリーンアップ
  setInterval(() => {
    roomManager.cleanupInactiveRooms();
  }, 30 * 60 * 1000); // 30分ごとに実行

  // 接続イベント
  io.on('connection', (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    // ユーザー認証
    socket.on('auth', (data: { userId: string; username: string }) => {
      const { userId, username } = data;
      
      socketToUser.set(socket.id, {
        id: userId,
        username,
        roomId: null
      });
      
      console.log(`User authenticated: ${username} (${userId})`);
      socket.emit('authSuccess', { userId });
    });

    // ルーム一覧取得
    socket.on('getRooms', () => {
      const rooms = roomManager.getActiveRooms().map(room => room.getRoomInfo());
      socket.emit('roomList', rooms);
    });

    // ルーム作成
    socket.on('createRoom', (data: { name: string }) => {
      const user = socketToUser.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const room = roomManager.createRoom();
      
      // ルームにプレイヤーを追加
      room.addPlayer(user.id, user.username, socket.id);
      
      // ソケットをルームに参加させる
      socket.join(`room:${room.getId()}`);
      
      // ユーザーデータを更新
      user.roomId = room.getId();
      socketToUser.set(socket.id, user);
      
      // ルーム情報を返す
      socket.emit('roomCreated', room.getRoomInfo());

      // ルーム情報を作成者に即時送信（roomUpdated）
      socket.emit('roomUpdated', room.getRoomInfo());
      socket.emit('gameState', room.getGameState());

      // 全ユーザーにルーム一覧を更新
      io.emit('roomListUpdated');
      
      console.log(`Room created: ${room.getId()} by ${user.username}`);
    });

    // ルーム参加
    socket.on('joinRoom', (data: { roomId: string }, callback?: (result: { success: boolean; message?: string }) => void) => {
      const user = socketToUser.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'Not authenticated' });
        callback?.({ success: false, message: 'Not authenticated' });
        return;
      }

      const room = roomManager.getRoom(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        callback?.({ success: false, message: 'Room not found' });
        return;
      }
      
      // 現在のルームから退出
      if (user.roomId) {
        leaveCurrentRoom(socket, user, roomManager);
      }
      
      // ルームにプレイヤーを追加
      const isPlayer = room.addPlayer(user.id, user.username, socket.id);
      
      // ソケットをルームに参加させる
      socket.join(`room:${room.getId()}`);
      
      // ユーザーデータを更新
      user.roomId = room.getId();
      socketToUser.set(socket.id, user);
      
      // ルーム情報を全プレイヤーに通知
      io.to(`room:${room.getId()}`).emit('roomUpdated', room.getRoomInfo());
      io.to(`room:${room.getId()}`).emit('gameState', room.getGameState());

      callback?.({ success: true });
      
      // プレイヤー参加を通知
      socket.to(`room:${room.getId()}`).emit('playerJoined', {
        playerId: user.id,
        username: user.username,
        isPlayer
      });
      
      // ゲーム状態を新しいプレイヤーに送信
      if (room.getState() === RoomState.PLAYING) {
        socket.emit('gameState', room.getGameState());
      }
      
      const now = new Date().toISOString();
      console.log(`${now} [JOIN] ${user.username} joined room: ${room.getId()}`);
    });

    // ルーム・ゲーム状態の再同期（初期マウント時などに使用）
    socket.on('syncRoomState', () => {
      const user = socketToUser.get(socket.id);
      if (!user || !user.roomId) return;

      const room = roomManager.getRoom(user.roomId);
      if (!room) return;

      socket.emit('roomUpdated', room.getRoomInfo());
      socket.emit('gameState', room.getGameState());
    });

    // ルーム退出
    socket.on('leaveRoom', () => {
      const user = socketToUser.get(socket.id);
      if (!user || !user.roomId) return;
      
      leaveCurrentRoom(socket, user, roomManager);
    });

    // プレイヤー準備完了
    socket.on('playerReady', (data: { ready: boolean }) => {
      const user = socketToUser.get(socket.id);
      if (!user || !user.roomId) return;
      
      const room = roomManager.getRoom(user.roomId);
      if (!room) return;
      
      room.setPlayerReady(user.id, data.ready);
      
      // ルーム情報を全プレイヤーに通知
      io.to(`room:${room.getId()}`).emit('roomUpdated', room.getRoomInfo());
    });

    // ゲームアクション
    socket.on('gameAction', (data: { action: string; data?: any }) => {
      const user = socketToUser.get(socket.id);
      if (!user || !user.roomId) return;
      
      const room = roomManager.getRoom(user.roomId);
      if (!room || room.getState() !== RoomState.PLAYING) return;
      
      // プレイヤーアクションを処理
      const success = room.processPlayerAction(user.id, data.action, data.data);
      
      if (success) {
        // アクションが成功した場合、全プレイヤーにゲーム状態を送信
        const gameState = room.getGameState();
        io.to(`room:${room.getId()}`).emit('gameState', gameState);
        
        // ゲームが終了した場合、ルーム状態を更新
        if (gameState.winner) {
          room.endGame();
          io.to(`room:${room.getId()}`).emit('gameOver', {
            winner: gameState.winner,
            playerName: gameState.players[gameState.winner]?.username || 'Unknown'
          });
        }
      }
    });

    // チャットメッセージ
    socket.on('chatMessage', (data: { message: string }) => {
      const user = socketToUser.get(socket.id);
      if (!user || !user.roomId) return;
      
      io.to(`room:${user.roomId}`).emit('chatMessage', {
        playerId: user.id,
        username: user.username,
        message: data.message,
        timestamp: Date.now()
      });
    });

    // 切断
    socket.on('disconnect', (reason) => {
      const user = socketToUser.get(socket.id);
      if (user && user.roomId) {
        leaveCurrentRoom(socket, user, roomManager);
      }
      socketToUser.delete(socket.id);
      console.log(`Disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
}

// 現在のルームから退出する
function leaveCurrentRoom(socket: Socket, user: UserData, roomManager: RoomManager): void {
  if (!user.roomId) return;

  // ルームから退出
  socket.leave(`room:${user.roomId}`);

  const roomObj = roomManager.getRoom(user.roomId);
  if (roomObj) {
    roomObj.removePlayer(user.id);

    // 自動落下タイマーの記録を削除
    lastAutoDropTime.delete(user.id);

    // プレイヤー退出を通知
    socket.to(`room:${user.roomId}`).emit('playerLeft', {
      playerId: user.id,
      username: user.username
    });

    // ルーム情報を更新
    socket.to(`room:${user.roomId}`).emit('roomUpdated', roomObj.getRoomInfo());

    // 退出イベントを必ず出力
    const now = new Date().toISOString();
    console.log(`${now} [LEAVE] ${user.username} left room: ${user.roomId}`);

    // ルームが空になったら削除
    if (roomObj.getPlayerCount() === 0) {
      roomManager.removeRoom(user.roomId);
      const now = new Date().toISOString();
      console.log(`${now} [REMOVE] Room removed: ${user.roomId}`);
    }
  }

  // ユーザーデータを更新
  user.roomId = null;
  socketToUser.set(socket.id, user);
}
