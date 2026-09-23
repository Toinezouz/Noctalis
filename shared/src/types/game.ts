import type { RevealedTile, SecretTileView, Tile, TileColor } from './tiles.js';

/**
 * Machine a etats de la partie. Chaque transition est explicite et validee
 * cote serveur (cf. `shared/src/game/engine.ts`).
 */
export type GamePhase =
  /** La room existe, il manque le second joueur. */
  | 'WAITING_FOR_PLAYER'
  /** Les deux joueurs sont la, la partie peut etre lancee. */
  | 'LOBBY_READY'
  /** Distribution des etoiles (etat transitoire, cote serveur uniquement). */
  | 'SETUP'
  /** Le joueur actif doit reveler une etoile en choisissant une constellation. */
  | 'TURN_REVEAL'
  /** Le joueur actif doit demander un indice (SITUER ou JAUGER). */
  | 'TURN_HINT'
  /** L'adversaire doit situer l'etoile choisie. */
  | 'WAITING_FOR_CLASSIFY'
  /** L'adversaire doit confirmer la reponse de la mesure. */
  | 'WAITING_FOR_COMPARE'
  /** Partie terminee. */
  | 'GAME_OVER';

export type HintType = 'classify' | 'compare';

/** Demande SITUER en attente de reponse. */
export interface ClassifyHint {
  type: 'classify';
  /** Etoile publique choisie par le demandeur. */
  tileNumber: number;
  /** Joueur dont on situe les etoiles secretes (le joueur actif). */
  askerId: string;
  /** Joueur qui doit repondre (il voit les vrais numeros du demandeur). */
  responderId: string;
}

/** Demande JAUGER en attente de reponse. */
export interface CompareHint {
  type: 'compare';
  tileNumber: number;
  /** Position secrete visee, 0 a 4. */
  position: number;
  askerId: string;
  responderId: string;
}

export type PendingHint = ClassifyHint | CompareHint;

/** Resultat d'un SITUER : l'etoile se range dans l'une des 6 encoches. */
export interface ClassifyResult {
  id: string;
  /** Joueur dont le support recoit l'etoile situee. */
  ownerId: string;
  tileNumber: number;
  /** Encoche 0 (avant la 1re) a 5 (apres la 5e). */
  slot: number;
  turn: number;
}

/** Resultat d'un JAUGER : OUI (meme nombre d'eclats) ou NON. */
export interface CompareResult {
  id: string;
  ownerId: string;
  tileNumber: number;
  /** Position secrete jaugee, 0 a 4. */
  position: number;
  /** `true` = OUI (memes eclats), `false` = NON. */
  match: boolean;
  turn: number;
}

/** Une annonce CONSTELLATION (une seule par joueur). */
export interface GuessRecord {
  playerId: string;
  numbers: number[];
  correct: boolean;
  turn: number;
}

export type LogKind =
  | 'system'
  | 'reveal'
  | 'hint-request'
  | 'classify'
  | 'compare'
  | 'turn'
  | 'guess'
  | 'connection';

/**
 * Evenement de l'historique. Le serveur ne redige aucune phrase : il envoie un
 * code et ses parametres, et chaque client l'affiche dans SA langue.
 */
export type LogCode =
  | 'game-started'
  | 'starting-player'
  | 'turn-start'
  | 'tile-revealed'
  | 'classify-requested'
  | 'compare-requested'
  | 'classify-answered'
  | 'compare-answered'
  | 'guess-correct'
  | 'guess-wrong'
  | 'player-eliminated'
  | 'player-left'
  | 'player-connected'
  | 'player-disconnected'
  | 'game-over-winner'
  | 'game-over-draw'
  | 'game-over-reserve-empty';

/** Valeurs interpolees dans le message (noms, numeros, positions...). */
export type LogParams = Record<string, string | number | boolean>;

