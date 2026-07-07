import { describe, it, expect } from "vitest";
import { ERROR_CODES, ROOM_ID_REGEX } from "./types";

describe("Server types", () => {
  it("exports shared types", () => {
    expect(ERROR_CODES.ROOM_FULL).toBe("room-full");
    expect(ERROR_CODES.INVALID_ROOM).toBe("invalid-room");
    expect(ROOM_ID_REGEX).toBeDefined();
  });
});
