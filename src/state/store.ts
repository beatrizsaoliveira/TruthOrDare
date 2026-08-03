import { pickRandomTarget } from '../engine/matchingEngine.js';
import { recordCardShown, selectCard } from '../engine/repetitionEngine.js';
import type {
  Card,
  CardType,
  GameState,
  PersistedState,
  Player,
  PlayerHistories,
  PlayerHistory,
  RoundEffect,
  SerializedHistory,
  Theme,
  Tier,
} from '../types/index.js';

// ─── Storage keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tod_state_v1';
const ROSTER_KEY = 'tod_roster_v1';

export function loadSavedPlayers(): readonly Player[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Player[];
  } catch {
    return [];
  }
}

function persistRoster(players: readonly Player[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(players));
  } catch {
    // ignore
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function buildInitialState(allCards: readonly Card[]): GameState {
  return {
    phase: 'home',
    tier: null,
    penaltiesEnabled: false,
    ageConfirmed: false,
    players: [],
    currentPlayerIndex: 0,
    pendingCardType: null,
    currentCard: null,
    currentTargetPlayerId: null,
    showingPenalty: false,
    playerHistories: {},
    shotCounts: {},
    currentRound: 1,
    activeEffects: [],
    pendingRoundExpiry: [],
    timerRunning: false,
    theme: prefersDark() ? 'dark' : 'light',
    allCards,
  };
}

function prefersDark(): boolean {
  return globalThis.window?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

// ─── Store ────────────────────────────────────────────────────────────────────

type Subscriber = (state: GameState) => void;
type Updater = (prev: GameState) => GameState;

export class GameStore {
  private _state: GameState;
  private readonly _subscribers = new Set<Subscriber>();

  constructor(allCards: readonly Card[]) {
    const persisted = loadFromStorage();
    if (persisted) {
      this._state = { ...deserialize(persisted), allCards };
    } else {
      this._state = buildInitialState(allCards);
    }
  }

  get state(): GameState {
    return this._state;
  }

  update(updater: Updater): void {
    const prev = this._state;
    this._state = updater(this._state);
    persist(this._state);
    // Only persist roster when players change during the setup phase itself
    // (not on load/reset transitions).
    if (
      this._state.players !== prev.players &&
      this._state.phase === 'setup' &&
      prev.phase === 'setup'
    ) {
      persistRoster(this._state.players);
    }
    this._subscribers.forEach((fn) => fn(this._state));
  }

  subscribe(fn: Subscriber): () => void {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  /** Notify all subscribers without changing state (e.g. after theme change). */
  notify(): void {
    this._subscribers.forEach((fn) => fn(this._state));
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────
// Pure state-updater factories consumed by UI event handlers.

export const Actions = {
  setTheme:
    (theme: Theme): Updater =>
    (state) => ({ ...state, theme }),

  selectTier:
    (tier: Tier): Updater =>
    (state) => ({
      ...state,
      tier,
      phase: tier === 1 ? 'player-roster' : 'age-gate',
      ageConfirmed: false,
      players: [],
      playerHistories: {},
      shotCounts: {},
      currentRound: 1,
      activeEffects: [],
      pendingRoundExpiry: [],
      currentCard: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
      penaltiesEnabled: false,
    }),

  confirmAge: (): Updater => (state) => ({
    ...state,
    ageConfirmed: true,
    phase: 'player-roster',
  }),

  useRoster:
    (players: readonly Player[]): Updater =>
    (state) => ({ ...state, players: [...players], phase: 'setup' }),

  skipRoster: (): Updater => (state) => ({
    ...state,
    players: [],
    phase: 'setup',
  }),

  goBack: (): Updater => (state) => ({ ...state, phase: 'home' }),

  addPlayer:
    (player: Player): Updater =>
    (state) => {
      let players = [...state.players, player];

      // Bidirectional partner linking
      if (player.partnerId) {
        players = players.map((p) =>
          p.id === player.partnerId ? { ...p, partnerId: player.id } : p,
        );
      }

      return { ...state, players };
    },

  removePlayer:
    (playerId: string): Updater =>
    (state) => {
      const players = state.players
        // Remove the target player
        .filter((p) => p.id !== playerId)
        // Clear any partner reference pointing to the removed player
        .map((p) => (p.partnerId === playerId ? { ...p, partnerId: null } : p));

      return {
        ...state,
        players,
        playerHistories: omitKey(state.playerHistories, playerId),
      };
    },

  updatePlayer:
    (updated: Player): Updater =>
    (state) => {
      const prev = state.players.find((p) => p.id === updated.id);
      let players = state.players.map((p) => (p.id === updated.id ? updated : p));
      // Clear old partner's back-link if partner changed
      if (prev?.partnerId && prev.partnerId !== updated.partnerId) {
        players = players.map((p) => (p.id === prev.partnerId ? { ...p, partnerId: null } : p));
      }
      // Set new partner's back-link
      if (updated.partnerId && updated.partnerId !== prev?.partnerId) {
        players = players.map((p) =>
          p.id === updated.partnerId ? { ...p, partnerId: updated.id } : p,
        );
      }
      return { ...state, players };
    },

  setPenalties:
    (enabled: boolean): Updater =>
    (state) => ({ ...state, penaltiesEnabled: enabled }),

  startGame: (): Updater => (state) => ({
    ...state,
    phase: 'game-selecting',
    currentPlayerIndex: 0,
    playerHistories: {},
    shotCounts: {},
    currentRound: 1,
    activeEffects: [],
    pendingRoundExpiry: [],
    timerRunning: false,
    currentCard: null,
    pendingCardType: null,
    currentTargetPlayerId: null,
    showingPenalty: false,
  }),

  /**
   * Selects a card for the active player, using the anti-repetition engine and
   * (for Tiers 2–4) the matching engine to pick an eligible target.
   */
  chooseCardType:
    (type: CardType): Updater =>
    (state) => {
      if (!state.tier) return state;

      const activePlayer = state.players[state.currentPlayerIndex];
      if (!activePlayer) return state;

      const partner = getPartner(activePlayer, state.players);

      // Determine whether we need a card with no target (fallback).
      // For all tiers we check pickRandomTarget directly — even Tier 2,
      // where a coupled player in a couple whose partner left the game
      // should fall back to no-target cards instead of targeting a wrong player.
      const hasEligibleTarget =
        pickRandomTarget(activePlayer, state.players, state.tier) !== undefined;

      const card = selectCard(
        state.allCards,
        state.tier,
        type,
        activePlayer,
        partner,
        state.playerHistories,
        state.players.length,
        hasEligibleTarget ? undefined : true,
      );

      const targetPlayer =
        card.hasTarget ? pickRandomTarget(activePlayer, state.players, state.tier) : undefined;

      const histories = recordCardShown(state.playerHistories, activePlayer.id, card);

      return {
        ...state,
        phase: 'game-showing',
        pendingCardType: type,
        currentCard: card,
        currentTargetPlayerId: targetPlayer?.id ?? null,
        showingPenalty: false,
        playerHistories: histories,
      };
    },

  /** Player accepted the card — if it has a timer, go to timer phase; otherwise advance. */
  acceptCard: (): Updater => (state) => {
    const card = state.currentCard;
    const activePlayer = state.players[state.currentPlayerIndex];
    let activeEffects = state.activeEffects;
    if (card?.hasRounds && card.roundsCount != null && activePlayer) {
      const effect: RoundEffect = {
        cardId: card.id,
        cardText: card.rawText,
        playerId: activePlayer.id,
        triggerRound: state.currentRound,
        targetRound: state.currentRound + card.roundsCount,
      };
      activeEffects = [...activeEffects, effect];
    }

    // Track shots drunk as part of the challenge (not penalty)
    let shotCounts = state.shotCounts;
    if (card?.shotsOnSuccess != null && card.shotsOnSuccess > 0 && activePlayer) {
      shotCounts = {
        ...shotCounts,
        [activePlayer.id]: (shotCounts[activePlayer.id] ?? 0) + card.shotsOnSuccess,
      };
    }

    // If the card has a timer ≤ 60s, transition to the timer phase
    if (card?.timerSeconds != null && card.timerSeconds > 0 && card.timerSeconds <= 60) {
      return {
        ...state,
        phase: 'game-timer',
        timerRunning: false,
        activeEffects,
        shotCounts,
      };
    }

    const { nextIndex, newRound, expiring } = computeAdvance({
      ...state,
      activeEffects,
      shotCounts,
    });

    return {
      ...state,
      phase: 'game-selecting',
      currentPlayerIndex: nextIndex,
      currentRound: newRound,
      activeEffects,
      shotCounts,
      pendingRoundExpiry: expiring,
      currentCard: null,
      pendingCardType: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
    };
  },

  /** Player refused — show penalty overlay (if penalties are on). Shots are
   *  recorded later via confirmPenalty once the player reports what they drank. */
  refuseCard: (): Updater => (state) => {
    if (state.penaltiesEnabled) {
      return { ...state, showingPenalty: true };
    }
    const { nextIndex, newRound, expiring } = computeAdvance(state);
    return {
      ...state,
      showingPenalty: false,
      phase: 'game-selecting',
      currentPlayerIndex: nextIndex,
      currentRound: newRound,
      activeEffects: state.activeEffects,
      pendingRoundExpiry: expiring,
      currentCard: null,
      pendingCardType: null,
      currentTargetPlayerId: null,
    };
  },

  /** Player confirmed how many shots they drank — record and advance. */
  confirmPenalty:
    (shots: number): Updater =>
    (state) => {
      const activePlayer = state.players[state.currentPlayerIndex];
      const newShotCounts =
        activePlayer && shots > 0 ?
          {
            ...state.shotCounts,
            [activePlayer.id]: (state.shotCounts[activePlayer.id] ?? 0) + shots,
          }
        : state.shotCounts;

      const { nextIndex, newRound, expiring } = computeAdvance(state);

      return {
        ...state,
        shotCounts: newShotCounts,
        phase: 'game-selecting',
        currentPlayerIndex: nextIndex,
        currentRound: newRound,
        activeEffects: state.activeEffects,
        pendingRoundExpiry: expiring,
        currentCard: null,
        pendingCardType: null,
        currentTargetPlayerId: null,
        showingPenalty: false,
      };
    },

  /** @deprecated Use confirmPenalty(0) instead. Kept for safety. */
  dismissPenalty: (): Updater => (state) => {
    const { nextIndex, newRound, expiring } = computeAdvance(state);
    return {
      ...state,
      phase: 'game-selecting',
      currentPlayerIndex: nextIndex,
      currentRound: newRound,
      activeEffects: state.activeEffects,
      pendingRoundExpiry: expiring,
      currentCard: null,
      pendingCardType: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
    };
  },

  /** Skip the current player — advance to the next without a card. */
  skipPlayer: (): Updater => (state) => {
    const { nextIndex, newRound, expiring } = computeAdvance(state);
    return {
      ...state,
      phase: 'game-selecting',
      currentPlayerIndex: nextIndex,
      currentRound: newRound,
      pendingRoundExpiry: expiring,
      currentCard: null,
      pendingCardType: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
    };
  },

  /** Clears expired round effects after the player has acknowledged them. */
  acknowledgeRoundExpiry: (): Updater => (state) => ({
    ...state,
    activeEffects: state.activeEffects.filter(
      (e) =>
        !state.pendingRoundExpiry.some(
          (p) =>
            p.cardId === e.cardId && p.playerId === e.playerId && p.triggerRound === e.triggerRound,
        ),
    ),
    pendingRoundExpiry: [],
  }),

  // ─── Timer actions ─────────────────────────────────────────────────────────

  /** Starts the countdown timer. */
  startTimer: (): Updater => (state) => ({
    ...state,
    timerRunning: true,
  }),

  /** Player refused to do the timed challenge — go to penalty overlay or advance. */
  refuseTimer: (): Updater => (state) => {
    if (state.penaltiesEnabled) {
      return { ...state, phase: 'game-showing', showingPenalty: true, timerRunning: false };
    }
    const { nextIndex, newRound, expiring } = computeAdvance(state);
    return {
      ...state,
      phase: 'game-selecting',
      currentPlayerIndex: nextIndex,
      currentRound: newRound,
      pendingRoundExpiry: expiring,
      currentCard: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
      timerRunning: false,
    };
  },

  /** Timer completed — advance to next player. */
  completeTimer: (): Updater => (state) => {
    const { nextIndex, newRound, expiring } = computeAdvance(state);
    return {
      ...state,
      phase: 'game-selecting',
      currentPlayerIndex: nextIndex,
      currentRound: newRound,
      pendingRoundExpiry: expiring,
      currentCard: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
      timerRunning: false,
    };
  },

  endGame: (): Updater => (state) => {
    // If penalties were enabled and at least one player drank, show ranking first.
    // shotCounts are kept in memory for display but cleared from localStorage immediately.
    const hasShots = state.penaltiesEnabled && Object.values(state.shotCounts).some((n) => n > 0);
    if (hasShots) {
      return { ...state, phase: 'ranking' };
    }
    return { ...buildInitialState(state.allCards), theme: state.theme };
  },

  confirmEndGame: (): Updater => (state) => ({
    ...buildInitialState(state.allCards),
    theme: state.theme,
  }),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPartner(player: Player, players: readonly Player[]): Player | null {
  if (!player.partnerId) return null;
  return players.find((p) => p.id === player.partnerId) ?? null;
}

function omitKey<T>(obj: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _removed, ...rest } = obj;
  return rest;
}

/** Given the current state, compute the next player index, new round, and any expiring effects. */
function computeAdvance(state: GameState): {
  nextIndex: number;
  newRound: number;
  expiring: readonly RoundEffect[];
} {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const newRound = nextIndex === 0 ? state.currentRound + 1 : state.currentRound;
  const nextPlayer = state.players[nextIndex];
  const expiring =
    nextPlayer ?
      state.activeEffects.filter((e) => e.playerId === nextPlayer.id && e.targetRound <= newRound)
    : [];
  return { nextIndex, newRound, expiring };
}

// ─── LocalStorage persistence ─────────────────────────────────────────────────

function persist(state: GameState): void {
  try {
    const { allCards: _ignored, playerHistories: _ph, ...rest } = state;
    const serialized: PersistedState = {
      ...rest,
      playerHistories: serializeHistories(state.playerHistories),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // Storage quota exceeded — silently continue
  }
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function serializeHistories(histories: PlayerHistories): Record<string, SerializedHistory> {
  const result: Record<string, SerializedHistory> = {};
  for (const [id, h] of Object.entries(histories)) {
    result[id] = {
      playerId: h.playerId,
      seenCards: Array.from(h.seenCards),
      recentCards: Array.from(h.recentCards),
    };
  }
  return result;
}

const VALID_THEMES = new Set<string>([
  'light',
  'dark',
  'light-ocean',
  'dark-ocean',
  'light-warm',
  'dark-warm',
  'light-rose',
  'dark-rose',
  'light-forest',
  'dark-forest',
]);

function deserialize(persisted: PersistedState): Omit<GameState, 'allCards'> {
  const mutableHistories: Record<string, PlayerHistory> = {};
  for (const [id, h] of Object.entries(persisted.playerHistories)) {
    mutableHistories[id] = {
      playerId: h.playerId,
      seenCards: new Set(h.seenCards),
      recentCards: Array.from(h.recentCards),
    };
  }
  const playerHistories: PlayerHistories = mutableHistories;
  const theme: Theme =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- Set.has() doesn't narrow the type
    VALID_THEMES.has(persisted.theme) ? (persisted.theme as Theme)
    : prefersDark() ? 'dark'
    : 'light';
  // shotCounts may be absent in data saved before this field was added
  const shotCounts: Readonly<Record<string, number>> =
    (persisted as unknown as { shotCounts?: Record<string, number> }).shotCounts ?? {};
  const currentRound: number =
    (persisted as unknown as { currentRound?: number }).currentRound ?? 1;
  const activeEffects: readonly RoundEffect[] =
    (persisted as unknown as { activeEffects?: RoundEffect[] }).activeEffects ?? [];
  const pendingRoundExpiry: readonly RoundEffect[] =
    (persisted as unknown as { pendingRoundExpiry?: RoundEffect[] }).pendingRoundExpiry ?? [];
  const timerRunning: boolean =
    (persisted as unknown as { timerRunning?: boolean }).timerRunning ?? false;
  return {
    ...persisted,
    playerHistories,
    theme,
    shotCounts,
    currentRound,
    activeEffects,
    pendingRoundExpiry,
    timerRunning,
  };
}
