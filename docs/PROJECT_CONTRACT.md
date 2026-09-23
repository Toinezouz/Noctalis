# NOCTALIS technical contract

> **Source of truth for signatures.** Every name, signature and event listed
> here is fixed. A file that departs from it is at fault, not the contract.
>
> To change a signature: update this document, update **every** consumer,
> run `npm run typecheck` and `npm test`, then `npm run check:contract`,
> which checks that the code really exposes this contract.

## 0. Change log

### 1.0 — renames made during the migration

| Before | After | Why |
| --- | --- | --- |
| `@gotfive/shared` · `@gotfive/server` · `@gotfive/client` | `@noctalis/shared` · `@noctalis/server` · `@noctalis/client` | identity |
| `GameOverReason = 'got-five'` | `GameOverReason = 'constellation'` | identity, value sent over the network |
| `gotfive:*` storage keys | `noctalis:*` | identity |
| `data-testid="got-five-button"` | `data-testid="announce-button"` | identity |
| `data-testid="got-five-input-N"` | `data-testid="announce-input-N"` | identity |
| prop `gotFiveDisabled` | `announceDisabled` | identity |

### 1.1 — tables of 2 to 4 players

| Before | After | Why |
| --- | --- | --- |
| `createGame` accepts exactly 2 seeds | accepts `MIN_PLAYERS` (2) to `MAX_PLAYERS` (4) | bigger tables |
| `getOpponent(state, id)` | `getRivals(state, id)` — everybody else, in seating order | several opponents |
| `PrivatePlayerState.opponentTiles` / `opponentId` | `PrivatePlayerState.rivals: RivalView[]` | several opponents |
| — | `PublicGameState.order` | who answers is public |
| — | `PlayerState.left`, `PublicPlayer.left` | leaving no longer ends a game of 3 or 4 |
| — | `seatsAfter`, `pickResponder`, `reassignResponder` | who answers a question |
| — | `LogCode 'responder-changed'`, `GameErrorCode 'ROOM_STARTED'` | new situations |
| log params `{ opponent }` | `{ responder }` (hint requests), `{ remaining }` (out of the race) | several opponents |
| `COLOR_LABELS`, `CLASSIFY_SLOT_LABELS` in French | in English | server messages are for developers |

The rest of the engine keeps its names: they describe mechanisms, not a brand.

### 1.2 — invite links and link previews

Additions only; no signature of `@noctalis/shared` changes.

| Before | After | Why |
| --- | --- | --- |
| — | URL parameters `?join=CODE` and `&lang=en\|fr\|es` | invite links |
| — | `CreateServerOptions.clientDist`, `CreateServerOptions.publicUrl` | tests, absolute preview URLs |
| — | environment variable `PUBLIC_URL` (optional; `RENDER_EXTERNAL_URL` otherwise) | absolute preview URLs |
| — | markers `<!-- preview:start -->` / `<!-- preview:end -->` in `client/index.html` | the server fills in the preview there |
| — | `data-testid` `invite-link`, `copy-link`, `copy-feedback`, `home-invited` | tests |

## 1. Data types (`@noctalis/shared`)

```ts
type TileColor = 'green' | 'pink' | 'blue' | 'red' | 'orange';
type TilePoints = 1 | 2 | 3;

interface Tile { id: string; number: number; color: TileColor; points: TilePoints }
interface SecretTileView { color: TileColor; position: number }
interface RevealedTile { tile: Tile; order: number; revealedBy: string | null; used: boolean }
interface RivalView { playerId: string; tiles: Tile[] }
```

`TileColor` identifiers are technical names and are never shown. Players see
Lyra, Aurora, Cygnus, Ember and Phoenix (Lyre, Aurore, Cygne, Braise, Phénix;
Lira, Aurora, Cisne, Brasa, Fénix) from the client's translation catalogues.
`points` is called *sparks* in the interface.

## 2. Constants

