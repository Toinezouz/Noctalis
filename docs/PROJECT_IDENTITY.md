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

A night-time survey of the sky, drawn like an astronomical instrument: brass
rings and graduations, engraved capitals, constellation figures, a chart
annotated by hand.

- **Dark theme** — the night itself: deep blue, a field of stars, brass.
- **Light theme** — an old celestial atlas: parchment, indigo ink, brass.

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

| Identifier | English | French | Spanish | Figure |
| --- | --- | --- | --- | --- |
| `green` | Lyra | Lyre | Lira | a bright star above a parallelogram |
| `pink` | Aurora | Aurore | Aurora | an arc of light and its curtain |
| `blue` | Cygnus | Cygne | Cisne | a swan in flight, a cross |
| `red` | Ember | Braise | Brasa | a flame over a glowing coal |
| `orange` | Phoenix | Phénix | Fénix | wings spread above a long tail |

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

A disc of night carrying stars joined by the lines of a constellation, ringed
with brass — drawn in SVG, with no dependency, used as favicon and in the
header.

## Type

| Role | Typeface | Why |
| --- | --- | --- |
| Titles, star numbers | **Cinzel** | capitals inspired by engraved inscriptions, like the lettering of an astrolabe |
| Everything else | **Jost** | a clear geometric sans-serif, very legible at small sizes |

Both are self-hosted and released under the SIL Open Font License.

## Palette

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#f2ecdf` parchment | `#070b1a` deep night |
| Panels | `#faf6ec` | `#10163a` |
| Ink | `#1b1d3f` indigo | `#ecebf8` |
| Accent | `#3d3fa0` night indigo | `#a4a8ff` |
| Second accent | `#9c3f6e` dusky rose | `#f08cc4` |
| Brass | `#a57a23` | `#e8bd5a` |

The five constellations are jewel tones that glow on dark discs, identical in
both themes, so the star chart always matches the table:

| Constellation | Colour | Deep | Light |
| --- | --- | --- | --- |
| Lyra | `#27b39b` | `#0c5d5a` | `#9ef0d8` |
| Aurora | `#cf5fb5` | `#6a1f63` | `#f7b8e6` |
| Cygnus | `#4d8ef0` | `#1b3b8f` | `#b6d4ff` |
| Ember | `#e2583f` | `#7c1f1c` | `#ffc0a8` |
| Phoenix | `#e0a02c` | `#7a4c07` | `#ffe2a0` |

Contrast is measured, not guessed: `tests/unit/theme.test.ts` checks the WCAG
ratios of the main text and accent pairs in both themes.

## The stars

Stars are **round medallions**, like the dial of an astronomical instrument:

- face up — a glowing sphere in the constellation's colour, a brass rim with
  graduations, the constellation's figure at the top, the number engraved in
  Cinzel, and one to three four-pointed **sparks** underneath;
- my own, hidden — an **eclipsed** disc: dark heart, coloured halo, the
  constellation's figure, a question mark, and the position in a small moon;
- gauged with a NO — dimmed, inside a dashed halo.

The constellation figures carry the identity even without colour, which
matters for colour-blind players.

## Positioning

UMBRASTRA is an **independent open-source project**. It is not affiliated with
any publisher, reuses no protected content, and does not present itself as
the official version of any existing game. It reuses the technical
architecture of an earlier personal project by the same author, which this
documentation says openly.
