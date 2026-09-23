# GOT FIVE! — version navigateur, 2 joueurs, temps réel

> Le jeu de logique et de déduction : tes 5 tuiles sont cachées **pour toi**,
> mais ton adversaire les voit. Déduis-les avant lui et annonce **GOT FIVE!**

Implémentation web complète et jouable d'une adaptation à 2 joueurs de
*GOT FIVE!* : serveur autoritaire Socket.IO, interface React responsive, fiche
de déduction 1–60 interactive, et une règle de sécurité non négociable —
**un joueur ne reçoit jamais ses propres numéros secrets**, à aucun endroit.

Ce dépôt contient une implémentation originale des règles (aucun asset,
illustration ou texte de l'éditeur n'est réutilisé) : toutes les illustrations,
tuiles, personnages et textures sont dessinés en SVG/CSS dans ce projet.

---

## Sommaire

1. [Démarrage rapide](#démarrage-rapide)
2. [Jouer à distance avec un ami](#jouer-à-distance-avec-un-ami) — dont
   [lancer sans terminal](#lancer-sans-terminal-windows),
   [mettre à jour le jeu](#mettre-à-jour-le-jeu),
   [comment le lien est rendu fiable](#comment-le-lien-est-rendu-fiable) et le
   [diagnostic](#diagnostic)
3. [Commandes](#commandes)
4. [Langues](#langues)
5. [Thème clair et sombre](#thème-clair-et-sombre)
6. [Architecture](#architecture)
7. [Règles implémentées](#règles-implémentées)
8. [Protection des informations secrètes](#protection-des-informations-secrètes)
9. [Rooms, sessions et reconnexion](#rooms-sessions-et-reconnexion)
10. [Protocole Socket.IO](#protocole-socketio)
11. [Machine à états](#machine-à-états)
12. [Fiche de déduction](#fiche-de-déduction)
13. [Sécurité](#sécurité)
14. [Tests](#tests)
15. [Build et déploiement](#build-et-déploiement)
16. [Accessibilité et responsive](#accessibilité-et-responsive)

---

## Démarrage rapide

Pré-requis : **Node.js ≥ 20**.

```bash
git clone <ce-depot>
cd Got-Five
cp .env.example .env      # facultatif : les valeurs par défaut suffisent
npm install
npm run dev
```

- Client : http://localhost:5173
- Serveur : http://localhost:3001 (état : `GET /health`)

Pour jouer : ouvre **deux navigateurs** (ou deux fenêtres, dont une en navigation
privée — chaque onglet est un joueur distinct).

1. Navigateur A : *Créer une partie* → un code à 5 caractères s'affiche (ex. `AB7K9`).
2. Navigateur B : *Rejoindre une partie* → saisir le code.
3. Navigateur A (l'hôte) : *Lancer la partie*.

---

## Jouer à distance avec un ami

Les deux joueurs n'ont pas besoin d'être sur le même réseau : ils se retrouvent
par **code de partie**, pas par adresse IP. Sous Windows, **double-clique sur
`jouer.cmd`** ; ailleurs (ou en terminal), une seule commande suffit :

```bash
npm run share
```

Elle construit le jeu si nécessaire, ouvre un **tunnel Cloudflare temporaire**
vers ta machine, puis démarre le serveur en n'autorisant que l'adresse de ce
tunnel. Le lien s'affiche dans un cadre :

```
┌──────────────────────────────────────────────────────────────┐
│ Partage ce lien avec ton ami :                               │
│                                                              │
│ https://xxxx-yyyy-zzzz.trycloudflare.com                     │
│                                                              │
│ Toi : Créer une partie → tu obtiens un code à 5 caractères.  │
│ Lui : Rejoindre une partie → il saisit ce code.              │
│                                                              │
│ Ctrl+C ferme le tunnel : le lien cesse alors de fonctionner. │
└──────────────────────────────────────────────────────────────┘
```

Ton ami ouvre le lien dans son navigateur, clique sur **Rejoindre une partie**
et saisit le code que tu lui donnes. Rien à installer de son côté.

Compte quelques secondes — parfois une minute — avant l'affichage du cadre : le
script attend que le tunnel soit vraiment établi, que son nom soit publié dans le
DNS et qu'il réponde, plutôt que de te donner un lien qui ne marche pas encore
(voir [comment le lien est rendu fiable](#comment-le-lien-est-rendu-fiable)).

### Lancer sans terminal (Windows)

`jouer.cmd`, à la racine du projet, fait exactement ce que fait `npm run share`.
Un double-clic ouvre une fenêtre, prépare le jeu et affiche le lien à partager.

Pour l'avoir sous la main : clic droit sur `jouer.cmd` → **Envoyer vers** →
**Bureau (créer un raccourci)**. Le raccourci fonctionne depuis n'importe où, le
script se replace tout seul dans le dossier du jeu.

Le fichier se charge aussi des corvées : il vérifie que Node.js est présent
(et explique où le prendre sinon), **réinstalle les dépendances** si
`package-lock.json` a changé, et **reconstruit** le jeu si les sources sont plus
récentes que le dernier build. Après un `git pull`, un double-clic suffit donc,
sans aucune commande.

Pour arrêter : **Ctrl+C**, puis `O` pour confirmer — le tunnel se ferme et le
lien cesse de fonctionner. La fenêtre reste ouverte à la fin (y compris en cas
d'échec) pour que le message reste lisible.

Un raccourci peut aussi porter des options, à ajouter après le chemin dans son
champ *Cible* : `jouer.cmd --local` pour une partie sans tunnel, ou
`jouer.cmd --port 4000` si le port 3001 est occupé.

### Mettre à jour le jeu

```bash
# dans le terminal où tourne la partie : Ctrl+C
git pull
npm run share      # ou double-clic sur jouer.cmd
```

Pas besoin de penser à installer ni à reconstruire : le script compare les dates
et s'en charge tout seul — dépendances si `package-lock.json` a changé, build si
les sources sont plus récentes, c'est-à-dire exactement ce qui arrive après un
`git pull`. `npm run share -- --build` force la reconstruction si tu as un doute.

Ton ami n'a rien à faire : le lien change à chaque session, il ouvre simplement
le nouveau.

### Comment le lien est rendu fiable

`cloudflared` affiche l'adresse du tunnel **avant** que celui-ci ne soit
réellement établi, et le nom n'existe dans le DNS mondial que quelques secondes
plus tard. Ouvrir le lien trop tôt donne « ce site est inaccessible » — et comme
un `NXDOMAIN` est mis en cache, l'erreur peut coller un moment. Le script ne
t'affiche donc jamais une adresse qu'il n'a pas vérifiée lui-même :

1. il attend la ligne d'**enregistrement** de la connexion vers Cloudflare
   (jusqu'à 25 s) ; sans elle, le tunnel n'existe pas et il réessaie en HTTP/2,
   pour les réseaux qui bloquent l'UDP ;
2. il attend ensuite la **publication du nom** dans le DNS (jusqu'à 45 s, un
   point s'affiche à chaque essai) ;
3. il vérifie enfin que c'est bien **le serveur GOT FIVE!** qui répond à cette
   adresse, en se connectant à l'IP obtenue tout en présentant le bon nom
   (en-tête `Host` et SNI).

Si l'une de ces étapes échoue, une nouvelle adresse est tirée automatiquement.
Au bout du compte, un lien affiché est un lien qui répond.

Pour résoudre le nom, le script ne dépend pas du résolveur de ta box, souvent
lent à voir apparaître un nom neuf — ou configuré pour filtrer
`trycloudflare.com` (fournisseur d'accès, antivirus, contrôle parental). Il
essaie en cascade :

1. le résolveur du système ;
2. les DNS publics **en direct** (1.1.1.1, 8.8.8.8, 9.9.9.9) ;
3. le **DNS-over-HTTPS** de ces mêmes résolveurs, qui franchit aussi un port 53
   filtré.

Quand seul un DNS public a répondu, le lien est quand même valable pour ton ami :
il est affiché normalement, avec une note t'expliquant que **toi** tu dois jouer
sur `http://localhost:3001` — c'est la même partie. Le message te donne aussi la
ligne à coller dans ton fichier `hosts`, ou le DNS à changer, si tu veux ouvrir
le lien depuis cette machine également.

### Diagnostic

```bash
npm run share -- --check        # ouvre un tunnel, le teste, puis s'arrête
npm run share -- --verify URL   # teste un lien déjà ouvert
```

`--check` indique aussi **par quel résolveur** le nom a été traduit, et combien
de temps sa publication a demandé : si ton propre résolveur n'y arrive pas alors
qu'un DNS public répond, tu sais immédiatement que ton réseau filtre ce domaine.

| Message | Cause probable | Remède |
| --- | --- | --- |
| `le nom … n'a pu être résolu par aucun DNS` | nom pas encore publié, ou port 53 **et** DNS-over-HTTPS bloqués | relance la commande ; si cela se répète, teste en partage de connexion mobile |
| `Téléchargement impossible : HTTP …` | GitHub inaccessible (proxy, filtrage) | installe cloudflared manuellement, ou passe par `CLOUDFLARED_BIN` |
| `aucune connexion enregistrée après 25 secondes` | sortie vers Cloudflare bloquée (UDP **et** HTTP/2) | teste en partage de connexion mobile, ou passe par un hébergement |
| `nom non publié après 45 secondes` | publication DNS anormalement lente côté Cloudflare | relance la commande : une nouvelle adresse est tirée |
| `aucun tunnel utilisable` | les deux tentatives (QUIC puis HTTP/2) ont échoué | relance avec `--verbose` pour voir la négociation en direct |
| `quelque chose répond à cette adresse, mais ce n'est pas le serveur GOT FIVE!` | un autre programme occupe le port | `npm run share -- --port 4000` |
| le lien est **vérifié** mais ton navigateur affiche « ce site est inaccessible » | ton résolveur filtre ce nom (voir ci-dessus) ou ton navigateur a son propre DNS sécurisé | joue sur `http://localhost:3001` ; pour ouvrir le lien ici aussi, change de DNS ou ajoute la ligne `hosts` que le script affiche |

Sans tunnel disponible, le script affiche la sortie exacte de cloudflared puis
démarre quand même le jeu en local.

---

## Commandes

| Commande | Effet |
| --- | --- |
| `npm install` | Installe les dépendances des 3 espaces de travail |
| `npm run dev` | Serveur (3001) + client (5173) en parallèle |
| `npm run dev:server` / `npm run dev:client` | Un seul des deux |
| `npm run build` | Construit `shared`, `server` (bundle esbuild) et `client` (Vite) |
| `npm start` | Lance le serveur construit (sert aussi `client/dist` s'il existe) |
| `npm run share` | Partie à distance : build + tunnel public temporaire + serveur |
| `npm test` | Tests unitaires + intégration multijoueur (Vitest) |
| `npm run test:e2e` | Tests de bout en bout (Playwright, 2 navigateurs réels) |
| `npm run typecheck` | TypeScript strict sur les 4 projets |
| `npm run lint` | ESLint (règles typées) |

### Dépendances et `npm audit`

`npm install` signale 5 vulnérabilités. Elles concernent **uniquement des
outils de développement** : `vite`, `vitest`, `esbuild`, `vite-node`. Côté
production, le compte est différent :

```bash
npm audit --omit=dev     # found 0 vulnerabilities
```

Ce qui tourne réellement quand tu joues, c'est `express`, `socket.io`, `cors`
côté serveur, et un bundle statique côté navigateur : aucun de ces paquets
n'est concerné. Les avis publiés visent le **serveur de développement**
(`npm run dev`, accessible depuis une page web malveillante ouverte au même
moment) et l'**interface graphique de Vitest**, que ce projet n'utilise pas.
`npm run share` et un déploiement servent le build de production : ils ne sont
pas exposés.

Corriger ces alertes demande `npm audit fix --force`, qui installe des versions
majeures de la chaîne de test et de build : un chantier à mener avec les tests
en filet, pas un correctif à appliquer à l'aveugle.

**Scripts d'installation bloqués.** Les npm récents refusent par défaut les
scripts `postinstall`, dont celui d'esbuild. Ce n'est pas gênant ici : esbuild
livre son binaire via ses `optionalDependencies` (`@esbuild/<plateforme>`), et
le script ne fait que le vérifier. Si un jour un build échoue sur une erreur
esbuild, autorise-le explicitement :

```bash
npm install-scripts approve esbuild   # npm récents
npm run build                         # doit se terminer sans erreur
```

---

## Langues

Le jeu est disponible en **français** et en **espagnol**. La langue est choisie
automatiquement d'après celle du navigateur (`es` → espagnol, sinon français) et
reste modifiable à tout moment : sur l'accueil, ou via les drapeaux du bandeau
de jeu. Le choix est mémorisé localement, et `<html lang>` ainsi que le titre de
la page suivent.

**Les deux joueurs peuvent jouer dans des langues différentes.** Le serveur ne
rédige aucune phrase : chaque événement d'historique est transmis sous forme de
code et de paramètres (`{ code: 'tile-revealed', params: { name, tile } }`), et
chaque client le rend dans sa propre langue. Il en va de même pour les erreurs,
qui portent toutes un code (`ROOM_FULL`, `NOT_YOUR_TURN`…).

```
client/src/i18n/
├── fr.ts        # catalogue de référence (~230 messages)
├── es.ts        # espagnol, type `Messages` : une clé manquante casse le build
└── index.tsx    # contexte, hook useI18n, détection, interpolation {variables}
```

Ajouter une langue :

1. copier `fr.ts` en `xx.ts`, traduire les valeurs, et typer l'objet `Messages`
   (le compilateur signale toute clé oubliée) ;
2. l'ajouter à `CATALOGUES` et à `LANGUAGES` dans `index.tsx` ;
3. compléter `detectLanguage` si le code ISO doit être reconnu.

Le test `tests/unit/i18n.test.ts` vérifie que les catalogues ont exactement les
mêmes clés, qu'aucun message n'est vide et que les variables `{…}` sont
identiques d'une langue à l'autre.

---

## Thème clair et sombre

Trois choix, sur l'accueil comme en pleine partie : **Automatique**, **Clair**,
**Sombre**. « Automatique » suit le réglage du système et réagit en direct si
celui-ci change. Le choix est personnel — il vit dans le navigateur, pas sur le
serveur : deux joueurs d'une même partie peuvent jouer l'un en clair, l'autre en
sombre.

Le thème est posé sur `<html>` (`data-theme="light" | "dark"`) par un petit
script inline dans `client/index.html`, **avant le premier rendu** : un joueur en
mode sombre ne voit jamais d'éclair blanc au chargement. React reprend ensuite la
main (`client/src/lib/theme.ts`).

Côté style, tout passe par les jetons de `client/src/styles/tokens.css` : le
thème sombre ne fait que redéfinir des surfaces (`--c-paper`, `--c-cream`), de
l'encre (`--c-ink`), des traits (`--c-line`) et la base des ombres
(`--shadow-rgb`). **Les 5 couleurs de tuiles ne changent pas** — sans quoi la
fiche de déduction ne correspondrait plus au plateau ; un test le vérifie.

Les contrastes sont mesurés par les tests, dans les deux thèmes (`AA` exige
4,5:1 pour le texte courant) :

| | Clair | Sombre |
| --- | --- | --- |
| Texte sur panneau | 16,0:1 | 14,7:1 |
| Texte sur fond de page | 15,3:1 | 16,2:1 |
| Texte secondaire sur panneau | 8,2:1 | 7,9:1 |
| Accent violet sur panneau | 7,9:1 | 5,0:1 |

`color-scheme` et `theme-color` suivent aussi le thème : barres de défilement,
contrôles natifs et barre d'adresse mobile sont cohérents.

---

## Architecture

```
.
├── shared/              # Code métier partagé client <-> serveur (TypeScript pur)
│   └── src/
│       ├── data/tiles.ts        # SOURCE DE VÉRITÉ des 60 tuiles
│       ├── game/                # rng, deck, rules, engine, serialize
│       ├── protocol/events.ts   # contrat Socket.IO typé
│       ├── types/               # Tile, GameState, PublicGameState, ...
│       └── validation/          # nettoyage + validation des entrées
├── server/              # Serveur autoritaire
│   └── src/
│       ├── rooms/RoomManager.ts # rooms, joueurs, jetons, TTL
│       ├── socket/handlers.ts   # protocole, validation, diffusion
│       ├── security/            # rate limiting, jetons, codes
│       ├── createServer.ts      # fabrique (utilisée par les tests)
│       └── index.ts             # point d'entrée
├── client/              # Interface React + Vite
│   └── src/
│       ├── app/                 # App (aiguillage) + GameContext (socket/état)
│       ├── components/ui/       # Button, IconButton, Panel, Modal, Field
│       ├── components/game/     # Tile, TileBack, TileStack, Rack, Paravent...
│       ├── i18n/                # catalogues fr/es, contexte et détection
│       ├── features/deduction/  # DeductionSheet, DeductionCell, store local
│       ├── features/dialogs/    # Hint, Classify, Compare, Guess
│       ├── features/game/       # GameTable, ActionPanel, GameOverScreen
│       ├── features/room/       # Home, RoomLobby, HowToPlay, Onboarding
│       ├── hooks/, lib/         # toasts, media queries, socket, audio, storage
│       └── styles/              # design system (tokens, base, ui, game, fiche)
├── jouer.cmd            # Windows : lance la partie d'un double-clic
├── scripts/share.mjs    # partie à distance : tunnels, vérification, diagnostic
└── tests/
    ├── unit/            # données, moteur, secret, validation, multijoueur, fiche, roulette, thème, i18n
    └── e2e/             # Playwright : partie complète, tirage au sort, fiche, secret, responsive, thème, i18n
```

Le **code métier est entièrement séparé de l'interface** : `shared/src/game`
ne connaît ni React ni Socket.IO et se teste comme une bibliothèque pure.

---

## Règles implémentées

**Matériel.** 60 tuiles numérotées de 1 à 60. Le numéro détermine tout :

- **Couleur** — cycle de 5 : `1,6,11…` vert · `2,7,12…` rose · `3,8,13…` bleu ·
  `4,9,14…` rouge · `5,10,15…` orange.
- **Points** — motif des colonnes de la fiche, par paquets de 5 :
  `1-5 → 1 pt`, `6-10 → 2 pts`, `11-15 → 3 pts`, `16-20 → 1 pt`, … `56-60 → 3 pts`,
  soit `points = (⌊(n-1)/5⌋ mod 3) + 1`.

Cette correspondance vit à **un seul endroit** (`shared/src/data/tiles.ts`) : la
tuile posée sur la table et la case de la fiche lisent la même donnée, il est
donc impossible qu'elles divergent (vérifié par les tests pour les 60 numéros).

**Mise en place.** Mélange serveur, puis chaque joueur reçoit 5 tuiles secrètes —
une de chaque couleur — rangées par ordre croissant. Cinq tuiles publiques (une
par couleur) sont révélées au centre.

**Qui commence.** Le premier joueur est **tiré au sort** par le serveur (et non
l'hôte de la partie), à chaque partie comme à chaque revanche. Le tirage fixe
l'ordre des tours et il est annoncé aux deux joueurs par une **roulette** : la
roue tourne puis s'arrête sur le nom désigné. L'animation ne décide rien — elle
montre un résultat déjà calculé côté serveur, ce que les tests vérifient. Elle
se referme toute seule, un bouton permet de la passer, et un joueur qui se
reconnecte en cours de partie ne la revoit pas.

**Un tour = deux étapes obligatoires.**

1. **Révéler** : le joueur actif choisit une couleur ; le serveur tire au hasard
   une tuile encore disponible de cette couleur, qui devient publique.
2. **Demander un indice** sur **n'importe quelle** tuile publique. La tuile
   choisie **quitte alors le centre** : elle rejoint le support du demandeur et
   ne peut plus servir à un autre indice. Le centre revient donc à 5 tuiles
   disponibles à la fin de chaque tour.
   - **CLASSER** — l'adversaire range la tuile parmi les 5 tuiles secrètes du
     demandeur : 6 positions (avant la 1re, entre 1/2, 2/3, 3/4, 4/5, après la 5e).
     Plusieurs tuiles peuvent s'empiler dans la même encoche.
   - **COMPARER** — le demandeur désigne une de ses positions ; réponse **OUI**
     ou **NON** selon l'égalité du **nombre de points** (la couleur n'intervient
     jamais). La tuile comparée est posée devant le paravent, en face de la
     position visée : droite si OUI, **inclinée** si NON.

   Puis la main passe à l'adversaire.

**GOT FIVE!** Accessible à tout moment (son tour ou celui de l'adversaire),
**une seule fois par joueur** : 5 numéros croissants, une couleur chacun.
Exact → victoire immédiate et révélation des 10 tuiles. Faux → joueur éliminé ;
en version 2 joueurs, l'autre reste seul en lice, continue à jouer ses tours et
répond toujours aux indices. Si les deux échouent, la partie se termine sans
vainqueur.

*Adaptations au format 2 joueurs* : l'ordre du tour alterne simplement entre les
deux joueurs, en partant de celui qui a été tiré au sort ; un joueur éliminé ne
prend plus la main mais reste répondeur ; la partie s'arrête aussi si la réserve
se vide (cas théorique, 45 tours).

---

## Protection des informations secrètes

C'est la contrainte structurante du projet. Le `GameState` du serveur **ne
quitte jamais le serveur**. Chaque client reçoit exactement deux vues :

| Vue | Contenu | Fabriquée par |
| --- | --- | --- |
| `PublicGameState` | phase, joueurs (nom, couleurs du support, élimination), tuiles publiques, réserve par couleur, classements, comparaisons, tentatives, historique, tour | `toPublicGameState(state)` |
| `PrivatePlayerState` | **mes tuiles : couleur + position uniquement**, les 5 tuiles complètes de l'adversaire, ma demande en attente | `toPlayerPrivateState(state, playerId)` |

Points clés :

- Mes tuiles n'exposent **ni numéro ni points**. Les points sont volontairement
  omis : ils réduiraient le champ des possibles de 60 à 12 candidats.
- Les secrets ne sont révélés (`finalReveal`) qu'une fois `phase === 'GAME_OVER'`.
- L'historique public ne cite que des tuiles **publiques**, et ne transporte
  aucun texte : seulement un code et ses paramètres, rendus par chaque client.
- La réponse véritable d'un COMPARER n'est transmise qu'au **répondeur**, qui
  connaît de toute façon les vrais numéros du demandeur.
- Un **garde-fou** (`findSecretLeak`) inspecte chaque charge utile avant
  émission en développement et en test : si un numéro secret du destinataire
  apparaît quelque part (champ numérique, texte d'historique…), l'émission est
  bloquée et l'incident journalisé. Il ignore les faux positifs connus
  (positions 0–4, points 1–3, compteurs, identifiants opaques, pseudos
  contenant des chiffres) et reste actif dans toute la suite de tests.

Trois niveaux de tests verrouillent cette propriété : moteur (`secrecy.test.ts`),
réseau réel (`multiplayer.test.ts`) et navigateur (`e2e/secrecy.spec.ts`, qui
inspecte le DOM, `localStorage`, `sessionStorage` **et les trames WebSocket**).

---

## Rooms, sessions et reconnexion

- **Code de partie** : 5 caractères, alphabet sans ambiguïté (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`).
- **Identité** : à la création/connexion, le serveur renvoie `{ roomCode, playerId, token }`.
  Le jeton (32 octets aléatoires) est stocké côté client dans `localStorage` et
  sert uniquement à se reconnecter ; il ne contient aucune donnée de jeu.
- **Reconnexion** : au retour du socket, le client émet `player:reconnect` ; le
  serveur compare le jeton en temps constant, rattache le nouveau socket au
  joueur et renvoie l'état public + l'état privé autorisé. Un rechargement de
  page ne casse donc pas la partie (testé en E2E).
- **Déconnexion** : l'adversaire voit immédiatement une notification et un
  bandeau « X est déconnecté, la partie est conservée ». La room survit
  `ROOM_TTL_MS` (15 min par défaut) sans joueur connecté, puis est balayée par
  un nettoyage périodique.
- **Quitter volontairement** (`room:leave`) vaut abandon : la victoire est
  attribuée à l'adversaire.

---

## Protocole Socket.IO

Contrat typé dans `shared/src/protocol/events.ts` (`ClientToServerEvents`,
`ServerToClientEvents`). Chaque action cliente attend un accusé de réception
`{ ok: true, data } | { ok: false, error: { code, message } }`.

**Client → serveur**

| Événement | Charge utile |
| --- | --- |
| `room:create` | `{ name }` |
| `room:join` | `{ name, code }` |
| `player:reconnect` | `{ code, playerId, token }` |
| `room:leave` | `{}` |
| `game:start` | `{}` (hôte uniquement) |
| `game:reveal` | `{ color }` |
| `game:request-classify` | `{ tileNumber }` |
| `game:submit-classify` | `{ slot }` (0–5) |
| `game:request-compare` | `{ tileNumber, position }` (0–4) |
| `game:submit-compare` | `{ answer }` — **valeur ignorée**, le serveur recalcule |
| `game:guess` | `{ numbers: number[5] }` |
| `game:rematch` | `{}` (accord des deux joueurs requis) |

**Serveur → client**

| Événement | Contenu |
| --- | --- |
| `room:state` / `game:state` | `{ room, publicState, privateState }` — **individualisé par joueur** |
| `game:event` | `game-started`, `tile-revealed`, `hint-requested`, `classify-result`, `compare-result`, `turn-changed`, `guess-result`, `game-over` |
| `player:joined` / `player:left` / `player:reconnected` | `{ playerId, name }` |
| `server:error` | `{ code, message }` |

L'état complet est rediffusé après chaque mutation : les `game:event` servent
aux animations, aux sons et aux notifications, jamais de source de vérité.

---

## Machine à états

```
WAITING_FOR_PLAYER → LOBBY_READY → SETUP (tirage au sort du 1er joueur)
        ↓
   TURN_REVEAL ──(game:reveal)──▶ TURN_HINT
        ▲                            │
        │                 ┌──────────┴───────────┐
        │                 ▼                      ▼
        │        WAITING_FOR_CLASSIFY   WAITING_FOR_COMPARE
        │                 │                      │
        └───(fin de tour : la main passe à l'adversaire)───┘

  GOT FIVE! exact ─────────────────────────────▶ GAME_OVER
  Les deux joueurs éliminés / réserve vide ────▶ GAME_OVER
```

Chaque transition est explicite et validée côté serveur. Sont structurellement
impossibles : deux joueurs actifs, deux révélations ou deux indices dans un même
tour, une action hors tour ou hors phase, une action après `GAME_OVER`, une
seconde tentative GOT FIVE!, une réponse à un indice inexistant, une couleur
épuisée, une tuile non publique ou déjà utilisée.

---

## Fiche de déduction

Reproduction du principe de la fiche officielle, et vrai outil de jeu :

- **5 cases d'hypothèses** en haut, suivies de la flèche de l'ordre croissant ;
  chaque case se colore dès que le numéro saisi est valide.
- **Grille 1–60** : 5 lignes de couleur × 12 colonnes, chaque case affichant le
  numéro et ses **1, 2 ou 3 points** sous le numéro (même source de vérité que
  les tuiles).
- **Clic = barrer**, second clic = restaurer. La croix est dessinée en SVG,
  légèrement irrégulière (inclinaison et courbure dérivées du numéro), à l'encre
  translucide : le numéro et sa couleur restent lisibles.
- **Aucune automatisation** : une tuile révélée reçoit un simple repère doré
  (« déjà révélée »), jamais une croix — et elle le garde même après avoir servi
  à un indice, car l'information reste vraie. Le raisonnement appartient au joueur.
- **Persistance locale** par `(room, playerId)` : survit aux changements de tour,
  aux rerenders, à la fermeture du panneau, à un rechargement et à une
  reconnexion. Seuls les numéros barrés et les hypothèses sont stockés.
- **Effacer mes déductions** avec confirmation ; sans effet sur la partie.
- **Accessibilité** : chaque case est un bouton avec `aria-pressed` et un libellé
  du type « Numéro 37, rose, 2 points, éliminé ».
- **Mobile** : plein écran avec retour au jeu ; **desktop** : panneau latéral.

---

## Sécurité

- **Serveur autoritaire** : identité, room, phase, tour, permissions, paramètres
  et disponibilité sont revalidés à chaque action. Le résultat d'un CLASSER et
  la réponse d'un COMPARER sont **recalculés par le serveur** : un client
  modifié ne peut ni mentir ni changer le résultat.
- **Validation et nettoyage** de toutes les entrées (`shared/src/validation`) :
  pseudos (2–16 caractères, caractères de contrôle et `<>&"'\`` supprimés),
  codes de room, couleurs, numéros, index bornés.
- **Rate limiting** par socket (seau à jetons) : limite globale, plus des quotas
  spécifiques pour `room:create`, `room:join`, `player:reconnect` et les actions
  de jeu.
- **Jetons de session** : 32 octets aléatoires, comparés en temps constant.
- **Charges utiles bornées** (`maxHttpBufferSize` 16 Ko, `express.json` 16 Ko),
  historique de partie plafonné, nombre de rooms plafonné.
- **CORS** restreint à `CLIENT_URL` en production — et, avec `npm run share`,
  à la seule adresse du tunnel.
- **Aucune source map** publiée en production, aucun secret dans le stockage local.

---

## Tests

```bash
npm test          # 154 tests Vitest
npm run test:e2e  # 29 scénarios Playwright, joués sur desktop et mobile
```

**Unitaires et intégration** (`tests/unit`)

| Fichier | Couverture |
| --- | --- |
| `tiles.test.ts` | 60 tuiles, unicité, couleurs et points des 60 numéros, grille de la fiche |
| `engine.test.ts` | paquet, mise en place, **tirage du premier joueur** (équilibre sur 400 parties, reproductibilité à graine fixée), révélation, CLASSER (6 positions), COMPARER, tuiles consommées, tours, GOT FIVE!, états impossibles |
| `secrecy.test.ts` | vues publique/privée, absence de fuite sur des dizaines de parties, garde-fou |
| `validation.test.ts` | pseudos, codes, couleurs, index, listes de numéros |
| `multiplayer.test.ts` | vrai serveur Socket.IO : room, join, start, synchronisation, mensonge impossible, tuile consommée, reconnexion, jeton invalide, élimination, revanche, rate limiting, abandon |
| `deduction.dom.test.tsx` | fiche rendue (jsdom) : 60 cases, couleurs, points, toggle, persistance, reset, confidentialité, rendu espagnol |
| `roulette.test.ts` | géométrie de la roue : secteurs égaux, rotation qui amène toujours le joueur tiré sous l'aiguille, bornes |
| `roulette.dom.test.tsx` | annonce rendue (jsdom) : question puis résultat, point de vue de chaque joueur, arrêt sur le bon secteur, fermeture automatique, bouton « passer » |
| `i18n.test.ts` | parité des catalogues, variables identiques, détection de langue, interpolation |
| `theme.test.ts` | résolution du thème, cycle des choix, **contrastes WCAG mesurés dans les deux thèmes**, couleurs de tuiles inchangées |
| `theme.dom.test.tsx` | sélecteur rendu (jsdom) : trois choix, bouton cyclique du bandeau, libellés annoncés, application au document |

**Bout en bout** (`tests/e2e`, deux navigateurs réels)

| Fichier | Couverture |
| --- | --- |
| `game-flow.spec.ts` | partie complète, CLASSER, COMPARER, tuile qui quitte le centre, tour, erreurs de salon, victoire, élimination, revanche, reconnexion, déconnexion |
| `theme.spec.ts` | suit le système, le choix du joueur prime et survit au rechargement, `theme-color`, changement en pleine partie (sans affecter l'adversaire), fiche lisible en sombre |
| `start-draw.spec.ts` | tirage au sort : même joueur annoncé aux deux clients, c'est bien lui qui a la main, fermeture automatique, animation passable |
| `deduction-sheet.spec.ts` | scénario complet de la fiche (barrer, restaurer, hypothèses, persistance, reset), accessibilité clavier |
| `secrecy.spec.ts` | anti-triche dans le navigateur : DOM, stockage, **trames WebSocket** |
| `responsive.spec.ts` | 1440×900, 1280×800, 1024×768, 768×1024, 390×844, 375×812 : aucun débordement horizontal, fiche utilisable au doigt |
| `i18n.spec.ts` | détection selon le navigateur, changement de langue persistant, **partie bilingue** (un joueur en français, l'autre en espagnol), dialogues, fiche, fin de partie et erreurs traduits |

Si l'environnement fournit déjà un Chromium, renseigne `PW_CHROMIUM_PATH`
(par défaut `/opt/pw-browsers/chromium` est utilisé s'il existe).

---

## Build et déploiement

```bash
npm run build     # shared (tsc) + server (esbuild, bundle) + client (Vite)
npm start         # node server/dist/index.js
```

Variables d'environnement (`.env.example`) : `PORT`, `NODE_ENV`, `CLIENT_URL`,
`ROOM_TTL_MS`, `VITE_SERVER_URL`.

**Option 1 — un seul service** (Render, Railway, Fly.io, VPS, conteneur)

Le serveur sert `client/dist` s'il existe : `npm ci && npm run build`, puis
`npm start`. Une seule origine, aucun CORS à configurer.

**Option 2 — front statique + backend séparé** (Vercel/Netlify + Render/Railway/Fly.io)

1. Backend : commande de build `npm ci && npm run build -w shared && npm run build -w server`,
   démarrage `node server/dist/index.js`, variables `PORT`, `NODE_ENV=production`,
   `CLIENT_URL=https://mon-front.exemple` (plusieurs origines séparées par des virgules).
2. Frontend : build `npm ci && npm run build -w client`, dossier publié `client/dist`,
   variable `VITE_SERVER_URL=https://mon-backend.exemple` (lue au build).

Le WebSocket doit rester autorisé de bout en bout (c'est le cas par défaut chez
les hébergeurs cités) ; à défaut, Socket.IO bascule automatiquement en polling.
`GET /health` fournit une sonde de disponibilité.

---

## Accessibilité et responsive

- Navigation clavier complète, focus visible, focus piégé dans les modales,
  restitution du focus à la fermeture.
- Libellés `aria` sur chaque tuile, chaque case de la fiche, chaque bouton
  icône ; l'état n'est jamais porté par la seule couleur (croix, badges, textes).
- Annonces `aria-live` pour le tour en cours et les notifications.
- `prefers-reduced-motion` respecté (toutes les animations sont neutralisées).
- `prefers-color-scheme` respecté : thème sombre automatique, avec contrastes
  mesurés par les tests dans les deux thèmes.
- Cibles tactiles ≥ 38 px, grille de la fiche manipulable au doigt.
- Zones d'attente toujours explicites (« Marie doit classer la tuile… »).
- Audio entièrement synthétisé (Web Audio), désactivable, jamais indispensable.
