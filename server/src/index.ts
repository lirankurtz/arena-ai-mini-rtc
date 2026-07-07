import express from "express";
import http from "http";
import { attachWebSocketServer } from "./signaling";
import * as rooms from "./rooms";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/rooms/:id/available", (req, res) => {
  const available = rooms.isRoomAvailable(req.params.id);
  res.json({ available });
});

const server = http.createServer(app);
attachWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