```ts
const TILE_COUNT = 60;
const COLOR_ORDER: readonly TileColor[];
const SECRET_TILE_COUNT = 5;
const CLASSIFY_SLOT_COUNT = 6;
const SHEET_COLUMNS = 12;
const TILES: readonly Tile[];
const SHEET_GRID: readonly (readonly Tile[])[];
const COLOR_LABELS: Readonly<Record<TileColor, string>>; // English, server messages
const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 16;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
```

## 3. State machine

```ts
type GamePhase =
  | 'WAITING_FOR_PLAYER'
  | 'LOBBY_READY'
  | 'SETUP'
  | 'TURN_REVEAL'
  | 'TURN_HINT'
  | 'WAITING_FOR_CLASSIFY'
  | 'WAITING_FOR_COMPARE'
  | 'GAME_OVER';

type GameOverReason = 'constellation' | 'all-eliminated' | 'reserve-empty' | 'forfeit';
type HintType = 'classify' | 'compare';
type RoomStatus = 'waiting' | 'playing' | 'finished';
```

One name per state. No synonym is tolerated. In the interface, `classify` is
called **PLACE** (SITUER, SITUAR) and `compare` **GAUGE** (JAUGER, MEDIR).

## 4. States and projections

```ts
interface GameState          // server only, never leaves it
interface PublicGameState    // visible to everybody at the table
interface PrivatePlayerState // visible to one player only
interface PublicPlayer
interface PlayerState        // server only (holds `secret`)

function toPublicGameState(state: GameState): PublicGameState;
function toPlayerPrivateState(state: GameState, playerId: string): PrivatePlayerState | null;
function findSecretLeak(state: GameState, playerId: string, payload: unknown): SecretLeak | null;
```

**Non-negotiable rule**: no code path serialises `GameState`. A client only
ever receives the two projections combined, and its private view never holds
its own numbers. `PrivatePlayerState.rivals` lists everybody else's stars, in
seating order (the player right after me comes first).

## 5. Engine

```ts
function createGame(seeds: readonly PlayerSeed[], rng: Rng): GameState; // 2 to 4 seeds
function revealTile(state: GameState, playerId: string, color: TileColor, rng: Rng): EngineResult;
function requestClassify(state: GameState, playerId: string, tileNumber: number): EngineResult;
function submitClassify(state: GameState, playerId: string, slot: number): EngineResult;
function requestCompare(state: GameState, playerId: string, tileNumber: number, position: number): EngineResult;
function submitCompare(state: GameState, playerId: string): EngineResult;
function submitGuess(state: GameState, playerId: string, numbers: readonly number[]): EngineResult;
function forfeit(state: GameState, playerId: string): EngineResult;
function reassignResponder(state: GameState): GameEvent[];

function getPlayer(state: GameState, playerId: string): PlayerState | undefined;
function getRivals(state: GameState, playerId: string): PlayerState[];
function seatsAfter(order: readonly string[], playerId: string): string[];
function pickResponder<T extends ResponderCandidate>(order: readonly string[], players: readonly T[], askerId: string): T | null;
function getWinner(state: GameState): PlayerState | null;
function isPublicTile(state: GameState, tileNumber: number): boolean;
function availablePublicTiles(state: GameState): RevealedTile[];
function getCompareTruth(state: GameState): boolean | null;
function setPlayerConnected(state: GameState, playerId: string, connected: boolean): void;

type EngineResult = { ok: true; events: GameEvent[] } | { ok: false; error: GameError };
```

- `submitCompare` does **not** take the client's answer: the server works it
  out. That is a security property, not a detail of the signature.
- **Who answers**: the next person in the turn order who is still at the
  table, preferably someone online (`pickResponder`). The client uses the same
  pure function to say who will answer before the question is asked.
- **Going offline**: `reassignResponder` hands a pending question to someone
  online; with nobody better available, the game waits, as it always did.
