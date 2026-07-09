import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
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

// In production the compiled bundle lives at server/dist/index.js, so the
// client build is two levels up. When the build exists, serve it and fall back
// to index.html for client-side routes (e.g. /room/:id). In dev this directory
// is absent and Vite serves the client instead.
const clientDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../client/dist"
);
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = http.createServer(app);
attachWebSocketServer(server, roomManager);

server.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
