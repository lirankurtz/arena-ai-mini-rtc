# arena-ai-mini-rtc

Minimal monorepo boilerplate: React + Tailwind frontend, Node/Express backend, both TypeScript.

## Structure

```
client/   React + Vite + TypeScript + Tailwind CSS
server/   Node + Express + TypeScript
```

## Setup

```bash
npm install
```

Installs both workspaces.

## Development

```bash
npm run dev          # runs client + server together
npm run dev:client   # Vite dev server (http://localhost:5173)
npm run dev:server   # Express API   (http://localhost:3000)
```

The Vite dev server proxies `/api/*` to the backend, so the frontend can call
`/api/health` with no CORS setup. The homepage fetches `/api/health` and shows
the backend status as a smoke test.

## Build

```bash
npm run build        # builds both workspaces
```

## Notes

- Uses **Tailwind CSS v3** (pure-JS) rather than v4, because v4's native
  `oxide` binary requires Node 20+ and this environment runs Node 19.