- **Wrong call**: the player is out of the race, skipped in the turn order,
  but still answers questions. When nobody can win any more, the game ends
  without a winner.
- **Leaving** (`forfeit`): the player leaves the rotation. When a single
  person remains at the table, they win.

## 6. Data and rules

```ts
function colorForNumber(n: number): TileColor;
function pointsForNumber(n: number): TilePoints;
function getTileByNumber(n: number): Tile;
function tilesOfColor(color: TileColor): readonly Tile[];
function columnForNumber(n: number): number;
function isValidTileNumber(n: unknown): n is number;

function createDeck(): Tile[];
function shuffleDeck<T>(deck: readonly T[], rng: Rng): T[];
function drawTileByColor(state: GameState, color: TileColor, rng: Rng): number | null;
function reserveOfColor(reserve: readonly number[], color: TileColor): number[];
function countReserveByColor(reserve: readonly number[]): Record<TileColor, number>;

function comparePoints(a: Tile, b: Tile): boolean;
function comparePointsByNumber(aNumber: number, bNumber: number): boolean;
function getClassifyPosition(secret: readonly number[], tileNumber: number): number;
function validateClassify(secret: readonly number[], tileNumber: number, slot: number): { correctSlot: number; wasCorrect: boolean };
function validateGuess(secret: readonly number[], numbers: readonly number[]): boolean;
function validateGuessShape(numbers: readonly unknown[]): GuessValidation;
```

## 7. Randomness

```ts
type Rng = () => number;
const defaultRng: Rng;
function createSeededRng(seed: number): Rng;
function randomInt(rng: Rng, max: number): number;
function pickRandom<T>(rng: Rng, items: readonly T[]): T;
```

## 8. Input validation

```ts
type Validated<T> = { ok: true; value: T } | { ok: false; reason: string };

function validateName(raw: unknown): Validated<string>;
function validateRoomCode(raw: unknown): Validated<string>;
function validateColor(raw: unknown): Validated<TileColor>;
function validateTileNumber(raw: unknown): Validated<number>;
function validateIndex(raw: unknown, max: number): Validated<number>;
function validateNumberList(raw: unknown, length: number): Validated<number[]>;
function sanitizeName(raw: unknown): string;
```

`reason` and `GameError.message` are English, for developers. Players only
ever see a translation of the error **code**.

## 9. Socket.IO protocol

Event names are **fixed**. Every client action is acknowledged with
`Ack<T> = { ok: true; data: T } | { ok: false; error: GameError }`.

### Client → server

| Event | Payload | Acknowledgement |
| --- | --- | --- |
| `room:create` | `{ name: string }` | `Ack<PlayerCredentials>` |
| `room:join` | `{ name: string; code: string }` | `Ack<PlayerCredentials>` |
| `player:reconnect` | `{ code: string; playerId: string; token: string }` | `Ack<PlayerCredentials>` |
| `room:leave` | `{}` | `Ack<null>` |
| `game:start` | `{}` — host only, 2 to 4 people seated | `Ack<null>` |
| `game:reveal` | `{ color: TileColor }` | `Ack<null>` |
| `game:request-classify` | `{ tileNumber: number }` | `Ack<null>` |
| `game:submit-classify` | `{ slot: number }` | `Ack<null>` |
| `game:request-compare` | `{ tileNumber: number; position: number }` | `Ack<null>` |
| `game:submit-compare` | `{ answer: boolean }` — **value ignored** | `Ack<null>` |
| `game:guess` | `{ numbers: number[] }` | `Ack<null>` |
| `game:rematch` | `{}` — starts once everybody seated asked | `Ack<null>` |

Joining is only possible in the lobby: a room refuses newcomers once its game
has started (`ROOM_STARTED`), and beyond four people (`ROOM_FULL`). When the
host leaves the lobby, the longest-seated person becomes host.

### Server → client

