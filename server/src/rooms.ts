import { WebSocket } from "ws";
import { ROOM_ID_REGEX, ERROR_CODES } from "./types";

type RoomMap = Map<string, WebSocket>;

const MAX_PEERS_PER_ROOM = 2;

export class RoomManager {
  private rooms: Map<string, RoomMap> = new Map();

  private validateRoomId(roomId: string): boolean {
    return ROOM_ID_REGEX.test(roomId);
  }

  join(
    roomId: string,
    peerId: string,
    ws: WebSocket
  ): { error?: string; peers?: string[] } {
    if (!this.validateRoomId(roomId)) {
      return { error: ERROR_CODES.INVALID_ROOM };
    }

    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Map();
      this.rooms.set(roomId, room);
    }

    if (room.size >= MAX_PEERS_PER_ROOM) {
      return { error: ERROR_CODES.ROOM_FULL };
    }

    room.set(peerId, ws);
    const peers = Array.from(room.keys()).filter((id) => id !== peerId);
    return { peers };
  }

  leave(roomId: string, peerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.delete(peerId);
    if (room.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  peersOf(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.keys()) : [];
  }

  getPeerSocket(roomId: string, peerId: string): WebSocket | undefined {
    return this.rooms.get(roomId)?.get(peerId);
  }

  isRoomAvailable(roomId: string): boolean {
    if (!this.validateRoomId(roomId)) return false;
    const room = this.rooms.get(roomId);
    return !room || room.size < MAX_PEERS_PER_ROOM;
  }
}
