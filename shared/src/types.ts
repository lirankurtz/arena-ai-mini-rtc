// Client → Server
export type ClientMessage =
  | { type: "join"; roomId: string }
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice-candidate"; candidate: string }
  | { type: "leave" };

// Server → Client
export type ServerMessage =
  | { type: "joined"; selfId: string; peers: string[] }
  | { type: "peer-joined"; peerId: string }
  | { type: "peer-left"; peerId: string }
  | { type: "offer"; sdp: string; from: string }
  | { type: "answer"; sdp: string; from: string }
  | { type: "ice-candidate"; candidate: string; from: string }
  | { type: "error"; code: string; message: string };
