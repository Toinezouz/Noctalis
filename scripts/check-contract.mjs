#!/usr/bin/env node
/**
 * Contract checker.
 *
 * `docs/PROJECT_CONTRACT.md` freezes the project's names and signatures.
 * This script checks that the code really exposes them: it fails when an
 * expected export disappears, when a Socket.IO event is renamed, or when the
 * former identity shows up again somewhere.
 *
 * It does not replace TypeScript: it catches what typing cannot see, namely
 * silent renames and drift between the contract and the code.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const problems = [];
const fail = (message) => problems.push(message);

// --- 1. Exports expected from the shared package ----------------------------

const SHARED_EXPORTS = [
  // data
  'TILE_COUNT', 'COLOR_ORDER', 'SECRET_TILE_COUNT', 'CLASSIFY_SLOT_COUNT',
  'SHEET_COLUMNS', 'TILES', 'SHEET_GRID', 'COLOR_LABELS',
  'ROOM_CODE_LENGTH', 'ROOM_CODE_ALPHABET', 'NAME_MIN_LENGTH', 'NAME_MAX_LENGTH',
  'MIN_PLAYERS', 'MAX_PLAYERS',
  'colorForNumber', 'pointsForNumber', 'getTileByNumber', 'tilesOfColor',
  'columnForNumber', 'isValidTileNumber',
  // engine
  'createGame', 'revealTile', 'requestClassify', 'submitClassify',
  'requestCompare', 'submitCompare', 'submitGuess', 'forfeit',
  'getPlayer', 'getRivals', 'seatsAfter', 'pickResponder', 'reassignResponder',
  'getWinner', 'isPublicTile',
  'availablePublicTiles', 'getCompareTruth', 'setPlayerConnected',
  // deck and rules
  'createDeck', 'shuffleDeck', 'drawTileByColor', 'reserveOfColor',
  'countReserveByColor', 'comparePoints', 'comparePointsByNumber',
  'getClassifyPosition', 'validateClassify', 'validateGuess', 'validateGuessShape',
  // randomness
  'defaultRng', 'createSeededRng', 'randomInt', 'pickRandom',
  // serialisation: the security boundary
  'toPublicGameState', 'toPlayerPrivateState', 'findSecretLeak',
  // input validation
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
    fail(`missing export in @noctalis/shared: ${name}`);
  }
}

// --- 2. Expected types -------------------------------------------------------

const SHARED_TYPES = [
  'Tile', 'TileColor', 'TilePoints', 'SecretTileView', 'RevealedTile',
  'PlayerState', 'PublicPlayer', 'GameState', 'PublicGameState',
  'PrivatePlayerState', 'RivalView', 'RoomState', 'PlayerCredentials', 'GamePhase',
  'GameOverReason', 'HintType', 'PendingHint', 'GameAction', 'GameEvent',
  'GameError', 'GameErrorCode', 'EngineResult', 'Rng',
];

for (const name of SHARED_TYPES) {
  if (!new RegExp(`export (?:type|interface) ${name}\\b`).test(sharedSources)) {
    fail(`missing type in @noctalis/shared: ${name}`);
  }
}

// --- 3. Socket.IO events -----------------------------------------------------

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
    fail(`event missing from the protocol: ${event}`);
  }
}

// --- 4. States of the machine -------------------------------------------------

const PHASES = [
  'WAITING_FOR_PLAYER', 'LOBBY_READY', 'SETUP', 'TURN_REVEAL', 'TURN_HINT',
  'WAITING_FOR_CLASSIFY', 'WAITING_FOR_COMPARE', 'GAME_OVER',
];
const GAME_TYPES = read('shared/src/types/game.ts');
for (const phase of PHASES) {
  if (!GAME_TYPES.includes(`'${phase}'`)) {
    fail(`state missing from GamePhase: ${phase}`);
  }
}

// --- 5. Security boundary -----------------------------------------------------

const HANDLERS = read('server/src/socket/handlers.ts');
if (!HANDLERS.includes('buildStatePayload') || !HANDLERS.includes('findSecretLeak')) {
  fail('handlers must go through buildStatePayload and findSecretLeak');
}
const SERIALIZE = read('shared/src/game/serialize.ts');
// A player's private view lists every other player: never a single opponent.
if (!SERIALIZE.includes('getRivals(state, playerId)')) {
  fail('toPlayerPrivateState must show every other player (getRivals)');
}
for (const fn of ['toPublicGameState', 'toPlayerPrivateState']) {
  if (!SERIALIZE.includes(`export function ${fn}`)) {
    fail(`missing projection: ${fn}`);
  }
}

// --- 6. The server must stay reachable behind a host -------------------------

const SERVER_ENTRY = read('server/src/index.ts');
if (!SERVER_ENTRY.includes("process.env['PORT']")) {
  fail('the server must read process.env.PORT');
}
if (!SERVER_ENTRY.includes("'0.0.0.0'")) {
  fail('the server must listen on 0.0.0.0');
}
if (!read('server/src/createServer.ts').includes("'/health'")) {
  fail('the /health route is missing');
}

// --- 7. Support goes through GitHub Sponsors, and nothing else -----------------

const PROJECT = read('client/src/lib/project.ts');
if (!PROJECT.includes('https://github.com/sponsors/')) {
  fail('SPONSORS_URL must point to github.com/sponsors/<account>');
}
const FORBIDDEN_FUNDING = ['patreon', 'ko-fi', 'kofi', 'paypal', 'stripe', 'buymeacoffee', 'tipeee'];
const clientSources = collect(path.join(ROOT, 'client/src'), '.ts', '.tsx')
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
  .toLowerCase();
for (const name of FORBIDDEN_FUNDING) {
  if (clientSources.includes(name)) {
    fail(`forbidden payment platform referenced in the client: ${name}`);
  }
}

// --- 8. No trace of the former identity ----------------------------------------

const OLD_IDENTITY = /got[\s._-]?five|gotfive/i;
for (const dir of ['shared/src', 'server/src', 'client/src', 'tests', 'scripts']) {
  for (const file of collect(path.join(ROOT, dir), '.ts', '.tsx', '.css', '.mjs', '.html')) {
    // This file carries the pattern it looks for: it does not inspect itself.
    if (file === fileURLToPath(import.meta.url)) {
      continue;
    }
    if (OLD_IDENTITY.test(readFileSync(file, 'utf8'))) {
      fail(`former identity found in ${path.relative(ROOT, file)}`);
    }
  }
}

// --- 9. Translation catalogues match the English reference -------------------

const keysOf = (file) =>
  [...read(file).matchAll(/^ {2}'([^']+)':/gm)].map((m) => m[1]);
const enKeys = keysOf('client/src/i18n/en.ts');
for (const lang of ['fr', 'es']) {
  const keys = keysOf(`client/src/i18n/${lang}.ts`);
  const missing = enKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !enKeys.includes(k));
  if (missing.length) fail(`keys missing from ${lang}.ts: ${missing.join(', ')}`);
  if (extra.length) fail(`extra keys in ${lang}.ts: ${extra.join(', ')}`);
}

// --- 10. Tables of 2 to 4 -------------------------------------------------------

if (!/MIN_PLAYERS = 2;/.test(PROTOCOL) || !/MAX_PLAYERS = 4;/.test(PROTOCOL)) {
  fail('the protocol must seat 2 to 4 players (MIN_PLAYERS / MAX_PLAYERS)');
}

// --- Report -------------------------------------------------------------------

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
  console.error(`\n✗ Contract broken — ${String(problems.length)} problem(s):\n`);
  for (const problem of problems) {
    console.error(`  · ${problem}`);
  }
  console.error('\nSee docs/PROJECT_CONTRACT.md.\n');
  process.exit(1);
}

console.log(
  `✓ Contract kept: ${String(SHARED_EXPORTS.length)} exports, ` +
    `${String(SHARED_TYPES.length)} types, ` +
    `${String(CLIENT_EVENTS.length + SERVER_EVENTS.length)} events, ` +
    `${String(enKeys.length)} translation keys in 3 languages.`,
);
