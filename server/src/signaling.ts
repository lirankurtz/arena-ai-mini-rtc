import { WebSocketServer } from "ws";
import { Server } from "http";
import { nanoid } from "nanoid";
import { ClientMessage, ServerMessage } from "./types";
import { RoomManager } from "./rooms";

export function attachWebSocketServer(httpServer: Server, roomManager: RoomManager): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    const peerId = nanoid();
    let currentRoom: string | null = null;

    const send = (msg: ServerMessage) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    };

    const broadcastToRoom = (msg: ServerMessage, excludePeerId?: string) => {
      const peers = currentRoom ? roomManager.peersOf(currentRoom) : [];
      peers.forEach((pid) => {
        if (excludePeerId && pid === excludePeerId) return;
        const peerWs = currentRoom ? roomManager.getPeerSocket(currentRoom, pid) : undefined;
        if (peerWs && peerWs.readyState === peerWs.OPEN) {
          peerWs.send(JSON.stringify(msg));
        }
      });
    };

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;

        if (msg.type === "join") {
          const result = roomManager.join(msg.roomId, peerId, ws);
          currentRoom = msg.roomId;

          if (result.error) {
            send({
              type: "error",
              code: result.error,
              message: `Failed to join: ${result.error}`,
            });
            currentRoom = null;
            return;
          }

          send({ type: "joined", selfId: peerId, peers: result.peers || [] });
          broadcastToRoom({ type: "peer-joined", peerId }, peerId);
        } else if (msg.type === "leave") {
          if (currentRoom) {
            roomManager.leave(currentRoom, peerId);
            broadcastToRoom({ type: "peer-left", peerId });
            currentRoom = null;
          }
        } else if (msg.type === "offer" || msg.type === "answer") {
          if (currentRoom) {
            const peers = roomManager.peersOf(currentRoom);
            if (peers.length > 0) {
              const otherPeerId = peers[0];
              const otherWs = roomManager.getPeerSocket(currentRoom, otherPeerId);
              if (otherWs && otherWs.readyState === otherWs.OPEN) {
                otherWs.send(
                  JSON.stringify({
                    type: msg.type,
                    sdp: msg.sdp,
                    from: peerId,
                  })
                );
              }
            }
          }
        } else if (msg.type === "ice-candidate") {
          if (currentRoom) {
            const peers = roomManager.peersOf(currentRoom);
            if (peers.length > 0) {
              const otherPeerId = peers[0];
              const otherWs = roomManager.getPeerSocket(currentRoom, otherPeerId);
              if (otherWs && otherWs.readyState === otherWs.OPEN) {
                otherWs.send(
                  JSON.stringify({
                    type: "ice-candidate",
                    candidate: msg.candidate,
                    from: peerId,
                  })
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoom) {
        roomManager.leave(currentRoom, peerId);
        broadcastToRoom({ type: "peer-left", peerId });
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  return wss;
}
