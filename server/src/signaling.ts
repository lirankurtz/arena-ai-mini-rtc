import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { nanoid } from "nanoid";
import { ClientMessage, ServerMessage } from "./types";
import { RoomManager } from "./rooms";

interface PeerSession {
  peerId: string;
  currentRoom: string | null;
  send(msg: ServerMessage): void;
  broadcastToRoom(msg: ServerMessage, excludePeerId?: string): void;
}

function createSession(peerId: string, ws: WebSocket, roomManager: RoomManager): PeerSession {
  const session: PeerSession = {
    peerId,
    currentRoom: null,
    send(msg: ServerMessage) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    broadcastToRoom(msg: ServerMessage, excludePeerId?: string) {
      if (!session.currentRoom) {
        return;
      }
      const peers = roomManager.peersOf(session.currentRoom);
      peers.forEach((pid) => {
        if (excludePeerId && pid === excludePeerId) {
          return;
        }
        const peerWs = roomManager.getPeerSocket(session.currentRoom!, pid);
        if (peerWs && peerWs.readyState === peerWs.OPEN) {
          peerWs.send(JSON.stringify(msg));
        }
      });
    },
  };

  return session;
}

function handleJoin(
  msg: ClientMessage & { type: "join" },
  session: PeerSession,
  roomManager: RoomManager,
  ws: WebSocket
): void {
  const result = roomManager.join(msg.roomId, session.peerId, ws);
  session.currentRoom = msg.roomId;

  if (result.error) {
    session.send({
      type: "error",
      code: result.error,
      message: `Failed to join: ${result.error}`,
    });
    session.currentRoom = null;
    return;
  }

  session.send({ type: "joined", selfId: session.peerId, peers: result.peers || [] });
  session.broadcastToRoom({ type: "peer-joined", peerId: session.peerId }, session.peerId);
}

function handleLeave(session: PeerSession, roomManager: RoomManager): void {
  if (!session.currentRoom) {
    return;
  }
  roomManager.leave(session.currentRoom, session.peerId);
  session.broadcastToRoom({ type: "peer-left", peerId: session.peerId });
  session.currentRoom = null;
}

function relayToOtherPeer(
  msg: ServerMessage,
  session: PeerSession,
  roomManager: RoomManager
): void {
  if (!session.currentRoom) {
    return;
  }
  const peers = roomManager.peersOf(session.currentRoom);
  const otherPeerId = peers.find((id) => id !== session.peerId);
  if (!otherPeerId) {
    return;
  }

  const otherWs = roomManager.getPeerSocket(session.currentRoom, otherPeerId);
  if (otherWs && otherWs.readyState === otherWs.OPEN) {
    otherWs.send(JSON.stringify(msg));
  }
}

function handleOfferAnswer(
  msg: ClientMessage & { type: "offer" | "answer" },
  session: PeerSession,
  roomManager: RoomManager
): void {
  relayToOtherPeer(
    {
      type: msg.type,
      sdp: msg.sdp,
      from: session.peerId,
    },
    session,
    roomManager
  );
}

function handleIceCandidate(
  msg: ClientMessage & { type: "ice-candidate" },
  session: PeerSession,
  roomManager: RoomManager
): void {
  relayToOtherPeer(
    {
      type: "ice-candidate",
      candidate: msg.candidate,
      from: session.peerId,
    },
    session,
    roomManager
  );
}

export function attachWebSocketServer(httpServer: Server, roomManager: RoomManager): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    const peerId = nanoid();
    const session = createSession(peerId, ws, roomManager);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;

        switch (msg.type) {
          case "join":
            handleJoin(msg, session, roomManager, ws);
            break;
          case "leave":
            handleLeave(session, roomManager);
            break;
          case "offer":
          case "answer":
            handleOfferAnswer(msg, session, roomManager);
            break;
          case "ice-candidate":
            handleIceCandidate(msg, session, roomManager);
            break;
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      handleLeave(session, roomManager);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  return wss;
}
