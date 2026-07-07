import { describe, it, expect, beforeEach } from "vitest";
import { RoomManager } from "./rooms";
import { WebSocket } from "ws";

describe("RoomManager", () => {
  let manager: RoomManager;
  const mockWs = { readyState: 1 } as WebSocket;
  const mockWs2 = { readyState: 1 } as WebSocket;

  beforeEach(() => {
    manager = new RoomManager();
  });

  describe("join and leave", () => {
    const roomId = "abcdefghijklmnopqrstu";

    it("allows first peer to join", () => {
      const result = manager.join(roomId, "peer1", mockWs);
      expect(result.error).toBeUndefined();
      expect(result.peers).toEqual([]);
    });

    it("allows second peer to join", () => {
      manager.join(roomId, "peer1", mockWs);
      const result = manager.join(roomId, "peer2", mockWs2);
      expect(result.error).toBeUndefined();
      expect(result.peers).toEqual(["peer1"]);
    });

    it("rejects third peer (room-full)", () => {
      manager.join(roomId, "peer1", mockWs);
      manager.join(roomId, "peer2", mockWs2);

      const mockWs3 = { readyState: 1 } as WebSocket;
      const result = manager.join(roomId, "peer3", mockWs3);
      expect(result.error).toBe("room-full");
      expect(result.peers).toBeUndefined();
    });

    it("rejects invalid room id", () => {
      const result = manager.join("invalid", "peer1", mockWs);
      expect(result.error).toBe("invalid-room");
    });

    it("removes peer on leave", () => {
      manager.join(roomId, "peer1", mockWs);
      manager.join(roomId, "peer2", mockWs2);

      manager.leave(roomId, "peer1");
      expect(manager.peersOf(roomId)).toEqual(["peer2"]);
    });

    it("cleans up empty rooms", () => {
      manager.join(roomId, "peer1", mockWs);
      manager.leave(roomId, "peer1");

      const result = manager.join(roomId, "peer2", mockWs2);
      expect(result.peers).toEqual([]);
    });
  });

  describe("peersOf", () => {
    const roomId = "abcdefghijklmnopqrstu";

    it("returns peers in room", () => {
      manager.join(roomId, "peer1", mockWs);
      manager.join(roomId, "peer2", mockWs2);

      expect(manager.peersOf(roomId)).toContain("peer1");
      expect(manager.peersOf(roomId)).toContain("peer2");
      expect(manager.peersOf(roomId)).toHaveLength(2);
    });

    it("returns empty array for nonexistent room", () => {
      expect(manager.peersOf("nonexistent")).toEqual([]);
    });
  });

  describe("isRoomAvailable", () => {
    const roomId = "abcdefghijklmnopqrstu";

    it("is available when empty", () => {
      expect(manager.isRoomAvailable(roomId)).toBe(true);
    });

    it("is available with one peer", () => {
      manager.join(roomId, "peer1", mockWs);
      expect(manager.isRoomAvailable(roomId)).toBe(true);
    });

    it("is unavailable with two peers", () => {
      manager.join(roomId, "peer1", mockWs);
      manager.join(roomId, "peer2", mockWs2);
      expect(manager.isRoomAvailable(roomId)).toBe(false);
    });

    it("rejects invalid room id", () => {
      expect(manager.isRoomAvailable("invalid")).toBe(false);
    });
  });
});
