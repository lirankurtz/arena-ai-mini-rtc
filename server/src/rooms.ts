import { WebSocket } from "ws";
import { ROOM_ID_REGEX, ERROR_CODES } from "./types";

type RoomMap = Map<string, WebSocket>;
type RoomsStore = Map<string, RoomMap>;

let rooms: RoomsStore = new Map();
const MAX_PEERS_PER_ROOM = 2;

export function _resetForTesting(): void {
  rooms = new Map();
}

export function validateRoomId(roomId: string): boolean {
  return ROOM_ID_REGEX.test(roomId);
}

export function join(
  roomId: string,
  peerId: string,
  ws: WebSocket
): { error?: string; peers?: string[] } {
  if (!validateRoomId(roomId)) {
    return { error: ERROR_CODES.INVALID_ROOM };
  }

  let room = rooms.get(roomId);
  if (!room) {
    room = new Map();
    rooms.set(roomId, room);
  }

  if (room.size >= MAX_PEERS_PER_ROOM) {
    return { error: ERROR_CODES.ROOM_FULL };
  }

  room.set(peerId, ws);
  const peers = Array.from(room.keys()).filter((id) => id !== peerId);
  return { peers };
}

export function leave(roomId: string, peerId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(peerId);
  if (room.size === 0) {
    rooms.delete(roomId);
  }
}

export function peersOf(roomId: string): string[] {
  const room = rooms.get(roomId);
  return room ? Array.from(room.keys()) : [];
}

export function getPeerSocket(roomId: string, peerId: string): WebSocket | undefined {
  return rooms.get(roomId)?.get(peerId);
}

export function isRoomAvailable(roomId: string): boolean {
  if (!validateRoomId(roomId)) return false;
  const room = rooms.get(roomId);
  return !room || room.size < MAX_PEERS_PER_ROOM;
}
