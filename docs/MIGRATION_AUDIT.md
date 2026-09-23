# Migration audit

> The project was called **NOCTALIS** up to version 1.3 and was renamed
> **UMBRASTRA** in 1.4. This record keeps the name used at the time.

> A record of how NOCTALIS 1.0 was derived from an earlier personal project
> (GOT FIVE!): what the copy kept, what it replaced, and why. Versions after
> 1.0 (tables of up to four, English, the astrolabe look) are described in
> `PROJECT_CONTRACT.md` and `PROJECT_IDENTITY.md`.

## Decision table

| Item | Original | Copy | Action | Reason |
| --- | --- | --- | --- | --- |
| Network engine (Socket.IO, handlers) | existing | copied | **keep** | generic |
| Rooms, codes, life cycle | existing | copied | **keep** | generic |
| Token-based reconnection | existing | copied | **keep** | generic |
| Public / private serialisation | existing | copied | **keep** | a security property to preserve |
| Leak guard | existing | copied | **keep** | same |
| Rate limiting, tokens | existing | copied | **keep** | generic |
| Rules engine | existing | copied | **keep** | mechanics, not identity |
| Source of truth of the 60 items | existing | copied | **keep** | generic structure (5 families × 3 values) |
| State machine | existing | copied | **keep** | generic |
| Infrastructure components (Modal, Button, Panel…) | existing | copied | **keep** | generic |
| Deduction sheet (structure) | existing | copied | **adapt** | structure kept, vocabulary redone |
| Design system (CSS tokens) | existing | copied | **adapt** | structure kept, palette redone |
| Light / dark themes | existing | copied | **adapt** | mechanism kept, colours redone |
| Unit and E2E tests | existing | copied | **adapt** | text assertions to rewrite |
| Project name | GOT FIVE! | copied | **replace** | identity |
| `@gotfive/*` package scope | existing | copied | **replace** | identity |
| Logo, favicon | original | copied | **replace** | identity |
| Characters on the tiles | original | copied | **replace** | identity |
| Every fr / es text | original | copied | **rewrite** | identity |
| Game vocabulary (CLASSER, COMPARER, call) | original | copied | **rewrite** | identity |
| Local storage keys | `gotfive:*` | copied | **replace** | identity |
| `GameOverReason = 'got-five'` | existing | copied | **replace** | identity sent over the network |
| Branded `data-testid`s | existing | copied | **replace** | identity |
| README, `.env.example`, launcher | original | copied | **rewrite** | identity |
| `scripts/share.mjs` (tunnel) | existing | copied | **adapt** | generic tool, texts to redo |
| Git history | existing | **not copied** | — | the new repository starts from a clean history |
| GitHub repository, Render, Cloudflare | existing | **not copied** | — | the new project has its own |

## Generic code kept

About **80% of the code** was reused as is or nearly: all of `server/src`,
all of `shared/src/game`, all of `shared/src/validation`, and most of
`client/src/components/ui`. That is know-how the new project legitimately
inherits — it comes from the author's work on their own personal project,
not from a third party.

## Content reviewed case by case

| Content | Verdict |
| --- | --- |
| Number → colour → value mapping | **generic structure**, rewritten with its own vocabulary. A cycle of 5 colours and 3 values over 60 items is an arithmetic construction, not a protectable expression. |
| Six classification gaps | game mechanics, kept |
| YES / NO answer on equal value | game mechanics, kept |
| Single call and elimination | game mechanics, kept |
| Rules texts | **entirely rewritten**, nothing borrowed |
| Displayed colour names | **replaced** by constellation names |
| Illustrations, templates, boards | none had been reused: everything was already drawn within the project |

A game's **mechanics** are not protected by copyright; its **expression** is.
This project keeps the former and entirely replaces the latter. This
technical transformation is not a legal analysis.

## References removed

A global search was required before publishing, covering: former name,
former package scope, former storage keys, former favicon, former
`data-testid`s, former URLs. The result is recorded in
`docs/COPY_VALIDATION.md`, and `npm run check:contract` keeps checking that
the former identity never comes back.
