import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { RoomManager } from '../../room/RoomManager';
import { setupSocketHandlers } from '../../socket/handlers';

// Suppress console.log during tests
const originalLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
});

describe('Socket.IO Integration Tests', () => {
  let io: SocketIOServer;
  let httpServer: HttpServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let serverPort: number;
  let roomManager: RoomManager;

  beforeAll((done) => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
      },
    });

    roomManager = new RoomManager();
    setupSocketHandlers(io, roomManager);

    httpServer.listen(() => {
      const address = httpServer.address() as AddressInfo;
      serverPort = address.port;
      done();
    });
  });

  afterAll((done) => {
    io.close(() => {
      httpServer.close(() => {
        done();
      });
    });
  });

  beforeEach((done) => {
    // Clear room manager before each test
    roomManager = new RoomManager();

    // Connect first client
    clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
      transports: ['websocket'],
    });

    clientSocket1.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (clientSocket1 && clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
  });

  describe('Authentication', () => {
    it('should authenticate user successfully', (done) => {
      clientSocket1.emit('auth', { userId: 'user1', username: 'TestUser1' });

      clientSocket1.on('authSuccess', (data) => {
        expect(data.userId).toBe('user1');
        done();
      });
    });

    it('should handle multiple user authentication', (done) => {
      let authCount = 0;

      clientSocket1.emit('auth', { userId: 'user1', username: 'TestUser1' });

      clientSocket1.on('authSuccess', () => {
        authCount++;
        if (authCount === 2) done();
      });

      // Connect second client
      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'TestUser2' });
      });

      clientSocket2.on('authSuccess', () => {
        authCount++;
        if (authCount === 2) done();
      });
    });
  });

  describe('Room Operations', () => {
    beforeEach((done) => {
      // Authenticate before room operations
      clientSocket1.emit('auth', { userId: 'user1', username: 'TestUser1' });
      clientSocket1.on('authSuccess', () => {
        done();
      });
    });

    it('should create a room', (done) => {
      clientSocket1.emit('createRoom', { name: 'Test Room' });

      clientSocket1.on('roomCreated', (roomInfo) => {
        expect(roomInfo).toBeDefined();
        expect(roomInfo.id).toBeDefined();
        expect(roomInfo.playerCount).toBe(1);
        done();
      });
    });

    it('should emit roomListUpdated when room is created', (done) => {
      clientSocket1.on('roomListUpdated', () => {
        done();
      });

      clientSocket1.emit('createRoom', { name: 'Test Room' });
    });

    it('should get list of rooms', (done) => {
      // First create a room
      clientSocket1.emit('createRoom', { name: 'Test Room' });

      clientSocket1.on('roomCreated', () => {
        // Then request room list
        clientSocket1.emit('getRooms');
      });

      clientSocket1.on('roomList', (rooms) => {
        expect(Array.isArray(rooms)).toBe(true);
        expect(rooms.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return error when creating room without authentication', (done) => {
      const unauthClient = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      unauthClient.on('connect', () => {
        unauthClient.emit('createRoom', { name: 'Test Room' });
      });

      unauthClient.on('error', (error) => {
        expect(error.message).toBe('Not authenticated');
        unauthClient.disconnect();
        done();
      });
    });
  });

  describe('Room Join/Leave', () => {
    let roomId: string;

    beforeEach((done) => {
      // Authenticate and create room
      clientSocket1.emit('auth', { userId: 'user1', username: 'TestUser1' });

      clientSocket1.on('authSuccess', () => {
        clientSocket1.emit('createRoom', { name: 'Test Room' });
      });

      clientSocket1.on('roomCreated', (roomInfo) => {
        roomId = roomInfo.id;
        done();
      });
    });

    it('should allow second player to join room', (done) => {
      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'TestUser2' });
      });

      clientSocket2.on('authSuccess', () => {
        clientSocket2.emit('joinRoom', { roomId });
      });

      clientSocket2.on('roomUpdated', (roomInfo) => {
        expect(roomInfo.playerCount).toBe(2);
        done();
      });
    });

    it('should broadcast playerJoined to existing players', (done) => {
      clientSocket1.on('playerJoined', (data) => {
        expect(data.username).toBe('TestUser2');
        done();
      });

      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'TestUser2' });
      });

      clientSocket2.on('authSuccess', () => {
        clientSocket2.emit('joinRoom', { roomId });
      });
    });

    it('should handle player leaving room', (done) => {
      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'TestUser2' });
      });

      clientSocket2.on('authSuccess', () => {
        clientSocket2.emit('joinRoom', { roomId });
      });

      clientSocket2.on('roomUpdated', () => {
        // Once joined, leave the room
        clientSocket2.emit('leaveRoom');
      });

      clientSocket1.on('playerLeft', (data) => {
        expect(data.username).toBe('TestUser2');
        done();
      });
    });

    it('should support callback parameter on joinRoom for success', (done) => {
      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'TestUser2' });
      });

      clientSocket2.on('authSuccess', () => {
        clientSocket2.emit('joinRoom', { roomId }, (result: { success: boolean; message?: string }) => {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          done();
        });
      });
    });

    it('should support callback parameter on joinRoom for failure', (done) => {
      clientSocket1.emit('joinRoom', { roomId: 'invalid-room-id' }, (result: { success: boolean; message?: string }) => {
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        done();
      });
    });

    it('should handle syncRoomState event', (done) => {
      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'TestUser2' });
      });

      clientSocket2.on('authSuccess', () => {
        clientSocket2.emit('joinRoom', { roomId });
      });

      let receivedEvents = 0;

      clientSocket2.on('roomUpdated', (roomInfo) => {
        receivedEvents++;
        if (receivedEvents === 1) {
          // First roomUpdated from joining
          expect(roomInfo).toBeDefined();
          // Request sync
          clientSocket2.emit('syncRoomState');
        } else if (receivedEvents === 2) {
          // Second roomUpdated from syncRoomState
          expect(roomInfo).toBeDefined();
          expect(roomInfo.playerCount).toBe(2);
          done();
        }
      });
    });
  });

  describe('Game Flow', () => {
    let roomId: string;

    beforeEach((done) => {
      let setupComplete = 0;

      // Setup client 1
      clientSocket1.emit('auth', { userId: 'user1', username: 'Player1' });

      clientSocket1.on('authSuccess', () => {
        clientSocket1.emit('createRoom', { name: 'Game Room' });
      });

      clientSocket1.on('roomCreated', (roomInfo) => {
        roomId = roomInfo.id;
        setupComplete++;
        if (setupComplete === 2) done();
      });

      // Setup client 2
      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('auth', { userId: 'user2', username: 'Player2' });
      });

      clientSocket2.on('authSuccess', () => {
        setupComplete++;
        if (setupComplete === 2) done();
      });
    });

    it('should handle player ready state', (done) => {
      clientSocket2.emit('joinRoom', { roomId });

      clientSocket2.on('roomUpdated', () => {
        clientSocket1.emit('playerReady', { ready: true });
      });

      clientSocket1.on('roomUpdated', (roomInfo) => {
        // Check that room state updated
        expect(roomInfo).toBeDefined();
        done();
      });
    });

    it('should handle chat messages', (done) => {
      clientSocket2.emit('joinRoom', { roomId });

      clientSocket2.on('roomUpdated', () => {
        clientSocket1.emit('chatMessage', { message: 'Hello World!' });
      });

      clientSocket2.on('chatMessage', (data) => {
        expect(data.username).toBe('Player1');
        expect(data.message).toBe('Hello World!');
        done();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach((done) => {
      clientSocket1.emit('auth', { userId: 'user1', username: 'TestUser1' });
      clientSocket1.on('authSuccess', () => {
        done();
      });
    });

    it('should return error when joining non-existent room', (done) => {
      clientSocket1.emit('joinRoom', { roomId: 'non-existent-room-id' });

      clientSocket1.on('error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });
    });

    it('should return error when performing actions without authentication', (done) => {
      const unauthClient = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      unauthClient.on('connect', () => {
        unauthClient.emit('joinRoom', { roomId: 'any-room-id' });
      });

      unauthClient.on('error', (error) => {
        expect(error.message).toBe('Not authenticated');
        unauthClient.disconnect();
        done();
      });
    });
  });
});
