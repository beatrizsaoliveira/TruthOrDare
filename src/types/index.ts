// ─── Primitive Domain Types ───────────────────────────────────────────────────

export type Tier = 1 | 2 | 3 | 4;
export type CardType = 'truth' | 'dare';
export type Sex = 'male' | 'female';
export type Orientation = 'hetero' | 'homo' | 'bi';
export type RelationshipStatus = 'single' | 'open' | 'closed';
export type TargetSex = Sex | 'both';
export type Theme =
  | 'light'
  | 'dark'
  | 'light-ocean'
  | 'dark-ocean'
  | 'light-warm'
  | 'dark-warm'
  | 'light-rose'
  | 'dark-rose'
  | 'light-forest'
  | 'dark-forest';

export type GamePhase =
  | 'home'
  | 'age-gate'
  | 'player-roster'
  | 'setup'
  | 'game-selecting'
  | 'game-showing'
  | 'game-timer'
  | 'ranking'
  | 'end';

// ─── Card ────────────────────────────────────────────────────────────────────

export type Card = {
  readonly id: string;
  readonly type: CardType;
  readonly tier: Tier;
  /** Raw text from dataset.json, including the (a) gender placeholders */
  readonly rawText: string;
  /** Parsed penalty (null when penalties are absent or tier 1) */
  readonly shots: number | null;
  /** Shots the player drinks on success (part of the challenge, not penalty). Counts toward ranking. */
  readonly shotsOnSuccess: number | null;
  /** Whether the text contains a [Target Player] placeholder */
  readonly hasTarget: boolean;
  /** Number of rounds this effect lasts (null when not a round-based card) */
  readonly roundsCount: number | null;
  /** Whether this card has a round-based duration */
  readonly hasRounds: boolean;
  /** Timer duration in seconds (extracted from dare text, ≤60s). null if N/A. */
  readonly timerSeconds: number | null;
  /** Whether this card requires a third party beyond the target player (excluded for closed relationships). */
  readonly requiresThirdParty: boolean;
};

// ─── Player ──────────────────────────────────────────────────────────────────

/**
 * Flat player model. Fields beyond `id`/`name` are populated
 * progressively based on the active tier.
 */
export type Player = {
  readonly id: string;
  readonly name: string;
  // Tier 2+
  readonly sex?: Sex;
  // Tier 3+
  readonly orientation?: Orientation;
  readonly relationshipStatus?: RelationshipStatus;
  readonly partnerId?: string | null;
  readonly openToOutside?: boolean;
  readonly targetSex?: TargetSex;
};

// ─── Anti-Repetition History ──────────────────────────────────────────────────

export type PlayerHistory = {
  readonly playerId: string;
  /** All card keys ever seen by this player ("tier|type|id") */
  readonly seenCards: ReadonlySet<string>;
  /** Sliding window of the last RECENT_WINDOW card keys */
  readonly recentCards: readonly string[];
};

export type PlayerHistories = Readonly<Record<string, PlayerHistory>>;

// ─── Round Effect ─────────────────────────────────────────────────────────────

/** Tracks an active round-based card effect for a player. */
export type RoundEffect = {
  /** The card's id */
  readonly cardId: string;
  /** Raw text of the card (used for the expiry popup message) */
  readonly cardText: string;
  /** The player who must fulfill this effect */
  readonly playerId: string;
  /** The round number when this effect was assigned */
  readonly triggerRound: number;
  /** The round number when this effect expires (triggerRound + roundsCount) */
  readonly targetRound: number;
};

// ─── Game State ───────────────────────────────────────────────────────────────

export type GameState = {
  readonly phase: GamePhase;
  readonly tier: Tier | null;
  readonly penaltiesEnabled: boolean;
  readonly ageConfirmed: boolean;
  readonly players: readonly Player[];
  readonly currentPlayerIndex: number;
  /** Which card type is currently displayed (set after T/D choice) */
  readonly pendingCardType: CardType | null;
  readonly currentCard: Card | null;
  readonly currentTargetPlayerId: string | null;
  /** Whether the player hit "Refuse" on the current card */
  readonly showingPenalty: boolean;
  readonly playerHistories: PlayerHistories;
  readonly theme: Theme;
  /** Accumulated shots per player id (reset when a new game starts). Persisted. */
  readonly shotCounts: Readonly<Record<string, number>>;
  /** Current round number — increments each time the turn wraps back to player 0. Starts at 1. */
  readonly currentRound: number;
  /** Active round-based effects that are still running */
  readonly activeEffects: readonly RoundEffect[];
  /** Effects that just expired for the current player — cleared after acknowledgement */
  readonly pendingRoundExpiry: readonly RoundEffect[];
  /** Whether the countdown timer is currently running */
  readonly timerRunning: boolean;
  /**
   * All parsed cards for the active tier. NOT persisted to localStorage —
   * re-derived from the JSON dataset at startup.
   */
  readonly allCards: readonly Card[];
};

// ─── LocalStorage serialisation ───────────────────────────────────────────────

export type SerializedHistory = {
  readonly playerId: string;
  readonly seenCards: readonly string[];
  readonly recentCards: readonly string[];
};

/** Persisted slice of GameState (omits `allCards` to keep storage small) */
export type PersistedState = Omit<GameState, 'allCards' | 'playerHistories'> & {
  readonly playerHistories: Readonly<Record<string, SerializedHistory>>;
};

// ─── UI helpers ───────────────────────────────────────────────────────────────

export type TierMeta = {
  readonly tier: Tier;
  readonly label: string;
  readonly subtitle: string;
  readonly emoji: string;
  readonly gradient: string;
  readonly restricted: boolean;
};

export const TIER_META: readonly TierMeta[] = [
  {
    tier: 1,
    label: 'Diversão Familiar',
    subtitle: 'Seguro para todas as idades',
    emoji: '🌟',
    gradient: 'var(--gradient-tier1)',
    restricted: false,
  },
  {
    tier: 2,
    label: 'Noite entre Amigos',
    subtitle: 'Maior de 18 anos',
    emoji: '🎉',
    gradient: 'var(--gradient-tier2)',
    restricted: true,
  },
  {
    tier: 3,
    label: 'Onde a Ousadia Começa',
    subtitle: 'Maior de 18 anos • Conteúdo adulto',
    emoji: '🔥',
    gradient: 'var(--gradient-tier3)',
    restricted: true,
  },
  {
    tier: 4,
    label: 'Extremo',
    subtitle: 'Maior de 18 anos • Conteúdo explícito',
    emoji: '💀',
    gradient: 'var(--gradient-tier4)',
    restricted: true,
  },
];
