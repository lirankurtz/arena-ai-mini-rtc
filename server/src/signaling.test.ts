import { describe, it, expect, afterEach } from "vitest";
import http from "http";
import { AddressInfo } from "net";
import { WebSocket } from "ws";
import { attachWebSocketServer } from "./signaling";
import { RoomManager } from "./rooms";
import { ServerMessage } from "./types";

let server: http.Server;

afterEach(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

function startServer(): Promise<number> {
  server = http.createServer();
  attachWebSocketServer(server, new RoomManager());
  return new Promise((r) => server.listen(0, () => r((server.address() as AddressInfo).port)));
}

function open(port: number): Promise<WebSocket> {
  const ws = new WebSocket(`ws://localhost:${port}`);
  return new Promise((r) => ws.on("open", () => r(ws)));
}

function collect(ws: WebSocket): ServerMessage[] {
  const msgs: ServerMessage[] = [];
  ws.on("message", (d) => msgs.push(JSON.parse(d.toString())));
  return msgs;
}

const tick = (ms = 100) => new Promise((r) => setTimeout(r, ms));

describe("signaling: peer-left delivery", () => {
  it("notifies the remaining peer when the other peer leaves", async () => {
    const port = await startServer();
    const a = await open(port);
    const b = await open(port);
    const aMsgs = collect(a);

    a.send(JSON.stringify({ type: "join", roomId: "abcdefghij0123456789x" }));
    await tick();
    b.send(JSON.stringify({ type: "join", roomId: "abcdefghij0123456789x" }));
    await tick();
    b.send(JSON.stringify({ type: "leave" }));
    await tick();

    expect(aMsgs.map((m) => m.type)).toContain("peer-left");
    a.close();
    b.close();
  });

  it("notifies the remaining peer when the other peer disconnects abruptly", async () => {
    const port = await startServer();
    const a = await open(port);
    const b = await open(port);
    const aMsgs = collect(a);

    a.send(JSON.stringify({ type: "join", roomId: "abcdefghij0123456789x" }));
    await tick();
    b.send(JSON.stringify({ type: "join", roomId: "abcdefghij0123456789x" }));
    await tick();
    b.terminate();
    await tick();

    expect(aMsgs.map((m) => m.type)).toContain("peer-left");
    a.close();
  });

  it("notifies the existing peer when a new peer joins", async () => {
    const port = await startServer();
    const a = await open(port);
    const b = await open(port);
    const aMsgs = collect(a);

    a.send(JSON.stringify({ type: "join", roomId: "abcdefghij0123456789x" }));
    await tick();
    b.send(JSON.stringify({ type: "join", roomId: "abcdefghij0123456789x" }));
    await tick();

    expect(aMsgs.map((m) => m.type)).toContain("peer-joined");
    a.close();
    b.close();
  });
});
