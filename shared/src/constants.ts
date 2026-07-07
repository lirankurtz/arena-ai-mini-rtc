export const ROOM_ID_REGEX = /^[A-Za-z0-9_-]{21}$/;

export const ERROR_CODES = {
  ROOM_FULL: "room-full",
  INVALID_ROOM: "invalid-room",
} as const;
