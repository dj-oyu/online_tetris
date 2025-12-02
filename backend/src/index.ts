import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './room/RoomManager';
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const server = http.createServer(app);

// CORSの設定
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Socket.IOサーバーの設定
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  path: '/socket.io'
});

// ルームマネージャーの初期化
const roomManager = new RoomManager();

// ソケットハンドラーの設定
setupSocketHandlers(io, roomManager);

// Engine.IOレベルの接続ログ
io.engine.on('connection', (rawSocket) => {
  console.log('[Engine.IO] raw connection:', rawSocket.id, rawSocket.request.headers['user-agent']);
  rawSocket.on('close', (reason: string) => {
    console.log('[Engine.IO] raw disconnected:', rawSocket.id, 'reason:', reason);
  });
});

// （重複する接続ログの削除。setupSocketHandlers側で一元管理）

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// サーバー起動
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// プロセス終了時の処理
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
