#!/usr/bin/env node
/**
 * Verificateur de contrat.
 *
 * `docs/PROJECT_CONTRACT.md` fige les noms et les signatures du projet. Ce
 * script verifie que le code les expose reellement : il echoue si un export
 * attendu disparait, si un evenement Socket.IO est renomme, ou si l'ancienne
 * identite reapparait quelque part.
 *
 * Il ne remplace pas TypeScript : il attrape ce que le typage ne voit pas,
 * c'est-a-dire les renommages silencieux et les divergences entre le contrat
 * et le code.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const problems = [];
const fail = (message) => problems.push(message);

// --- 1. Exports attendus du paquet partage --------------------------------

const SHARED_EXPORTS = [
  // donnees
  'TILE_COUNT', 'COLOR_ORDER', 'SECRET_TILE_COUNT', 'CLASSIFY_SLOT_COUNT',
  'SHEET_COLUMNS', 'TILES', 'SHEET_GRID', 'COLOR_LABELS',
  'ROOM_CODE_LENGTH', 'ROOM_CODE_ALPHABET', 'NAME_MIN_LENGTH', 'NAME_MAX_LENGTH',
  'colorForNumber', 'pointsForNumber', 'getTileByNumber', 'tilesOfColor',
  'columnForNumber', 'isValidTileNumber',
  // moteur
  'createGame', 'revealTile', 'requestClassify', 'submitClassify',
  'requestCompare', 'submitCompare', 'submitGuess', 'forfeit',
  'getPlayer', 'getOpponent', 'getWinner', 'isPublicTile',
  'availablePublicTiles', 'getCompareTruth', 'setPlayerConnected',
  // paquet et regles
  'createDeck', 'shuffleDeck', 'drawTileByColor', 'reserveOfColor',
  'countReserveByColor', 'comparePoints', 'comparePointsByNumber',
  'getClassifyPosition', 'validateClassify', 'validateGuess', 'validateGuessShape',
  // hasard
  'defaultRng', 'createSeededRng', 'randomInt', 'pickRandom',
  // serialisation : la frontiere de securite
  'toPublicGameState', 'toPlayerPrivateState', 'findSecretLeak',
  // validation des entrees
  'validateName', 'validateRoomCode', 'validateColor', 'validateTileNumber',
  'validateIndex', 'validateNumberList', 'sanitizeName',
];

const sharedSources = collect(path.join(ROOT, 'shared/src'), '.ts')
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

for (const name of SHARED_EXPORTS) {
  const declared = new RegExp(
    `export (?:function|const|class) ${name}\\b|export \\{[^}]*\\b${name}\\b`,
  ).test(sharedSources);
  if (!declared) {
    fail(`export manquant dans @noctalis/shared : ${name}`);
  }
}

// --- 2. Types attendus ------------------------------------------------------

const SHARED_TYPES = [
  'Tile', 'TileColor', 'TilePoints', 'SecretTileView', 'RevealedTile',
  'PlayerState', 'PublicPlayer', 'GameState', 'PublicGameState',
  'PrivatePlayerState', 'RoomState', 'PlayerCredentials', 'GamePhase',
  'GameOverReason', 'HintType', 'PendingHint', 'GameAction', 'GameEvent',
  'GameError', 'GameErrorCode', 'EngineResult', 'Rng',
];

for (const name of SHARED_TYPES) {
  if (!new RegExp(`export (?:type|interface) ${name}\\b`).test(sharedSources)) {
    fail(`type manquant dans @noctalis/shared : ${name}`);
  }
}

// --- 3. Evenements Socket.IO ------------------------------------------------

const PROTOCOL = read('shared/src/protocol/events.ts');
const CLIENT_EVENTS = [
  'room:create', 'room:join', 'player:reconnect', 'room:leave', 'game:start',
  'game:reveal', 'game:request-classify', 'game:submit-classify',
  'game:request-compare', 'game:submit-compare', 'game:guess', 'game:rematch',
];
const SERVER_EVENTS = [
  'room:state', 'game:state', 'game:event',
  'player:joined', 'player:left', 'player:reconnected', 'server:error',
];

for (const event of [...CLIENT_EVENTS, ...SERVER_EVENTS]) {
  if (!PROTOCOL.includes(`'${event}'`)) {
    fail(`evenement absent du protocole : ${event}`);
  }
}

// --- 4. Etats de la machine -------------------------------------------------

const PHASES = [
  'WAITING_FOR_PLAYER', 'LOBBY_READY', 'SETUP', 'TURN_REVEAL', 'TURN_HINT',
  'WAITING_FOR_CLASSIFY', 'WAITING_FOR_COMPARE', 'GAME_OVER',
];
const GAME_TYPES = read('shared/src/types/game.ts');
for (const phase of PHASES) {
  if (!GAME_TYPES.includes(`'${phase}'`)) {
    fail(`etat absent de GamePhase : ${phase}`);
  }
}

// --- 5. Frontiere de securite -----------------------------------------------

const HANDLERS = read('server/src/socket/handlers.ts');
if (!HANDLERS.includes('buildStatePayload') || !HANDLERS.includes('findSecretLeak')) {
  fail('les handlers doivent passer par buildStatePayload et findSecretLeak');
}
const SERIALIZE = read('shared/src/game/serialize.ts');
for (const fn of ['toPublicGameState', 'toPlayerPrivateState']) {
  if (!SERIALIZE.includes(`export function ${fn}`)) {
    fail(`projection manquante : ${fn}`);
  }
}

// --- 6. Le serveur doit rester joignable par un hebergeur -------------------

const SERVER_ENTRY = read('server/src/index.ts');
if (!SERVER_ENTRY.includes("process.env['PORT']")) {
  fail("le serveur doit lire process.env.PORT");
}
if (!SERVER_ENTRY.includes("'0.0.0.0'")) {
  fail("le serveur doit ecouter sur 0.0.0.0");
}
if (!read('server/src/createServer.ts').includes("'/health'")) {
  fail('la route /health est absente');
}

// --- 7. Le soutien passe par GitHub Sponsors, et rien d'autre ---------------

const PROJECT = read('client/src/lib/project.ts');
if (!PROJECT.includes('https://github.com/sponsors/')) {
  fail('SPONSORS_URL doit pointer vers github.com/sponsors/<compte>');
}
const FORBIDDEN_FUNDING = ['patreon', 'ko-fi', 'kofi', 'paypal', 'stripe', 'buymeacoffee', 'tipeee'];
const clientSources = collect(path.join(ROOT, 'client/src'), '.ts', '.tsx')
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
  .toLowerCase();
for (const name of FORBIDDEN_FUNDING) {
  if (clientSources.includes(name)) {
    fail(`moyen de paiement interdit reference dans le client : ${name}`);
  }
}

// --- 8. Aucune trace de l'identite anterieure -------------------------------

const OLD_IDENTITY = /got[\s._-]?five|gotfive/i;
for (const dir of ['shared/src', 'server/src', 'client/src', 'tests', 'scripts']) {
  for (const file of collect(path.join(ROOT, dir), '.ts', '.tsx', '.css', '.mjs', '.html')) {
    // Ce fichier porte le motif recherche : il ne s'inspecte pas lui-meme.
    if (file === fileURLToPath(import.meta.url)) {
      continue;
    }
    if (OLD_IDENTITY.test(readFileSync(file, 'utf8'))) {
      fail(`identite anterieure trouvee dans ${path.relative(ROOT, file)}`);
    }
  }
}

// --- 9. Parite des catalogues de traduction ---------------------------------

const keysOf = (file) =>
  [...read(file).matchAll(/^ {2}'([^']+)':/gm)].map((m) => m[1]);
const frKeys = keysOf('client/src/i18n/fr.ts');
const esKeys = keysOf('client/src/i18n/es.ts');
const missing = frKeys.filter((k) => !esKeys.includes(k));
const extra = esKeys.filter((k) => !frKeys.includes(k));
if (missing.length) fail(`cles absentes de es.ts : ${missing.join(', ')}`);
if (extra.length) fail(`cles en trop dans es.ts : ${extra.join(', ')}`);

// --- Rapport ----------------------------------------------------------------

function collect(dir, ...extensions) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

if (problems.length > 0) {
  console.error(`\n✗ Contrat non respecte — ${String(problems.length)} probleme(s) :\n`);
  for (const problem of problems) {
    console.error(`  · ${problem}`);
  }
  console.error('\nVoir docs/PROJECT_CONTRACT.md.\n');
  process.exit(1);
}

console.log(
  `✓ Contrat respecte : ${String(SHARED_EXPORTS.length)} exports, ` +
    `${String(SHARED_TYPES.length)} types, ` +
    `${String(CLIENT_EVENTS.length + SERVER_EVENTS.length)} evenements, ` +
    `${String(frKeys.length)} cles de traduction.`,
);