| Event | Content |
| --- | --- |
| `room:state` / `game:state` | `StatePayload` — built separately for each player |
| `game:event` | `GameEvent` |
| `player:joined` / `player:left` / `player:reconnected` | `{ playerId: string; name: string }` |
| `server:error` | `GameError` |

```ts
type GameEvent =
  | { type: 'game-started'; startingPlayerId: string }
  | { type: 'tile-revealed'; tile: Tile; byPlayerId: string }
  | { type: 'hint-requested'; hint: PendingHint } // also sent when the responder changes
  | { type: 'classify-result'; result: ClassifyResult; wasCorrect: boolean }
  | { type: 'compare-result'; result: CompareResult }
  | { type: 'turn-changed'; activePlayerId: string | null; turn: number }
  | { type: 'guess-result'; playerId: string; numbers: number[]; correct: boolean }
  | { type: 'game-over'; winnerId: string | null; reason: GameOverReason };

interface StatePayload { room: RoomState; publicState: PublicGameState | null; privateState: PrivatePlayerState | null }
```

## 10. HTTP routes

| Method | Path | Answer |
| --- | --- | --- |
| `GET` | `/health` | `{ status: 'ok', rooms: number, uptime: number, env: string }` |
| `GET` | `/*` | `client/dist/index.html` (SPA fallback) |

`status` is always the string `"ok"` when the service answers: it is the probe
Render uses.

## 11. Server

```ts
function createNoctalisServer(options: ServerOptions): NoctalisServer;

interface ServerOptions {
  env?: string;
  origins?: string[] | boolean;
  roomTtlMs?: number;
  serveClient?: boolean;
  strictLeakCheck?: boolean;
  logRefusals?: boolean;
}
interface NoctalisServer { app; httpServer; io; rooms: RoomManager; close(): Promise<void> }

class Room {
  readonly code: string;
  startGame(): GameEvent[];
  toRoomState(): RoomState;
  credentialsFor(player: RoomPlayer): PlayerCredentials;
}
class RoomManager {
  get size(): number;
  get(code: string): Room | undefined;
  create(name: string, socketId: string): RoomResult<{ room: Room; player: RoomPlayer }>;
}
```

`RoomManager` is an in-memory store: **games in progress are lost if the
service restarts.** That is documented, deliberate, and enough for games
played in one sitting. No database is added until a real need calls for it.

## 12. Client — components and props

```tsx
function App(): JSX.Element;
function GameProvider({ children }: { children: ReactNode }): JSX.Element;
function useGame(): GameContextValue; // exposes `me` and `rivals` (seating order)

function GameTable(props: GameTableProps): JSX.Element | null;
function GameHeader(props: GameHeaderProps): JSX.Element;
function DeductionSheet(props: DeductionSheetProps): JSX.Element;
function StartRoulette(props: StartRouletteProps): JSX.Element | null;
function ThemeSwitch(props: ThemeSwitchProps): JSX.Element;
function LanguageSwitch(props: LanguageSwitchProps): JSX.Element;
function SupportLink(props: SupportLinkProps): JSX.Element;
function AboutDialog(props: AboutDialogProps): JSX.Element | null;
function SiteFooter(props: SiteFooterProps): JSX.Element;
function ConstellationSigil(props: ConstellationSigilProps): JSX.Element;
function Icon(props: IconProps): JSX.Element;

interface GameActions {
  createRoom(name: string): Promise<{ ok: boolean; errorCode?: GameErrorCode }>;
  joinRoom(name: string, code: string): Promise<{ ok: boolean; errorCode?: GameErrorCode }>;
  startGame(): Promise<boolean>;
  reveal(color: TileColor): Promise<boolean>;
  requestClassify(tileNumber: number): Promise<boolean>;
  submitClassify(slot: number): Promise<boolean>;
  requestCompare(tileNumber: number, position: number): Promise<boolean>;
  submitCompare(answer: boolean): Promise<boolean>;
  guess(numbers: number[]): Promise<boolean>;
  rematch(): Promise<boolean>;
  leaveRoom(): Promise<void>;
}
```

