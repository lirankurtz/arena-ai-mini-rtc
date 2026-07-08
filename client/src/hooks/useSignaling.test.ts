import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSignaling } from "./useSignaling";

class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];
  OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  emit(msg: unknown) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

describe("useSignaling: offerer selection (glare avoidance)", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function connected() {
    const hook = renderHook(() => useSignaling());
    const ws = MockWebSocket.instances.at(-1)!;
    act(() => ws.onopen?.());
    await waitFor(() => expect(hook.result.current.connected).toBe(true));
    return { hook, ws };
  }

  it("captures existing occupants as initialPeers (this peer will offer)", async () => {
    const { hook, ws } = await connected();

    act(() => ws.emit({ type: "joined", selfId: "B", peers: ["A"] }));

    expect(hook.result.current.initialPeers).toEqual(["A"]);
  });

  it("keeps initialPeers empty for the peer already in the room, even after peer-joined", async () => {
    const { hook, ws } = await connected();

    // This peer joined an empty room, so it should never become an offerer.
    act(() => ws.emit({ type: "joined", selfId: "A", peers: [] }));
    expect(hook.result.current.initialPeers).toEqual([]);

    // A second peer joins later. The live roster updates...
    act(() => ws.emit({ type: "peer-joined", peerId: "B" }));
    expect(hook.result.current.peers).toEqual(["B"]);

    // ...but the offerer snapshot must stay empty, or both peers would offer (glare).
    expect(hook.result.current.initialPeers).toEqual([]);
  });

  it("surfaces peerLeft when a peer leaves", async () => {
    const { hook, ws } = await connected();

    act(() => ws.emit({ type: "joined", selfId: "A", peers: ["B"] }));
    act(() => ws.emit({ type: "peer-left", peerId: "B" }));

    expect(hook.result.current.peerLeft).toBe("B");
    expect(hook.result.current.peers).toEqual([]);
  });
});
