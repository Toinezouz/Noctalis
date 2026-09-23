# Audit du projet d'origine

> Rapport d'inspection réalisé **avant toute copie**, en lecture seule.
> Le projet d'origine n'a été ni modifié, ni renommé, ni déplacé.
> Il reste à `/home/user/Got-Five`, sur son dépôt `Toinezouz/Got-Five`, commit
> `f650a15`, arbre de travail propre — état vérifié avant et après la copie.

## 1. Vue d'ensemble

| | |
| --- | --- |
| Nature | Jeu de déduction à 2 joueurs, navigateur, temps réel |
| Monorepo | npm workspaces : `shared`, `server`, `client` + `tests/` à la racine |
| Langages | TypeScript strict (`noUncheckedIndexedAccess`), React 18, Node 20+ |
| Réseau | Socket.IO 4, serveur autoritaire |
| Tests | Vitest (unitaires + jsdom), Playwright (E2E, desktop + mobile) |
| Qualité | ESLint 9 (flat config), typecheck sur 4 projets TS |
| Licence déclarée | MIT (`package.json`) |

## 2. Volumétrie

| Zone | Lignes | Fichiers |
| --- | --- | --- |
| `shared/src` | 1 805 | 14 |
| `server/src` | 1 014 | 6 |
| `client/src` | 8 271 | 57 |
| `tests/` | 3 538 | 21 |
| `scripts/` | 1 043 | 1 |
| **Total source** | **~15 700** | **103** |

## 3. Arborescence

```
Got-Five/
├── shared/src/
│   ├── data/tiles.ts            source de vérité des 60 tuiles
│   ├── game/                    engine, deck, rules, rng, serialize
│   ├── types/                   tiles, game, actions, room
│   ├── protocol/events.ts       contrat Socket.IO typé
│   └── validation/              validation des entrées client
├── server/src/
│   ├── index.ts                 point d'entrée (PORT, CLIENT_URL, NODE_ENV)
│   ├── createServer.ts          Express + Socket.IO + /health + statique
│   ├── rooms/RoomManager.ts     salons en mémoire, TTL, jetons
│   ├── security/                rateLimit, tokens (timingSafeEqual)
│   └── socket/handlers.ts       tous les événements, revalidés
├── client/src/
│   ├── app/                     App, GameContext
│   ├── components/              game (17), ui (7)
│   ├── features/                deduction, dialogs, game, room
│   ├── i18n/                    fr, es, provider
│   ├── lib/                     audio, socket, storage, theme, roulette
│   └── styles/                  tokens, base, ui, game, deduction, screens
├── tests/unit/ (13)  tests/e2e/ (8)
└── scripts/share.mjs            tunnel Cloudflare + diagnostic
```

## 4. Moteur de jeu

Entièrement pur : `shared/src/game/` ne connaît ni React ni Socket.IO, et se
teste comme une bibliothèque.

- **Données** : 60 tuiles numérotées 1–60. Le numéro détermine la couleur
  (cycle de 5) et les points (`(⌊(n-1)/5⌋ mod 3) + 1`). Source unique.
- **RNG injectable** (`Rng`), `defaultRng` en production, `createSeededRng`
  pour des parties reproductibles en test.
- **Machine à états** : `WAITING_FOR_PLAYER` → `LOBBY_READY` → `SETUP` →
  `TURN_REVEAL` ⇄ `TURN_HINT` → `WAITING_FOR_CLASSIFY` / `WAITING_FOR_COMPARE`
  → `GAME_OVER`.
- **Tour** : révéler une tuile (couleur choisie, tirage serveur) puis demander
  un indice. La tuile utilisée quitte la zone commune.
- **Indices** : classement parmi les tuiles secrètes (6 encoches) ou
  comparaison de points (OUI/NON). La réponse du client est **ignorée** et
  recalculée par le serveur.
- **Fin** : tentative unique par joueur ; exacte → victoire, fausse →
  élimination ; réserve vide → nul.
- **Premier joueur tiré au sort**, annoncé par une animation.

## 5. Sécurité et confidentialité

