# NOCTALIS

> Deux observateurs, un même ciel. Tu vois parfaitement la constellation de ton
> rival, jamais la tienne. Reconstitue tes cinq étoiles avant lui — et annonce
> **CONSTELLATION !**

Jeu de déduction à deux joueurs, en temps réel, dans le navigateur. Libre,
gratuit, open source. Sans compte, sans publicité, sans fonctionnalité payante.

[![CI](https://github.com/Toinezouz/Noctalis/actions/workflows/ci.yml/badge.svg)](https://github.com/Toinezouz/Noctalis/actions/workflows/ci.yml)
[![Licence: AGPL v3](https://img.shields.io/badge/licence-AGPL--3.0--or--later-blue.svg)](LICENSE)

**▶ [Jouer maintenant](https://noctalis.onrender.com)** — rien à installer.

---

## Sommaire

1. [Le jeu](#le-jeu)
2. [Jouer](#jouer)
3. [Installation](#installation)
4. [Architecture](#architecture)
5. [Confidentialité : le cœur du projet](#confidentialité--le-cœur-du-projet)
6. [Développement](#développement)
7. [Tests](#tests)
8. [Déploiement](#déploiement)
9. [Contribuer](#contribuer)
10. [Licence](#licence)
11. [Soutenir le projet](#soutenir-le-projet)

---

## Le jeu

Le ciel compte **60 étoiles**, numérotées de 1 à 60. Le numéro détermine tout :

- la **constellation** — cycle de 5 : Lyre, Aurore, Cygne, Braise, Phénix ;
- l'**éclat** — 1, 2 ou 3, par paquets de cinq numéros.

Chaque observateur reçoit **cinq étoiles secrètes**, une par constellation,
rangées par ordre croissant. Il en voit la constellation et la position,
**jamais le numéro**. Son rival, lui, les voit entièrement.

**Un tour, deux étapes.**

1. **Révéler** — choisissez une constellation ; le serveur tire au hasard une
   de ses étoiles encore au ciel, qui rejoint le relevé commun.
2. **Demander un indice** sur n'importe quelle étoile du relevé. Elle quitte
   alors le relevé et rejoint votre voûte.
   - **SITUER** — votre rival range cette étoile parmi vos cinq secrètes :
     six positions possibles.
   - **JAUGER** — vous désignez une de vos positions ; il répond OUI ou NON
     selon que les éclats sont égaux. La constellation n'entre jamais en compte.

**CONSTELLATION !** — À tout moment, une seule fois par observateur, annoncez
vos cinq étoiles. Exact : vous gagnez. Faux : vous êtes éliminé, mais vous
continuez de répondre aux indices de votre rival.

Une **carte du ciel** interactive et strictement privée vous aide à raisonner :
barrez les numéros impossibles, notez vos hypothèses. Rien n'est barré
automatiquement — la déduction vous appartient.

## Jouer

Une instance publique tourne sur
**[noctalis.onrender.com](https://noctalis.onrender.com)**. Elle est hébergée
sur le plan gratuit de Render : après quinze minutes sans trafic le service
s'endort, et le **premier chargement prend alors 30 à 60 secondes**. Ensuite,
le jeu répond normalement.

Un joueur crée une observation et obtient un **code à 5 caractères**. L'autre
le saisit. Rien à installer, rien à créer comme compte.

L'interface est disponible en **français** et en **espagnol**, avec un thème
**clair** et un thème **sombre** (automatique selon votre système). Chaque
joueur choisit les siens : deux personnes peuvent jouer la même partie dans
deux langues différentes.

## Installation

Pré-requis : **Node.js ≥ 20**.

```bash
git clone https://github.com/Toinezouz/Noctalis.git
cd noctalis
npm install
npm run dev
```

- Client : http://localhost:5173
- Serveur : http://localhost:3001 — état : `GET /health`

Pour une partie locale, ouvrez deux navigateurs (ou une fenêtre privée) :
chaque onglet est un observateur distinct.

## Architecture

```
noctalis/
├── shared/          moteur pur — ni React, ni Socket.IO
│   └── src/
│       ├── data/        les 60 étoiles, source de vérité unique
│       ├── game/        moteur, paquet, règles, hasard, sérialisation
│       ├── types/       étoiles, partie, actions, salon
│       ├── protocol/    contrat Socket.IO typé
│       └── validation/  validation des entrées clientes
├── server/          Express + Socket.IO, autorité sur la partie
├── client/          React 18 + Vite
├── tests/           unit/ (Vitest) et e2e/ (Playwright)
└── docs/            contrat, identité, audits, assets, licence
```

| Couche | Technologies |
| --- | --- |
| Client | React 18, TypeScript strict, Vite |
| Serveur | Node.js 20, Express, Socket.IO 4 |
| Partagé | TypeScript, aucune dépendance |
| Tests | Vitest, Testing Library, Playwright |
| Qualité | ESLint 9, TypeScript strict, vérificateur de contrat |

Le **moteur ne connaît ni le réseau ni l'affichage** : il se teste comme une
bibliothèque. Les signatures publiques sont figées par
[`docs/PROJECT_CONTRACT.md`](docs/PROJECT_CONTRACT.md), et `npm run check:contract`
échoue si le code s'en écarte.

## Confidentialité : le cœur du projet

Un joueur ne doit **jamais** pouvoir obtenir ses propres numéros. Ce n'est pas
une préférence, c'est la condition d'existence du jeu.

- L'état complet de la partie ne quitte **jamais** le serveur.
- Chaque client reçoit deux projections : `PublicGameState` (ce que tout le
  monde voit) et `PrivatePlayerState` (ce que lui seul voit).
- De ses propres étoiles, un joueur reçoit **la constellation et la position,
  rien d'autre** — pas même les éclats, qui réduiraient les candidats de 60 à 12.
- Les réponses aux indices sont **recalculées par le serveur** : un client
  modifié ne peut pas mentir.
- Un garde-fou (`findSecretLeak`) inspecte chaque envoi en développement et en
  test, et interrompt la partie plutôt que de laisser fuir un numéro.

Les tests bout en bout le vérifient dans un vrai navigateur, en inspectant le
DOM, le stockage local **et les trames WebSocket reçues**.

## Développement

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur + client en développement |
| `npm run build` | construit `shared`, `server`, puis `client` |
| `npm start` | démarre le serveur compilé |
| `npm test` | tests unitaires et d'intégration |
| `npm run test:e2e` | tests bout en bout |
| `npm run typecheck` | TypeScript strict, 4 projets |
| `npm run lint` | ESLint |
| `npm run check:contract` | vérifie que le code respecte le contrat |
| `npm run share` | partie à distance via un tunnel éphémère |

## Tests

```bash
npm test          # 154 tests Vitest
npm run test:e2e  # 29 scénarios Playwright, desktop et mobile
```

Les tests bout en bout lancent **le serveur de production** (`npm run build &&
npm start`) et jouent contre lui : même binaire, même origine, même façon de
servir le client que sur l'hébergeur. Playwright attend une vraie réponse de
`/health` avant de commencer.

| Fichier | Couverture |
| --- | --- |
| `tiles.test.ts` | les 60 étoiles, constellations et éclats, grille de la carte |
| `engine.test.ts` | mise en place, tirage du premier joueur, SITUER, JAUGER, annonce, états impossibles |
| `secrecy.test.ts` | projections publique et privée, absence de fuite, garde-fou |
| `multiplayer.test.ts` | vrai serveur Socket.IO : salon, synchronisation, mensonge impossible, reconnexion, revanche |
| `deduction.dom.test.tsx` | carte du ciel rendue : 60 cases, bascule, persistance, confidentialité |
| `theme.test.ts` | résolution du thème, **contrastes WCAG mesurés dans les deux thèmes** |
| `roulette.test.ts` | géométrie du tirage au sort |
| `secrecy.spec.ts` | anti-triche dans le navigateur : DOM, stockage, trames WebSocket |
| `game-flow.spec.ts` | partie complète à deux clients réels, reconnexion, revanche |

## Déploiement

Le serveur sert **lui-même** le client compilé : un seul service, une seule
origine, aucun problème de CORS.

```
git push → GitHub Actions (types, style, contrat, tests, build, E2E) → Render
```

[`render.yaml`](render.yaml) décrit le service : `npm ci && npm run build` pour
construire, `npm start` pour démarrer, sonde sur `/health`, déploiement
déclenché seulement quand les vérifications passent (`autoDeployTrigger:
checksPass`).

La marche à suivre complète, avec la liste de vérification après mise en
ligne, est dans [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Pour déployer votre propre instance :

1. forkez ce dépôt ;
2. sur [Render](https://render.com), *New → Blueprint*, pointez sur votre fork ;
3. Render lit `render.yaml` et crée le service ;
4. vérifiez que `GET /health` répond `{"status":"ok"}`.

Aucun secret n'est nécessaire : le projet n'en utilise aucun.

**Limite assumée** : les observations vivent en mémoire. Un redémarrage du
service perd les parties en cours. C'est suffisant pour des parties de
quelques dizaines de minutes, et ça évite une base de données dont le projet
n'a pas besoin.

## Contribuer

Les contributions sont bienvenues — code, traduction, accessibilité,
relecture. Lisez [CONTRIBUTING.md](CONTRIBUTING.md) pour l'installation, les
commandes et les conventions, et [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) pour
l'esprit des échanges.

Une faille de sécurité ne se signale **pas** en issue publique :
voir [SECURITY.md](SECURITY.md).

## Licence

**AGPL-3.0-or-later** — voir [LICENSE](LICENSE).

NOCTALIS est joué à travers un réseau : l'AGPL garantit que toute version
modifiée et hébergée pour d'autres reste, elle aussi, libre. Le raisonnement
complet est dans [docs/LICENSING.md](docs/LICENSING.md).

Ce projet est indépendant. Il n'est affilié à aucun éditeur de jeux de société
et ne se présente comme la version officielle d'aucun jeu existant.

## Soutenir le projet

NOCTALIS est libre et open source. **Tout le jeu est accessible gratuitement**,
sans compte, sans publicité, sans abonnement, et aucune fonctionnalité n'est
réservée à qui que ce soit — y compris aux personnes qui soutiennent le projet.

Si le jeu vous plaît, vous pouvez soutenir son développement et sa maintenance :

### ♥ [github.com/sponsors/Toinezouz](https://github.com/sponsors/Toinezouz)

C'est le **seul** moyen de soutien du projet : pas de Patreon, pas de Ko-fi,
pas de Stripe, pas de PayPal. Et c'est entièrement facultatif.
