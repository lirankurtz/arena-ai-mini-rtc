import { describe, it, expect } from "vitest";

describe("Server", () => {
  it("imports types from shared", () => {
    // Placeholder: verify shared types are accessible
    import("@mini-rtc/shared").then((module) => {
      expect(module.ERROR_CODES).toBeDefined();
      expect(module.ROOM_ID_REGEX).toBeDefined();
    });
  });
});