C'est la propriété centrale du projet, à préserver intégralement.

- Le `GameState` serveur ne sort **jamais** tel quel.
- Deux projections : `toPublicGameState(state)` et
  `toPlayerPrivateState(state, playerId)`.
- Un joueur reçoit de ses propres tuiles **uniquement couleur + position** —
  jamais le numéro, et volontairement pas les points (ils réduiraient les
  candidats de 60 à 12).
- `findSecretLeak()` : garde-fou exécuté en dev/test avant chaque diffusion.
- Jetons de reconnexion comparés en temps constant, limitation de débit par
  socket, charge utile Socket.IO plafonnée à 16 Kio.

## 6. Interface

Table de jeu (adversaire en haut, zone commune au centre, joueur en bas),
fiche de déduction 1–60 interactive et privée, design system en jetons CSS,
thèmes clair et sombre, bilingue fr/es, animations respectant
`prefers-reduced-motion`, responsive de 375 px à 1440 px.

## 7. Assets — inventaire complet

| Asset | Nature | Origine | Verdict |
| --- | --- | --- | --- |
| `client/public/favicon.svg` | SVG 5 lignes | écrit dans le projet | à remplacer (identité) |
| Personnages des tuiles | SVG inline, 5 variantes | écrits dans le projet | à remplacer (identité) |
| Tuiles, supports, textures | CSS pur (gradients, ombres) | écrits dans le projet | génériques, réutilisables |
| Fredoka Variable | police | `@fontsource-variable/fredoka` (SIL OFL) | libre, mais liée à l'identité |
| Nunito Variable | police | `@fontsource-variable/nunito` (SIL OFL) | libre, réutilisable |
| Sons | synthétisés à la volée (Web Audio) | aucun fichier | génériques, réutilisables |
| Images bitmap | **aucune** | — | — |

**Aucun asset propriétaire, aucune image hotlinkée, aucune ressource de
l'éditeur du jeu de plateau.** Une recherche sur le nom de l'éditeur ne
retourne aucune occurrence dans le dépôt.

## 8. Empreinte de l'identité à remplacer

| Nature | Occurrences |
| --- | --- |
| Imports `@gotfive/*` (noms de paquets) | 67 |
| Chaînes visibles « GOT FIVE » (UI, commentaires) | 66 |
| Clés de stockage `gotfive:*` | 6 |
| Favicon, `<title>`, métadonnées HTML | 1 fichier |
| README, `.env.example`, `jouer.cmd`, `scripts/share.mjs` | 4 fichiers |

## 9. Configuration

- **Git** : dépôt unique `Toinezouz/Got-Five`, branche de travail
  `claude/got-five-browser-game-fe95e7`.
- **Render** : aucune configuration présente (`render.yaml` absent).
- **Cloudflare** : pas d'intégration permanente ; `scripts/share.mjs` ouvre un
  tunnel éphémère à la demande, en téléchargeant `cloudflared` dans un cache
  local. Aucun jeton, aucun compte.
- **Variables d'environnement** : `PORT`, `NODE_ENV`, `CLIENT_URL`,
  `ROOM_TTL_MS`, `VITE_SERVER_URL`. `.env.example` sans aucun secret.
- **CI** : aucune (pas de `.github/`).

## 10. Points déjà favorables à un déploiement Render

Constatés à l'audit, sans modification :

- le serveur lit déjà `process.env.PORT` ;
- il sert déjà le client compilé (`express.static` + repli SPA) — un seul
  service suffit donc ;
- `GET /health` existe déjà ;
- `SIGTERM` est déjà géré proprement.

## 11. Conclusion de l'audit

Le projet se sépare nettement en deux couches :

1. une **infrastructure générique** (réseau, salons, reconnexion, sérialisation
   public/privé, design system, tests, outillage) — réutilisable telle quelle ;
2. une **identité** (nom, vocabulaire, personnages, favicon, textes) — à
   remplacer intégralement.

Aucun obstacle technique à la copie. Aucun asset à écarter pour des raisons de
droits : tout ce qui est remplacé l'est pour créer une identité propre, pas
parce qu'il serait impubliable.
