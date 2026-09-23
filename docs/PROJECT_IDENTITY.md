# Project identity — UMBRASTRA

## Name

**UMBRASTRA**

An invented word made of two Latin ones: *umbra*, the shadow, and *astra*,
the stars. **The stars in the shadow**: that is the whole game, where your own
five stars stay hidden from you while everyone else's shine in plain sight.

It reads the same in English, French and Spanish, with nothing to translate
or decline, and it has no link, in sound or in meaning, with the game whose
technical architecture this project started from.

### Why not NOCTALIS any more

The game was called NOCTALIS up to version 1.3. A search in September 2026
showed the name was already widely used: an independent game studio on
itch.io, a French digital agency, a bat museum in Germany (open since 2006),
a novel series and several musicians. UMBRASTRA had no such use as a game,
app or brand in that search. That search was not a trademark clearance:
check the trademark registers (INPI, EUIPO) before any commercial use.

## Tagline

- **en** — "Find your constellation before anyone else."
- **fr** — « Devine ta constellation avant les autres. »
- **es** — «Adivina tu constelación antes que nadie.»

The first taglines ("… avant lui", "… antes que él") assumed a single rival
and a gender; they were rewritten with 1.1, when tables grew to four.

## Pitch

Two to four stargazers under the same sky. Everyone can see everybody's
stars, except their own. By asking questions about the stars of the open sky,
each person pieces their own five stars together — and the first to call them
right, **CONSTELLATION!**, wins.

## World

**Astronomy, not astrology.** The game looks like a night at the
observatory: stars seen through an eyepiece, real constellations, a star
chart with its coordinate grid, a total eclipse for a logo. Nothing
esoteric: no fate, no signs, no engraved brass, no invented symbols.

- **Dark theme** (the default) — the sky itself: near-black, starlight blue,
  a faint band of Milky Way, a sun-like yellow for highlights.
- **Light theme** — a modern printed star chart: cool white paper, navy
  lines, chart blue.

## Vocabulary

This table is the single reference. No other term should appear in the
interface.

| Concept | English | French | Spanish |
| --- | --- | --- | --- |
| Numbered item 1–60 | **star** | étoile | estrella |
| Colour family (5) | **constellation** | constellation | constelación |
| Value 1 to 3 | **spark** | éclat | destello |
| Shared area | **the open sky** | le ciel commun | el cielo común |
| A player's stars | **row** | rangée | fila |
| "classify" hint | **PLACE** | SITUER | SITUAR |
| "compare" hint | **GAUGE** | JAUGER | MEDIR |
| Final call | **CONSTELLATION!** | CONSTELLATION ! | ¡CONSTELACIÓN! |
| Deduction sheet | **star chart** | carte du ciel | carta celeste |
| Wrong call | **out of the race** | hors course | fuera de la carrera |
| People | **everyone at the table, the others** | astronomes, adversaires, les autres | personas, el resto |

The five constellations, in internal order (`green`, `pink`, `blue`, `red`,
`orange` — technical identifiers, unchanged):

All five are **real constellations**, drawn from their actual stick figures
(simplified, north up), and each colour has an astronomical reason:

| Identifier | English | French | Spanish | Figure | Why this colour |
| --- | --- | --- | --- | --- | --- |
| `green` | Lyra | Lyre | Lira | Vega above a small parallelogram | the blue-green glow of the Ring Nebula (M57) |
| `pink` | Orion | Orion | Orión | the shoulders, the belt, Saiph and Rigel | the pink of the Orion Nebula (M42) |
| `blue` | Cygnus | Cygne | Cisne | the Northern Cross, from Deneb to Albireo | the blue companion of Albireo |
| `red` | Scorpius | Scorpion | Escorpio | the claws, Antares, the curved tail | Antares, a red supergiant |
| `orange` | Cassiopeia | Cassiopée | Casiopea | the W | Schedar, an orange giant |

Up to version 1.4 the pink, red and orange constellations were invented
ones (Aurora, Ember, Phoenix); they were replaced by real ones in 1.5.

The technical identifiers stay as they are: they are never shown, and
freezing them avoids a pointless migration of the engine, tests and CSS.

## Writing for players

- **Talk about the game, never the machinery.** No "server", "data" or
  "session" in the interface; they belong in the README.
- **Write for everyone at the table.** In French and Spanish, words that do
  not assume anybody's gender (« astronome », « adversaire », « personne »,
  « persona », « quien juega »), no median dots or other markers.
- **Be warm and brief.** The rules read like a friend explaining the game.

These principles are partly enforced by `tests/unit/i18n.test.ts`.

## Logo

A **total solar eclipse**: the Moon's black disc (the *umbra*, the shadow the
name comes from), the pale corona around it, the last bead of sunlight on its
edge, and a few stars, as they appear in the sky during totality. Drawn in
SVG, with no dependency, used as favicon and in the header.

## Type

| Role | Typeface | Why |
| --- | --- | --- |
| Titles, star numbers | **Space Grotesk** | a grotesque with a technical, instrument-panel feel; its figures read like a readout |
| Everything else | **Jost** | a clear geometric sans-serif, very legible at small sizes |

Both are self-hosted and released under the SIL Open Font License.

## Palette

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#eef2f8` chart paper | `#05080f` night sky |
| Panels | `#fbfcfe` | `#0c1428` |
| Ink | `#101a33` navy | `#e6ebf5` |
| Accent | `#2553b8` chart blue | `#8db8ff` starlight |
| Second accent | `#b5304f` hydrogen red | `#ff8fa6` |
| Highlight | `#9a6a00` (text) / `#f0b429` sun yellow | `#f5c451` |

The five constellations keep the same colours in both themes, so the star
chart always matches the table:

| Constellation | Colour | Deep | Light |
| --- | --- | --- | --- |
| Lyra | `#2fbf9f` | `#0e5b52` | `#b9f5e4` |
| Orion | `#e0679f` | `#6e1f47` | `#ffd0e4` |
| Cygnus | `#4f8ff7` | `#173b86` | `#d0e2ff` |
| Scorpius | `#ec5a47` | `#7a1d17` | `#ffd2c6` |
| Cassiopeia | `#f0a232` | `#7a4a08` | `#ffe7bd` |

Contrast is measured, not guessed: `tests/unit/theme.test.ts` checks the WCAG
ratios of the main text and accent pairs in both themes.

## The stars

Each star is **a star seen through the eyepiece**:

- face up — a disc of night sky lit by the constellation's colour, a thin
  coloured field ring with four reticle marks, the constellation's figure at
  the top, the number in Space Grotesk, and one to three round **sparks**
  underneath, as in a star chart's brightness legend;
- my own, hidden — **not observed yet**: a dark field, a dashed ring in the
  constellation's colour, its figure, a question mark, and the position in a
  small badge;
- gauged with a NO — dimmed, inside a dashed halo.

The constellation figures carry the identity even without colour, which
matters for colour-blind players.

The home screen shows a **sky chart** turning slowly around the celestial
pole: circles of declination, hour circles, and the five constellations.

## Positioning

UMBRASTRA is an **independent open-source project**. It is not affiliated with
any publisher, reuses no protected content, and does not present itself as
the official version of any existing game. It reuses the technical
architecture of an earlier personal project by the same author, which this
documentation says openly.