/** Entree de l'historique public : jamais d'information secrete interdite. */
export interface LogEntry {
  id: string;
  at: number;
  kind: LogKind;
  /** Message a afficher, traduit par le client. */
  code: LogCode;
  params: LogParams;
  playerId?: string;
  /** Numero de etoile eventuellement concerne (toujours une etoile publique). */
  tileNumber?: number;
}

/** Etat serveur complet d'un joueur. Ne quitte JAMAIS le serveur tel quel. */
export interface PlayerState {
  id: string;
  name: string;
  connected: boolean;
  lastSeenAt: number;
  isHost: boolean;
  /** Les 5 numeros secrets, tries par ordre croissant. SECRET ABSOLU. */
  secret: number[];
  guessUsed: boolean;
  eliminated: boolean;
}

/** Etat serveur complet de la partie. Ne quitte JAMAIS le serveur tel quel. */
export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  /** Ordre des tours (ids des joueurs), a partir du joueur tire au sort. */
  order: string[];
  activePlayerId: string | null;
  /** Joueur tire au sort pour ouvrir la partie (fixe des la distribution). */
  startingPlayerId: string;
  /** Numeros de etoiles encore dans le ciel. */
  reserve: number[];
  publicTiles: RevealedTile[];
  pendingHint: PendingHint | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  guesses: GuessRecord[];
  log: LogEntry[];
  winnerId: string | null;
  /** Numero du tour courant (1 = premier tour). */
  turn: number;
  /** Une etoile a-t-elle deja ete revelee pendant ce tour ? */
  revealedThisTurn: boolean;
  startedAt: number | null;
  endedAt: number | null;
}

/** Joueur tel que vu par tout le monde : aucune information secrete. */
export interface PublicPlayer {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  guessUsed: boolean;
  eliminated: boolean;
  /** Constellations des 5 etoiles secretes, dans l'ordre des positions. */
  tileColors: TileColor[];
}

/**
 * Vue publique de la partie : strictement tout ce que les deux joueurs
 * peuvent voir. Aucun numero secret n'y figure (sauf a la fin de partie,
 * dans `finalReveal`, une fois la partie terminee).
 */
export interface PublicGameState {
  phase: GamePhase;
  players: PublicPlayer[];
  activePlayerId: string | null;
  /** Joueur tire au sort au debut de la partie (information publique). */
  startingPlayerId: string;
  publicTiles: RevealedTile[];
  reserveCount: number;
  /** Nombre de etoiles encore disponibles par constellation (info publique). */
  reserveByColor: Record<TileColor, number>;
  pendingHint: PendingHint | null;
  classifications: ClassifyResult[];
  comparisons: CompareResult[];
  guesses: GuessRecord[];
  log: LogEntry[];
  winnerId: string | null;
  turn: number;
  revealedThisTurn: boolean;
  startedAt: number | null;
  endedAt: number | null;
  /** Rempli uniquement quand `phase === 'GAME_OVER'`. */
  finalReveal: Record<string, Tile[]> | null;
}

/** Demande de reponse adressee a l'adversaire (vue privee du repondeur). */
export interface PendingResponse {
  hint: PendingHint;
  /**
   * Pour JAUGER uniquement : la reponse veritable, calculee par le serveur.
   * Le repondeur voit de toute facon les vrais numeros du demandeur : cette
   * valeur ne lui apprend rien, elle empeche simplement de repondre faux.
   */
  truth: boolean | null;
}

/**
 * Vue privee d'un joueur. C'est le seul canal par lequel un client recoit
 * des informations cachees, et il ne contient JAMAIS les numeros secrets du
 * destinataire.
 */
export interface PrivatePlayerState {
  playerId: string;
  /** Mes etoiles : constellation + position, jamais le numero ni les eclats. */
  myTiles: SecretTileView[];
  /** Les etoiles de l'adversaire, face visible, triees par numero croissant. */
  opponentTiles: Tile[];
  opponentId: string | null;
  guessUsed: boolean;
  eliminated: boolean;
  /** Non nul quand c'est a moi de repondre a un indice. */
  pendingResponse: PendingResponse | null;
}
