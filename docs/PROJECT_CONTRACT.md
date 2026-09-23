# Contrat technique de NOCTALIS

> **Source de vérité des signatures.** Tout nom, toute signature et tout
> événement listés ici sont immuables. Un fichier qui s'en écarte est en
> faute, pas le contrat.
>
> Pour changer une signature : modifier ce document, modifier **tous** les
> consommateurs, exécuter `npm run typecheck`, `npm run test`, puis
> `npm run check:contract` qui vérifie que le code expose bien ce contrat.

## 0. Renommages décidés lors de la migration

| Avant | Après | Raison |
| --- | --- | --- |
| `@gotfive/shared` · `@gotfive/server` · `@gotfive/client` | `@noctalis/shared` · `@noctalis/server` · `@noctalis/client` | identité |
| `GameOverReason = 'got-five'` | `GameOverReason = 'constellation'` | identité, valeur transmise sur le réseau |
| clés `gotfive:*` (stockage local) | `noctalis:*` | identité |
| `data-testid="got-five-button"` | `data-testid="announce-button"` | identité |
| `data-testid="got-five-input-N"` | `data-testid="announce-input-N"` | identité |
| prop `gotFiveDisabled` | `announceDisabled` | identité |
| `PublicPlayer.guessUsed` | *inchangé* | terme générique |

Tout le reste du moteur conserve ses noms : ils décrivent des mécanismes, pas
une marque.

## 1. Types de données (`@noctalis/shared`)

```ts
type TileColor = 'green' | 'pink' | 'blue' | 'red' | 'orange';
type TilePoints = 1 | 2 | 3;

interface Tile { number: number; color: TileColor; points: TilePoints }
interface SecretTileView { color: TileColor; position: number }
interface RevealedTile { tile: Tile; order: number; revealedBy: string | null; used: boolean }
```

Les identifiants de `TileColor` restent en anglais : ce sont des teintes. Leur
nom d'affichage (Lyre, Aurore, Cygne, Braise, Phénix) vit dans les catalogues
de traduction, jamais dans le moteur.

## 2. Constantes

```ts
const TILE_COUNT = 60;
const COLOR_ORDER: readonly TileColor[];
const SECRET_TILE_COUNT = 5;
const CLASSIFY_SLOT_COUNT = 6;
const SHEET_COLUMNS = 12;
const TILES: readonly Tile[];
const SHEET_GRID: readonly (readonly Tile[])[];
const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 16;
```

## 3. Machine à états

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

Un seul nom par état. Aucun synonyme n'est toléré.

## 4. États et projections

```ts
interface GameState          // serveur uniquement, ne sort jamais
interface PublicGameState    // visible par les deux joueurs
interface PrivatePlayerState // visible par un seul joueur
interface PublicPlayer
interface PlayerState        // serveur uniquement (contient `secret`)

function toPublicGameState(state: GameState): PublicGameState;
function toPlayerPrivateState(state: GameState, playerId: string): PrivatePlayerState | null;
function findSecretLeak(state: GameState, playerId: string, payload: unknown): SecretLeak | null;
```

**Règle non négociable** : aucun chemin de code ne sérialise `GameState`. Un
client ne reçoit que la combinaison des deux projections, et sa vue privée ne
contient jamais ses propres numéros.

## 5. Moteur

```ts
function createGame(seeds: readonly PlayerSeed[], rng: Rng): GameState;
function revealTile(state: GameState, playerId: string, color: TileColor, rng: Rng): EngineResult;
function requestClassify(state: GameState, playerId: string, tileNumber: number): EngineResult;
function submitClassify(state: GameState, playerId: string, slot: number): EngineResult;
function requestCompare(state: GameState, playerId: string, tileNumber: number, position: number): EngineResult;
function submitCompare(state: GameState, playerId: string): EngineResult;
function submitGuess(state: GameState, playerId: string, numbers: readonly number[]): EngineResult;
function forfeit(state: GameState, playerId: string): EngineResult;

function getPlayer(state: GameState, playerId: string): PlayerState | undefined;
function getOpponent(state: GameState, playerId: string): PlayerState | undefined;
function getWinner(state: GameState): PlayerState | null;
function isPublicTile(state: GameState, tileNumber: number): boolean;
function availablePublicTiles(state: GameState): RevealedTile[];
function getCompareTruth(state: GameState): boolean | null;
function setPlayerConnected(state: GameState, playerId: string, connected: boolean): void;

type EngineResult = { ok: true; events: GameEvent[] } | { ok: false; error: GameError };
```

