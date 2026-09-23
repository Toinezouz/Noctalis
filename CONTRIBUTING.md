# Contributing to UMBRASTRA

Thanks for stopping by! Every kind of help is welcome: a bug fix, a
translation, an accessibility improvement, a rule idea, a second pair of eyes
on a pull request.

## Getting started

You need **Node.js 20 or later**.

```bash
git clone https://github.com/Toinezouz/Noctalis.git
cd Noctalis
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001 (health check: `GET /health`)

To play, open **two to four browser windows** (private windows work well):
each one is a different person at the table.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | server + client in development mode |
| `npm run build` | builds `shared`, `server`, then `client` |
| `npm start` | starts the built server (it also serves the client) |
| `npm run share` | plays with friends far away through a temporary Cloudflare link |
| `npm test` | unit and integration tests (Vitest) |
| `npm run test:e2e` | end-to-end tests (Playwright) |
| `npm run typecheck` | strict TypeScript, 4 projects |
| `npm run lint` | ESLint |
| `npm run check:contract` | checks the code against `docs/PROJECT_CONTRACT.md` |

## Before opening a pull request

These must pass:

```bash
npm run typecheck
npm run lint
npm run check:contract
npm test
npm run build
```

And if you touched the interface:

```bash
npm run test:e2e
```

## House rules

**The contract comes first.** `docs/PROJECT_CONTRACT.md` freezes type names,
signatures, Socket.IO events and `data-testid`s. One concept has one name
across the whole project. To change a signature: update the contract, update
every consumer, then run `npm run check:contract`.

**The server is the only source of truth.** The client never decides the
outcome of an action, and nobody ever receives information they are not
allowed to know — through any channel. If your change touches what is sent
to players, add a test that proves nothing leaks.

**One source of data.** Everything about the 60 stars lives in
`shared/src/data/tiles.ts`. No component copies a number → constellation →
brightness mapping.

**Code style.** Strict TypeScript, no `any`, no `TODO` left behind. Comments
explain *why*, not *what*. Code, comments, docs and commit messages are in
English.

**Commit messages.** Conventional prefix (`feat:`, `fix:`, `refactor:`,
`docs:`, `test:`, `ci:`, `chore:`), imperative subject, in English.

## Writing texts for players

Everything players read lives in `client/src/i18n/`: `en.ts` is the
reference, `fr.ts` and `es.ts` follow it key by key. A few principles, checked
in part by the unit tests:

- **Talk about the game, never about the machinery.** No "server", "data",
  "session" or "token" in the interface. Those words belong in the README.
- **Write for everyone at the table.** In French and Spanish, prefer words that
  do not assume anybody's gender ("astronome", "adversaire", "persona",
  "quien juega"...) over forms with median dots or other markers.
- **Keep it warm and short.** Rules should read like a friend explaining the
  game, not like a manual.

## Adding a language

Copy `en.ts` to `xx.ts`, translate the values, keep the keys and the
`{variables}` exactly as they are, and add the language to `LANGUAGES` in
`client/src/i18n/index.tsx`. The compiler fails if a key is missing, and a
unit test checks that variables match.

## Reporting a bug

Please use the issue template: what you expected, what happened, how to
reproduce it. A security issue must **not** be reported in a public issue:
see [SECURITY.md](SECURITY.md).

## Licence

By contributing, you agree that your contribution is released under
**AGPL-3.0-or-later**, like the rest of the project.
