# GOO! Wallet

A pixel-faithful Apple Wallet replica used as a mentalism prop: a spectator's
name (and birthday) are revealed inside the app as if they were already
stored on the performer's phone, via a hidden "listening" mode that polls an
external lookup service (GOO!/11q.co).

## Stack

- Vite + React 19 + Tailwind, deployed as a static SPA on Vercel
- `api/*` — Vercel serverless functions (Node runtime) for session state
- Upstash Redis (via `@upstash/redis`) for state persistence, keyed per `?s=<sessionId>`
- `server.ts` — **local dev only**; mounts the same `api/*` handlers behind Express so `npm run dev` has working API routes. Never deployed — Vercel runs `api/*` directly.

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Upstash credentials (optional — without them the API falls back to in-memory defaults, fine for UI work, not for testing persistence)
3. `npm run dev` — serves the app + API on `http://localhost:3000`

## Test & build

- `npm run test` — unit tests (Vitest) for the state-transition logic and UI helpers
- `npm run lint` — typecheck
- `npm run check` — lint + test + build, mirrors what should pass before deploying

## Deploy

Connected to Vercel via GitHub (`magiaymentalismo/ios-wallet`, project
`ios-wallet-replica`). Pushes to `main` deploy to production — that's the
prop used live, so land changes through a branch/PR and check the preview
deployment first.

Required env vars on Vercel: `UPSTASH_KV_REST_API_URL`, `UPSTASH_KV_REST_API_TOKEN`.

## How the trick works (for future-me)

- Triple-tap the "Wallet" title → opens the hidden Settings panel (configure cards, loyalty card branding, per-letter merchant mapping for the acrostic spell-out).
- Double-tap the dots in the top-right pill → toggles "listening" mode. While listening, the app polls `/api/proxy` (a CORS-safe server-side proxy to 11q.co) every 2s; when a spectator's name comes back, it's spelled out as a fake Apple Pay transaction history (one merchant per letter) and the second card's last 4 digits become their birthday (DDMM).
- The invisible number grid over the loyalty card lets the performer manually key in 4 digits to set the first card's last 4, for effects that don't go through the GOO! API.
- Backgrounding the app (`visibilitychange` → hidden) auto-resets spectator-specific state via `sendBeacon`, so a phone picked up by someone else never shows the previous spectator's reveal.
- `api/webhook` is an alternate push-based path: 11q.co (or anything) can POST `{query, bd}` directly instead of the app polling `/api/proxy`.
