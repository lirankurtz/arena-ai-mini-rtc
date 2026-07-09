# MiniRTC: Design Decisions

## Signaling Transport: WebSocket

**Decision:** WebSocket

**Rejected:**

- HTTP polling (wasteful round-trips, high latency for real-time)
- SSE (Server-Sent Events, one-way only, need bidirectional)

**Why:** Bidirectional, low latency, works in browsers natively.

**Breaks when:** Need to distribute signaling across servers (single WS connection ties peer to one server).

**Next:** Service discovery (Zookeeper) to route peers to the right server.

## Media: WebRTC Peer-to-Peer

**Decision:** p2p (peers connect directly)

**Rejected:**

- SFU from the start (unnecessary complexity for 1:1)

**Why:** Zero server CPU/bandwidth, works for 1:1, simple code.

**Breaks when:** Handful of participants (each peer encodes for N-1 others, CPU explodes).

**Next:** SFU (server forwards, not relays) for group calls.

## STUN Only

**Decision:** STUN (endpoint discovery)

**Rejected:**

- No NAT traversal (20% of users behind symmetric NAT fail silently)
- TURN for everyone (relay cost prohibitive, wastes bandwidth)

**Why:** Free servers, works for 80%, acceptable tradeoff for MVP.

**Breaks when:** strict networks blocks STUN based p2p.

**Next:** TURN on-demand (fallback only, 80% still use p2p).

## Room State: In-Memory Map

**Decision:** In-memory (Map<roomId, peers>)

**Rejected:**

- Database (latency, schema overhead)
- Redis (unnecessary with room pinning to single server)

**Why:** Zero latency, simple code.

**Breaks when:** Server restarts (state lost) or need resilience.

**Next:** Room affinity via Zookeeper (pin room to server, survive restarts with backup).

## Deployment: Single Node Process

**Decision:** One Node Express server serves both API and static client (built React app).

**Rejected:**

- Serverless (WebSocket incompatible)
- Multi-server without pinning (complexity tax, state sync needed)
- Separate frontend hosting (S3 + CloudFront, adds complexity)

**Why:** Simple, cheap, sufficient for MVP. Single deployment, dynamic control (SSR if needed later).

**Tradeoffs:**
- **Pros:** Single deployment, dynamic control (middleware, SSR), easier to add features that need both client+server
- **Cons:** More maintenance (rebuild/redeploy whole app for frontend changes), no static file caching/CDN

**Breaks when:** Need resilience (server death = all calls drop) or need to scale frontend independently.

**Next:** Zookeeper for room pinning, backup servers for failover. Later: hybrid (static files on CDN, server handles API/WS only).

---

## Scaling: Multi-Server with Room Pinning

When current architecture breaks (server restarts lose state, need resilience):

**Multi-server setup:**

1. Zookeeper (or etcd) maintains room → server mapping
2. New peer joins → Zookeeper routes to pinned server
3. If pinned server dies → Zookeeper routes to backup, peer reconnects

**No need for Redis:** Room state stays in-memory on pinned server. No cross-server sync needed.

**Participant limits:**

- p2p: handful of users (CPU explodes encoding for N-1 peers)
- SFU: hundreds of users (server forwards streams, clients just send/receive 1)
- Current cap: 2 (by design). Raising to handful requires bitrate cuts. Beyond that requires SFU.

**Cost scaling:**

- Connections: multiple Node instances behind Zookeeper
- Media relay: SFU still doesn't relay (p2p stays), so bandwidth cost stays low
- If TURN fallback added: bandwidth becomes the bottleneck, not CPU or connections

## System Bottlenecks: Where Resources Go

**TURN vs SFU (not comparable—different problems):**

- **TURN** (2-peer relay when NAT blocks): ~2 Mbps through server (1 in, 1 out). Only kicks in when p2p fails.
- **SFU** (N-peer hub): ~N in + (N-1)×N out. E.g., 10 peers = 100 Mbps through server. Solves scaling, not connectivity.

**p2p full mesh (no server relay):**

- Cost: O(N²) client CPU (each peer encodes for N-1 others)
- Cheap on server, expensive on clients
- Works up to handful of peers, then CPU explodes

**Ranking by resource cost (current architecture):**

| Component      | Cost       | Why                |
| -------------- | ---------- | ------------------ |
| Signaling (WS) | Low        | Just JSON routing  |
| Room state     | Negligible | Tiny in-memory Map |

**Key insight:** p2p media (no relay) = cheap on server. If TURN fallback added, bandwidth becomes bottleneck. If scaling to groups requires SFU, server bandwidth becomes bottleneck.
