import { describe, it, expect, beforeEach } from "vitest";
import * as rooms from "./rooms";
import { WebSocket } from "ws";

describe("rooms", () => {
  const mockWs = { readyState: 1 } as WebSocket;
  const mockWs2 = { readyState: 1 } as WebSocket;

  beforeEach(() => {
    rooms._resetForTesting();
  });

  describe("validateRoomId", () => {
    it("accepts valid 21-char nanoid", () => {
      expect(rooms.validateRoomId("abcdefghijklmnopqrstu")).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(rooms.validateRoomId("invalid")).toBe(false);
      expect(rooms.validateRoomId("abcdefghijklmnopqrst")).toBe(false); // 20 chars
    });
  });

  describe("join and leave", () => {
    const roomId = "abcdefghijklmnopqrstu";

    it("allows first peer to join", () => {
      const result = rooms.join(roomId, "peer1", mockWs);
      expect(result.error).toBeUndefined();
      expect(result.peers).toEqual([]);
    });

    it("allows second peer to join", () => {
      rooms.join(roomId, "peer1", mockWs);
      const result = rooms.join(roomId, "peer2", mockWs2);
      expect(result.error).toBeUndefined();
      expect(result.peers).toEqual(["peer1"]);
    });

    it("rejects third peer (room-full)", () => {
      rooms.join(roomId, "peer1", mockWs);
      rooms.join(roomId, "peer2", mockWs2);

      const mockWs3 = { readyState: 1 } as WebSocket;
      const result = rooms.join(roomId, "peer3", mockWs3);
      expect(result.error).toBe("room-full");
      expect(result.peers).toBeUndefined();
    });

    it("rejects invalid room id", () => {
      const result = rooms.join("invalid", "peer1", mockWs);
      expect(result.error).toBe("invalid-room");
    });

    it("removes peer on leave", () => {
      rooms.join(roomId, "peer1", mockWs);
      rooms.join(roomId, "peer2", mockWs2);

      rooms.leave(roomId, "peer1");
      expect(rooms.peersOf(roomId)).toEqual(["peer2"]);
    });

    it("cleans up empty rooms", () => {
      rooms.join(roomId, "peer1", mockWs);
      rooms.leave(roomId, "peer1");

      const result = rooms.join(roomId, "peer2", mockWs2);
      expect(result.peers).toEqual([]);
    });
  });

  describe("peersOf", () => {
    const roomId = "abcdefghijklmnopqrstu";

    it("returns peers in room", () => {
      rooms.join(roomId, "peer1", mockWs);
      rooms.join(roomId, "peer2", mockWs2);

      expect(rooms.peersOf(roomId)).toContain("peer1");
      expect(rooms.peersOf(roomId)).toContain("peer2");
      expect(rooms.peersOf(roomId)).toHaveLength(2);
    });

    it("returns empty array for nonexistent room", () => {
      expect(rooms.peersOf("nonexistent")).toEqual([]);
    });
  });

  describe("isRoomAvailable", () => {
    const roomId = "abcdefghijklmnopqrstu";

    it("is available when empty", () => {
      expect(rooms.isRoomAvailable(roomId)).toBe(true);
    });

    it("is available with one peer", () => {
      rooms.join(roomId, "peer1", mockWs);
      expect(rooms.isRoomAvailable(roomId)).toBe(true);
    });

    it("is unavailable with two peers", () => {
      rooms.join(roomId, "peer1", mockWs);
      rooms.join(roomId, "peer2", mockWs2);
      expect(rooms.isRoomAvailable(roomId)).toBe(false);
    });

    it("rejects invalid room id", () => {
      expect(rooms.isRoomAvailable("invalid")).toBe(false);
    });
  });
});
