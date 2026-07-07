import express from "express";
import http from "http";
import { attachWebSocketServer } from "./signaling";
import { RoomManager } from "./rooms";

const app = express();
const PORT = process.env.PORT ?? 3000;
const roomManager = new RoomManager();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/rooms/:id/available", (req, res) => {
  const available = roomManager.isRoomAvailable(req.params.id);
  res.json({ available });
});

const server = http.createServer(app);
attachWebSocketServer(server, roomManager);

server.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