`submitCompare` ne prend **pas** la réponse du client : le serveur la
recalcule. C'est une propriété de sécurité, pas un détail de signature.

## 6. Données et règles

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
function validateClassify(secret: readonly number[], tileNumber: number, slot: number): boolean;
function validateGuess(secret: readonly number[], numbers: readonly number[]): boolean;
function validateGuessShape(numbers: readonly unknown[]): GuessValidation;
```

## 7. Hasard

```ts
type Rng = () => number;
const defaultRng: Rng;
function createSeededRng(seed: number): Rng;
function randomInt(rng: Rng, max: number): number;
function pickRandom<T>(rng: Rng, items: readonly T[]): T;
```

## 8. Validation des entrées

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

## 9. Protocole Socket.IO

Noms d'événements **immuables**. Chaque action cliente répond par un
acquittement `Ack<T> = { ok: true; data: T } | { ok: false; error: GameError }`.

### Client → serveur

| Événement | Charge utile | Acquittement |
| --- | --- | --- |
| `room:create` | `{ name: string }` | `Ack<PlayerCredentials>` |
| `room:join` | `{ name: string; code: string }` | `Ack<PlayerCredentials>` |
| `player:reconnect` | `{ code: string; playerId: string; token: string }` | `Ack<PlayerCredentials>` |
| `room:leave` | `{}` | `Ack<null>` |
| `game:start` | `{}` | `Ack<null>` |
| `game:reveal` | `{ color: TileColor }` | `Ack<null>` |
| `game:request-classify` | `{ tileNumber: number }` | `Ack<null>` |
| `game:submit-classify` | `{ slot: number }` | `Ack<null>` |
| `game:request-compare` | `{ tileNumber: number; position: number }` | `Ack<null>` |
| `game:submit-compare` | `{ answer: boolean }` — **valeur ignorée** | `Ack<null>` |
| `game:guess` | `{ numbers: number[] }` | `Ack<null>` |
| `game:rematch` | `{}` | `Ack<null>` |

### Serveur → client

| Événement | Contenu |
| --- | --- |
| `room:state` / `game:state` | `StatePayload` — individualisé par joueur |
| `game:event` | `GameEvent` |
| `player:joined` / `player:left` / `player:reconnected` | `{ playerId: string; name: string }` |
| `server:error` | `GameError` |

```ts
type GameEvent =
  | { type: 'game-started'; startingPlayerId: string }
  | { type: 'tile-revealed'; tile: Tile; byPlayerId: string }
  | { type: 'hint-requested'; hint: PendingHint }
  | { type: 'classify-result'; result: ClassifyResult; wasCorrect: boolean }
  | { type: 'compare-result'; result: CompareResult }
  | { type: 'turn-changed'; activePlayerId: string | null; turn: number }
  | { type: 'guess-result'; playerId: string; numbers: number[]; correct: boolean }
  | { type: 'game-over'; winnerId: string | null; reason: GameOverReason };

