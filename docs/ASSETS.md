# Asset inventory

Every resource published with UMBRASTRA, where it comes from, and its licence.
A resource of uncertain origin would not be published.

## Drawings

| Asset | Kind | Origin | Licence | Location |
| --- | --- | --- | --- | --- |
| UMBRASTRA mark (a total eclipse) | inline SVG | drawn for this project | AGPL-3.0-or-later | `client/src/components/ui/BrandMark.tsx` |
| Favicon | SVG | drawn for this project | AGPL-3.0-or-later | `client/public/favicon.svg` |
| Constellation figures (5) | inline SVG | drawn for this project, traced from the real stick figures of Lyra, Orion, Cygnus, Scorpius and Cassiopeia (star positions are facts, not anyone's work) | AGPL-3.0-or-later | `client/src/components/game/Asterism.tsx` |
| Line icons | inline SVG | drawn for this project | AGPL-3.0-or-later | `client/src/components/ui/Icon.tsx` |
| Sky chart of the home screen | inline SVG | drawn for this project | AGPL-3.0-or-later | `client/src/components/ui/SkyChart.tsx` |
| Stars (eyepiece discs), rows, name plates, starfield | pure CSS (gradients, shadows) | written for this project | AGPL-3.0-or-later | `client/src/styles/` |
| Opening wheel | CSS | written for this project | AGPL-3.0-or-later | `client/src/features/game/StartRoulette.tsx`, `game.css` |

**The game itself shows no bitmap image.** Everything players see is vector
or computed by the browser. The only bitmap served with it is the link
preview below, which chat apps display, not the game.

## Screenshots

| File | What | Licence |
| --- | --- | --- |
| `docs/images/table-dark.png` | a game for four, dark theme | AGPL-3.0-or-later |
| `docs/images/home-light.png` | the home screen, light theme | AGPL-3.0-or-later |

They are captures of this project, used by the README only. They are not
part of the game.

## Link preview

| File | What | Licence |
| --- | --- | --- |
| `client/public/og-image.jpg` | 1200 × 630 card shown by chat apps and social networks when a link is shared | AGPL-3.0-or-later |

It is a composition made for this project: the eclipse logo, the UMBRASTRA
name set in Space Grotesk, five CSS stars not observed yet, and
`docs/images/table-dark.png` in perspective, rendered with the project's own
Chromium (Playwright) and saved as a JPEG (quality 86, well under the size
limits of chat apps).

## Fonts

| Font | Origin | Licence | Delivery |
| --- | --- | --- | --- |
| Space Grotesk Variable | `@fontsource-variable/space-grotesk` (npm), by the Space Grotesk Project Authors | SIL Open Font License 1.1 | bundled at build time, served from the same domain |
| Jost Variable | `@fontsource-variable/jost` (npm), by the Jost Project Authors | SIL Open Font License 1.1 | same |

The SIL OFL allows use, modification and redistribution, including in an
AGPL project. The fonts are **self-hosted**: no request to a third-party
service, so players' IP addresses leak nowhere.

## Sounds

No audio file. Every sound is **synthesised on the fly** with the Web Audio
API (`client/src/lib/audio.ts`): oscillators and envelopes in a few lines.
Nothing to download, nothing to credit, and the game is perfectly playable
without sound.

## External resources

**None.** No CDN, no remote image, no online font, no third-party script, no
analytics. The game only loads what its own server sends.

## Checking

```bash
# No binary file among the game's sources:
find client/src client/public shared/src server/src -type f \
  ! -name '*.ts' ! -name '*.tsx' ! -name '*.css' ! -name '*.svg'

# No remote resource referenced:
grep -rn "https\?://" client/src --include='*.ts' --include='*.tsx' --include='*.css' \
  | grep -v "github.com" | grep -v "w3.org"
```

The first command should print nothing; the second only the GitHub links
(source code, licence, Sponsors) and the W3C SVG namespace.
