import { Room } from './Room';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  
  // 新しいルームを作成
  createRoom(): Room {
    const room = new Room();
    this.rooms.set(room.getId(), room);
    return room;
  }
  
  // ルームを取得
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }
  
  // すべてのルームを取得
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
  
  // アクティブなルームを取得（プレイヤーがいるルーム）
  getActiveRooms(): Room[] {
    return this.getAllRooms().filter(room => room.getPlayerCount() > 0);
  }
  
  // 参加可能なルームを取得
  getJoinableRooms(): Room[] {
    return this.getActiveRooms().filter(room => room.canJoin());
  }
  
  // ルームを削除
  removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }
  
  // 非アクティブなルームをクリーンアップ
  cleanupInactiveRooms(): number {
    let count = 0;
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.getPlayerCount() === 0 && room.isExpired()) {
        this.rooms.delete(roomId);
        count++;
      }
    }
    return count;
  }
}