interface StatePayload { room: RoomState; publicState: PublicGameState | null; privateState: PrivatePlayerState | null }
```

## 10. Routes HTTP

| Méthode | Chemin | Réponse |
| --- | --- | --- |
| `GET` | `/health` | `{ status: 'ok', rooms: number, uptime: number, env: string }` |
| `GET` | `/*` | `client/dist/index.html` (repli SPA) |

`status` vaut toujours la chaîne `"ok"` quand le service répond : c'est la
sonde utilisée par Render.

## 11. Serveur

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

`RoomManager` est le dépôt en mémoire de la v1 : **les observations en cours
sont perdues si le service redémarre.** C'est documenté, assumé, et suffisant
pour des parties de quelques dizaines de minutes. Aucune base de données n'est
ajoutée tant qu'un besoin réel ne l'impose pas.

## 12. Client — composants et props

```tsx
function App(): JSX.Element;
function GameProvider({ children }: { children: ReactNode }): JSX.Element;
function useGame(): GameContextValue;

function GameTable(props: GameTableProps): JSX.Element | null;
function GameHeader(props: GameHeaderProps): JSX.Element;
function DeductionSheet(props: DeductionSheetProps): JSX.Element;
function StartRoulette(props: StartRouletteProps): JSX.Element | null;
function ThemeSwitch(props: ThemeSwitchProps): JSX.Element;
function LanguageSwitch(props: LanguageSwitchProps): JSX.Element;
function SupportLink(props: SupportLinkProps): JSX.Element;
function AboutDialog(props: AboutDialogProps): JSX.Element | null;
function SiteFooter(props: SiteFooterProps): JSX.Element;

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

## 13. Magasins et hooks

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

## 14. Thème

```ts
type ThemePreference = 'auto' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';
function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme;
function nextThemePreference(preference: ThemePreference): ThemePreference;
function applyTheme(theme: ResolvedTheme): void;
```

## 15. Stockage local

| Clé | Contenu |
| --- | --- |
| `noctalis:session` | identifiants de reconnexion (jamais de secret de jeu) |
| `noctalis:prefs` | pseudo, son, tutoriel vu, langue, thème |
| `noctalis:sheet:<code>:<playerId>` | carte du ciel personnelle |

## 16. Variables d'environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `3001` | port d'écoute (fourni par Render) |
| `NODE_ENV` | `development` | mode d'exécution |
| `CLIENT_URL` | `http://localhost:5173` | origines autorisées, séparées par des virgules |
| `ROOM_TTL_MS` | `900000` | survie d'une observation sans joueur connecté |
| `VITE_SERVER_URL` | vide | origine du serveur, lue au build du client |

Aucune de ces variables n'est un secret. Le projet n'en utilise aucun.

## 17. Scripts npm

| Script | Rôle |
| --- | --- |
| `npm run dev` | serveur + client en développement |
| `npm run build` | shared, puis serveur, puis client |
| `npm start` | démarre le serveur compilé (commande de Render) |
| `npm test` | tests Vitest |
| `npm run test:e2e` | tests Playwright |
| `npm run typecheck` | 4 projets TypeScript |
| `npm run lint` | ESLint |
| `npm run check:contract` | vérifie que le code expose ce contrat |
| `npm run share` | partie à distance via tunnel éphémère |

## 18. Identifiants de test (`data-testid`)

Stables : les tests E2E en dépendent.

`menu-create`, `menu-join`, `menu-help`, `name-input`, `code-input`,
`submit-room`, `home-error`, `room-code`, `waiting-host`, `start-game`,
`announce-button`, `announce-input-0..4`, `submit-guess`, `confirm-guess`,
`open-sheet`, `close-sheet`, `reset-sheet`, `confirm-reset`,
`deduction-sheet`, `sheet-cell-<n>`, `guess-input-<i>`, `crossed-count`,
`reveal-<color>`, `hint-instruction`, `choose-classify`, `choose-compare`,
`confirm-classify`, `confirm-compare`, `confirm-compare-answer`, `game-over`,
`game-over-result`, `rematch`, `back-home`, `opponent-offline`,
`skip-onboarding`, `lang-fr`, `lang-es`, `theme-auto`, `theme-light`,
`theme-dark`, `theme-cycle`, `roulette`, `roulette-continue`,
`roulette-note`, `support-link`, `about-open`, `about-dialog`.
