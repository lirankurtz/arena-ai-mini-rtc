import { describe, it, expect } from "vitest";
import { ROOM_ID_REGEX } from "./constants";

describe("ROOM_ID_REGEX", () => {
  it("accepts valid 21-char nanoid", () => {
    expect(ROOM_ID_REGEX.test("abcdefghijklmnopqrstu")).toBe(true);
    expect(ROOM_ID_REGEX.test("ABCDEFGHIJKLMNOPQRSTU")).toBe(true);
    expect(ROOM_ID_REGEX.test("V4c5d6e7f8g9h0i1j2k3l")).toBe(true);
    expect(ROOM_ID_REGEX.test("a_b-c_d-e_f-g_h-i_j-k")).toBe(true);
  });

  it("rejects non-base62 chars", () => {
    expect(ROOM_ID_REGEX.test("!@#$%^&*()abcdefghijk")).toBe(false);
    expect(ROOM_ID_REGEX.test("abcdefghijklmnopqrst@")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(ROOM_ID_REGEX.test("abcdefghijklmnopqrst")).toBe(false); // 20 chars
    expect(ROOM_ID_REGEX.test("abcdefghijklmnopqrstu1")).toBe(false); // 22 chars
  });
});
