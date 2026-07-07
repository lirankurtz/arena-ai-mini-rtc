import { WebSocketServer } from "ws";
import { Server } from "http";
import { nanoid } from "nanoid";
import { ClientMessage, ServerMessage } from "./types";
import * as rooms from "./rooms";

export function attachWebSocketServer(httpServer: Server): WebSocketServer {
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
      const peers = currentRoom ? rooms.peersOf(currentRoom) : [];
      peers.forEach((pid) => {
        if (excludePeerId && pid === excludePeerId) return;
        const peerWs = currentRoom ? rooms.getPeerSocket(currentRoom, pid) : undefined;
        if (peerWs && peerWs.readyState === peerWs.OPEN) {
          peerWs.send(JSON.stringify(msg));
        }
      });
    };

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;

        if (msg.type === "join") {
          const result = rooms.join(msg.roomId, peerId, ws);
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
            rooms.leave(currentRoom, peerId);
            broadcastToRoom({ type: "peer-left", peerId });
            currentRoom = null;
          }
        } else if (msg.type === "offer" || msg.type === "answer") {
          if (currentRoom) {
            const peers = rooms.peersOf(currentRoom);
            if (peers.length > 0) {
              const otherPeerId = peers[0];
              const otherWs = rooms.getPeerSocket(currentRoom, otherPeerId);
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
            const peers = rooms.peersOf(currentRoom);
            if (peers.length > 0) {
              const otherPeerId = peers[0];
              const otherWs = rooms.getPeerSocket(currentRoom, otherPeerId);
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
        rooms.leave(currentRoom, peerId);
        broadcastToRoom({ type: "peer-left", peerId });
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  return wss;
}
