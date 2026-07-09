# MiniRTC

A minimal one-to-one (1:1) audio/video calling application built with WebRTC and Node.

## What This Is

MiniRTC lets two users join a room by URL and have a live call. Audio is required; video is optional and can be toggled mid-call. No account needed.

**Core flow:**
- Create a room → get a shareable link
- Send the link to someone
- Both click Join → call connects via WebRTC
- Mute/unmute audio, toggle video, hang up anytime

## Getting Started

### Prerequisites
- Node 19+
- npm

### Install & Run

```bash
npm install
npm run dev
```

This starts:
- Client dev server: http://localhost:5173
- Server (signaling + static): http://localhost:3000

Open http://localhost:5173, create a room, share the link.

## How It Works

### Components

**Lobby** — Pre-call setup. Shows a shareable link and camera/mic preview. Checks room availability; if full, shows "This call is full" message. Only proceeds to join once media is ready.

**Room** — Page orchestrator. Manages state for the entire call lifecycle: local media capture, availability probe, WebRTC peer connection, signaling socket, and call UI transitions. Handles errors (room full, media denied, connection lost).

**InCall** — The call UI. Displays local and remote video/audio. Shows "Camera off" when a peer disables video. Controls for mute/unmute, video toggle, and leave.

**Signaling** (server-side WebSocket) — Relays WebRTC offer/answer/ICE between peers. Tracks room membership and broadcasts peer-joined/peer-left events. No calls are stored; state is in-memory and resets on server restart.

### Call Flow

1. Peer A creates room → gets URL with room ID
2. Peer B opens URL → Lobby checks availability (room exists, has 1 peer, so available)
3. Both enable media and click Join
4. Server receives join → broadcasts "peer-joined" event
5. Peer A (first joiner) creates WebRTC offer, sends via signaling
6. Peer B receives offer → creates answer, sends back
7. Both exchange ICE candidates for NAT traversal (STUN only, no TURN)
8. Connection established → video/audio flows
9. Either peer clicks Leave → disconnect, room cleaned up after both leave

### NAT Traversal: STUN vs TURN

When two peers are behind different networks/firewalls, they can't always reach each other directly. WebRTC uses **ICE** (Interactive Connectivity Establishment) to find a working path.

**STUN** (Session Traversal Utilities for NAT) — A lightweight server that tells your client its public IP and port. Works for most home/office networks. Costs ~$1–5/mo. **This app uses STUN only** (Google's free servers).

**TURN** (Traversal Using Relays around NAT) — A relay server that forwards all media if direct connection fails. Expensive (~$0.01–0.10 per GB). Needed for ~10–20% of peers (symmetric NAT, strict firewalls).

**Implication:** This app works for most users but ~1 in 5–10 will see a black screen or hear nothing if both peers are behind restrictive NAT. Production needs TURN (coturn, Twilio, AWS, etc.).

## Deployment

**Live**: https://mini-rtc.onrender.com/

Deployed on [Render](https://render.com) as a Web Service:
- Build: `npm install && npm run build`
- Start: `npm start`
- See `render.yaml` for full config

First request may take 30s (free tier cold start). Otherwise instant.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node + Express + TypeScript
- **Transport**: WebSocket for signaling, WebRTC for media
- **Deployment**: Single Node service (client built into server, served as static)

## What's Skipped

- **TURN servers**: Uses STUN only. ~10–20% of peers behind symmetric NAT will fail. Production needs a TURN relay (coturn, Twilio, etc.)
- **Authentication**: No login. Room IDs are long random strings (non-guessable) but anyone with the link can join.
- **Persistence**: Calls and room state live only in server memory. Restarting the server clears all active calls.
- **Scalability**: Single-process in-memory room manager. Doesn't scale to multiple servers without coordination (Redis, etc.).
- **Call recording**: No recording or replay.
- **Bandwidth management**: No adaptive bitrate or bandwidth constraints.

## Notes

- Uses **Tailwind CSS v3** (pure-JS) rather than v4, to support Node 19.
- Room IDs are 21-character nanoid strings (non-guessable).
- Max 2 peers per room. Third joiners see "This call is full" and are blocked.