## 13. Stores and hooks

```ts
function useDeductionSheet(roomCode: string | null, playerId: string | null): DeductionSheetStore;
interface DeductionSheetStore {
  crossed: ReadonlySet<number>;
  guesses: string[];
  toggle(n: number): void;
  setGuess(index: number, value: string): void;
  reset(): void;
  readonly crossedCount: number;
}

function useMediaQuery(query: string): boolean;
function useIsMobile(): boolean;
function useToasts(): ToastApi;
function useI18n(): I18nApi;
```

## 14. Languages

```ts
type Language = 'fr' | 'en' | 'es';
function detectLanguage(stored?: string | null): Language; // saved choice, browser, then English
```

`client/src/i18n/en.ts` is the reference catalogue; `fr.ts` and `es.ts` carry
exactly the same keys and the same `{variables}`. Player-facing texts never
use technical words and, in French and Spanish, avoid gendered forms (see
`tests/unit/i18n.test.ts`).

## 15. Theme

```ts
type ThemePreference = 'auto' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';
function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme;
function nextThemePreference(preference: ThemePreference): ThemePreference;
function applyTheme(theme: ResolvedTheme): void;
```

## 16. Local storage

| Key | Content |
| --- | --- |
| `noctalis:session` | reconnection credentials (never a game secret) |
| `noctalis:prefs` | name, sound, tutorial seen, language, theme |
| `noctalis:sheet:<code>:<playerId>` | personal star chart |

## 17. Environment variables

| Variable | Default | Role |
| --- | --- | --- |
| `PORT` | `3001` | listening port (provided by Render) |
| `NODE_ENV` | `development` | runtime mode |
| `CLIENT_URL` | `http://localhost:5173` | allowed origins, comma-separated |
| `ROOM_TTL_MS` | `900000` | how long a room survives with nobody connected |
| `VITE_SERVER_URL` | empty | server origin, read when the client is built |

None of these variables is a secret. The project uses none.

## 18. npm scripts

| Script | Role |
| --- | --- |
| `npm run dev` | server + client in development |
| `npm run build` | shared, then server, then client |
| `npm start` | starts the built server (Render's start command) |
| `npm test` | Vitest tests |
| `npm run test:e2e` | Playwright tests, played against the production server |
| `npm run typecheck` | 4 TypeScript projects |
| `npm run lint` | ESLint |
| `npm run check:contract` | checks that the code exposes this contract |
| `npm run share` | plays with friends far away through a temporary tunnel (`play.cmd` on Windows) |

## 19. Test identifiers (`data-testid`)

Stable: the end-to-end tests depend on them.

`menu-create`, `menu-join`, `menu-help`, `name-input`, `code-input`,
`submit-room`, `home-error`, `room-code`, `copy-code`, `lobby-player-<i>`,
`waiting-host`, `start-game`, `leave-room`, `announce-button`,
`announce-input-0..4`, `submit-guess`, `confirm-guess`, `open-sheet`,
`close-sheet`, `reset-sheet`, `confirm-reset`, `deduction-sheet`,
`sheet-cell-<n>`, `guess-input-<i>`, `crossed-count`, `reveal-<color>`,
`hint-instruction`, `choose-classify`, `choose-compare`, `confirm-classify`,
`confirm-compare`, `confirm-compare-answer`, `game-over`, `game-over-result`,
`rematch`, `rematch-count`, `back-home`, `opponent-offline`, `leave-game`,
`skip-onboarding`, `next-onboarding`, `lang-fr`, `lang-en`, `lang-es`,
`lang-select`, `theme-auto`, `theme-light`, `theme-dark`, `theme-cycle`,
`roulette`, `roulette-continue`, `roulette-note`, `support-link`,
`about-open`, `about-dialog`.
