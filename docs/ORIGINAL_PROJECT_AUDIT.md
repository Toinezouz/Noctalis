# Audit of the original project

> Inspection report made **before any copy**, read-only. It describes the
> project NOCTALIS 1.0 was derived from. The original project was neither
> modified, renamed nor moved. It stays at `/home/user/Got-Five`, on its own
> repository `Toinezouz/Got-Five`, commit `f650a15`, clean working tree —
> checked before and after the copy.

## 1. Overview

| | |
| --- | --- |
| Nature | 2-player deduction game, browser, real time |
| Monorepo | npm workspaces: `shared`, `server`, `client` + `tests/` at the root |
| Languages | strict TypeScript (`noUncheckedIndexedAccess`), React 18, Node 20+ |
| Network | Socket.IO 4, authoritative server |
| Tests | Vitest (unit + jsdom), Playwright (E2E, desktop + mobile) |
| Quality | ESLint 9 (flat config), typecheck over 4 TS projects |
| Declared licence | MIT (`package.json`) |

## 2. Size

| Area | Lines | Files |
| --- | --- | --- |
| `shared/src` | 1,805 | 14 |
| `server/src` | 1,014 | 6 |
| `client/src` | 8,271 | 57 |
| `tests/` | 3,538 | 21 |
| `scripts/` | 1,043 | 1 |
| **Total source** | **~15,700** | **103** |

## 3. Tree

```
Got-Five/
├── shared/src/
│   ├── data/tiles.ts            source of truth of the 60 tiles
│   ├── game/                    engine, deck, rules, rng, serialize
│   ├── types/                   tiles, game, actions, room
│   ├── protocol/events.ts       typed Socket.IO contract
│   └── validation/              validation of client input
├── server/src/
│   ├── index.ts                 entry point (PORT, CLIENT_URL, NODE_ENV)
│   ├── createServer.ts          Express + Socket.IO + /health + static files
│   ├── rooms/RoomManager.ts     in-memory rooms, TTL, tokens
│   ├── security/                rateLimit, tokens (timingSafeEqual)
│   └── socket/handlers.ts       every event, re-validated
├── client/src/
│   ├── app/                     App, GameContext
│   ├── components/              game (17), ui (7)
│   ├── features/                deduction, dialogs, game, room
│   ├── i18n/                    fr, es, provider
│   ├── lib/                     audio, socket, storage, theme, roulette
│   └── styles/                  tokens, base, ui, game, deduction, screens
├── tests/unit/ (13)  tests/e2e/ (8)
└── scripts/share.mjs            Cloudflare tunnel + diagnosis
```

## 4. Game engine

Entirely pure: `shared/src/game/` knows neither React nor Socket.IO, and is
tested like a library.

- **Data**: 60 tiles numbered 1–60. The number decides the colour (cycle of
  5) and the points (`(⌊(n-1)/5⌋ mod 3) + 1`). Single source.
- **Injectable RNG** (`Rng`), `defaultRng` in production, `createSeededRng`
  for reproducible games in tests.
- **State machine**: `WAITING_FOR_PLAYER` → `LOBBY_READY` → `SETUP` →
  `TURN_REVEAL` ⇄ `TURN_HINT` → `WAITING_FOR_CLASSIFY` / `WAITING_FOR_COMPARE`
  → `GAME_OVER`.
- **Turn**: reveal a tile (chosen colour, drawn by the server), then ask for a
  hint. The tile used leaves the shared area.
- **Hints**: placement among the secret tiles (6 gaps) or comparison of
  points (YES/NO). The client's answer is **ignored** and recomputed by the
  server.
- **End**: a single call per player; right → victory, wrong → elimination;
  empty reserve → draw.
- **First player drawn at random**, announced by an animation.

## 5. Security and confidentiality

The project's central property, to be preserved in full.

- The server's `GameState` **never** leaves as is.
- Two projections: `toPublicGameState(state)` and
  `toPlayerPrivateState(state, playerId)`.
- Of their own tiles, a player receives **colour and position only** —
  never the number, and deliberately not the points (they would narrow the
  candidates from 60 to 12).
- `findSecretLeak()`: a guard run in dev/test before every broadcast.
- Reconnection tokens compared in constant time, per-socket rate limiting,
  Socket.IO payload capped at 16 KiB.

## 6. Interface

Game table (opponent at the top, shared area in the middle, player at the
bottom), interactive and private 1–60 deduction sheet, CSS-token design
system, light and dark themes, French/Spanish, animations respecting
`prefers-reduced-motion`, responsive from 375 px to 1440 px.

## 7. Assets — complete inventory

| Asset | Nature | Origin | Verdict |
| --- | --- | --- | --- |
| `client/public/favicon.svg` | 5-line SVG | written in the project | to replace (identity) |
| Characters on the tiles | inline SVG, 5 variants | written in the project | to replace (identity) |
| Tiles, racks, textures | pure CSS (gradients, shadows) | written in the project | generic, reusable |
| Fredoka Variable | font | `@fontsource-variable/fredoka` (SIL OFL) | free, but tied to the identity |
| Nunito Variable | font | `@fontsource-variable/nunito` (SIL OFL) | free, reusable |
| Sounds | synthesised on the fly (Web Audio) | no file | generic, reusable |
| Bitmap images | **none** | — | — |

**No proprietary asset, no hotlinked image, no resource from the publisher
of the board game.** A search for the publisher's name returns nothing in
the repository.

## 8. Footprint of the identity to replace

| Nature | Occurrences |
| --- | --- |
| `@gotfive/*` imports (package names) | 67 |
| Visible "GOT FIVE" strings (UI, comments) | 66 |
| `gotfive:*` storage keys | 6 |
| Favicon, `<title>`, HTML metadata | 1 file |
| README, `.env.example`, `jouer.cmd`, `scripts/share.mjs` | 4 files |

## 9. Configuration

- **Git**: single repository `Toinezouz/Got-Five`, working branch
  `claude/got-five-browser-game-fe95e7`.
- **Render**: no configuration (`render.yaml` absent).
- **Cloudflare**: no permanent integration; `scripts/share.mjs` opens a
  temporary tunnel on demand, downloading `cloudflared` into a local cache.
  No token, no account.
- **Environment variables**: `PORT`, `NODE_ENV`, `CLIENT_URL`, `ROOM_TTL_MS`,
  `VITE_SERVER_URL`. `.env.example` without any secret.
- **CI**: none (no `.github/`).

## 10. Things already in favour of a Render deployment

Found during the audit, without any change:

- the server already reads `process.env.PORT`;
- it already serves the built client (`express.static` + SPA fallback) — so
  a single service is enough;
- `GET /health` already exists;
- `SIGTERM` is already handled cleanly.

## 11. Conclusion of the audit

The project splits cleanly into two layers:

1. **generic infrastructure** (network, rooms, reconnection, public/private
   serialisation, design system, tests, tooling) — reusable as is;
2. an **identity** (name, vocabulary, characters, favicon, texts) — to be
   replaced entirely.

No technical obstacle to the copy. No asset to set aside for rights reasons:
everything that is replaced is replaced to create an identity of its own,
not because it could not be published.
