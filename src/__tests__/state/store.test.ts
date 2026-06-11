import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Actions, GameStore, loadSavedPlayers } from '../../state/store';
import type { Player } from '../../types/index.js';
import { mockCards, truthT1NoTarget } from '../fixtures/cards';
import { p1T1, p2T1 } from '../fixtures/players';

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ─── loadSavedPlayers ────────────────────────────────────────────────────────

describe('loadSavedPlayers', () => {
  it('returns [] when localStorage has no roster', () => {
    expect(loadSavedPlayers()).toEqual([]);
  });

  it('returns the saved players array', () => {
    const players: Player[] = [p1T1, p2T1];
    localStorage.setItem('tod_roster_v1', JSON.stringify(players));
    expect(loadSavedPlayers()).toEqual(players);
  });

  it('returns [] when localStorage has invalid JSON', () => {
    localStorage.setItem('tod_roster_v1', 'not-valid-json');
    expect(loadSavedPlayers()).toEqual([]);
  });
});

// ─── GameStore construction ──────────────────────────────────────────────────

describe('GameStore construction', () => {
  it('builds initial state when localStorage is empty', () => {
    const store = new GameStore(mockCards);
    expect(store.state.phase).toBe('home');
    expect(store.state.tier).toBeNull();
    expect(store.state.players).toEqual([]);
  });

  it('loads persisted state from localStorage', () => {
    const persisted = {
      phase: 'game-selecting' as const,
      tier: 2 as const,
      penaltiesEnabled: true,
      ageConfirmed: true,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      pendingCardType: null,
      currentCard: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
      playerHistories: {},
      theme: 'dark' as const,
      shotCounts: {},
    };
    localStorage.setItem('tod_state_v1', JSON.stringify(persisted));
    const store = new GameStore(mockCards);
    expect(store.state.phase).toBe('game-selecting');
    expect(store.state.tier).toBe(2);
    expect(store.state.penaltiesEnabled).toBe(true);
    expect(store.state.ageConfirmed).toBe(true);
    expect(store.state.players).toEqual([p1T1, p2T1]);
    expect(store.state.theme).toBe('dark');
  });

  it('allCards comes from constructor, not persisted state', () => {
    const persisted = {
      phase: 'home' as const,
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
      theme: 'light' as const,
      shotCounts: {},
    };
    localStorage.setItem('tod_state_v1', JSON.stringify(persisted));
    const customCards = [truthT1NoTarget];
    const store = new GameStore(customCards);
    expect(store.state.allCards).toBe(customCards);
    expect(store.state.allCards).not.toBe(mockCards);
  });

  it('deserializes persisted playerHistories (seenCards arrays → Sets)', () => {
    const persisted = {
      phase: 'game-selecting' as const,
      tier: 1 as const,
      penaltiesEnabled: false,
      ageConfirmed: true,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      pendingCardType: null,
      currentCard: null,
      currentTargetPlayerId: null,
      showingPenalty: false,
      playerHistories: {
        p1: {
          playerId: 'p1',
          seenCards: ['1|truth|1', '2|truth|2'],
          recentCards: ['1|truth|1'],
        },
      },
      theme: 'light' as const,
      shotCounts: {},
    };
    localStorage.setItem('tod_state_v1', JSON.stringify(persisted));
    const store = new GameStore(mockCards);
    const p1History = store.state.playerHistories['p1'];
    expect(p1History).toBeDefined();
    expect(p1History!.seenCards).toBeInstanceOf(Set);
    expect(p1History!.seenCards.has('1|truth|1')).toBe(true);
    expect(p1History!.seenCards.has('2|truth|2')).toBe(true);
    expect(p1History!.recentCards).toEqual(['1|truth|1']);
  });

  it('falls back to initial state when localStorage has invalid JSON', () => {
    localStorage.setItem('tod_state_v1', '{{{invalid-json}}}');
    const store = new GameStore(mockCards);
    expect(store.state.phase).toBe('home');
    expect(store.state.tier).toBeNull();
    expect(store.state.players).toEqual([]);
  });
});

// ─── GameStore subscription ──────────────────────────────────────────────────

describe('GameStore subscription', () => {
  it('subscribe(fn) — fn is called on next update', () => {
    const store = new GameStore(mockCards);
    const fn = vi.fn();
    store.subscribe(fn);
    store.update(Actions.setTheme('dark'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('subscribe(fn) — fn receives the new state', () => {
    const store = new GameStore(mockCards);
    const fn = vi.fn();
    store.subscribe(fn);
    store.update(Actions.setTheme('dark'));
    expect(fn).toHaveBeenCalledWith(store.state);
    expect(fn.mock.calls[0]![0]!.theme).toBe('dark');
  });

  it('unsubscribing (calling the returned function) stops notifications', () => {
    const store = new GameStore(mockCards);
    const fn = vi.fn();
    const unsubscribe = store.subscribe(fn);
    unsubscribe();
    store.update(Actions.setTheme('dark'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('multiple subscribers are all notified', () => {
    const store = new GameStore(mockCards);
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    store.subscribe(fn1);
    store.subscribe(fn2);
    store.update(Actions.setTheme('dark'));
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('after unsubscribing one of two subscribers, the other still gets notified', () => {
    const store = new GameStore(mockCards);
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const unsub1 = store.subscribe(fn1);
    store.subscribe(fn2);
    unsub1();
    store.update(Actions.setTheme('dark'));
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});

// ─── GameStore notify() ──────────────────────────────────────────────────────

describe('GameStore notify()', () => {
  it('calls all subscribers with current state without changing state', () => {
    const store = new GameStore(mockCards);
    const fn = vi.fn();
    store.subscribe(fn);
    const stateBefore = store.state;
    store.notify();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(stateBefore);
    expect(store.state).toBe(stateBefore);
  });

  it('state reference stays the same after notify()', () => {
    const store = new GameStore(mockCards);
    const stateRef = store.state;
    store.notify();
    expect(store.state).toBe(stateRef);
  });
});

// ─── GameStore update() ──────────────────────────────────────────────────────

describe('GameStore update()', () => {
  it('applies the updater function to current state', () => {
    const store = new GameStore(mockCards);
    expect(store.state.theme).not.toBe('dark');
    store.update(Actions.setTheme('dark'));
    expect(store.state.theme).toBe('dark');
  });

  it('state changes are reflected in store.state immediately', () => {
    const store = new GameStore(mockCards);
    store.update(Actions.setTheme('dark-ocean'));
    expect(store.state.theme).toBe('dark-ocean');
  });

  it('persists state to localStorage after update', () => {
    const store = new GameStore(mockCards);
    expect(localStorage.getItem('tod_state_v1')).toBeNull();
    store.update(Actions.setTheme('dark'));
    const saved = JSON.parse(localStorage.getItem('tod_state_v1')!);
    expect(saved.theme).toBe('dark');
  });

  it('calls all subscribers after update', () => {
    const store = new GameStore(mockCards);
    const fn = vi.fn();
    store.subscribe(fn);
    store.update(Actions.setTheme('dark'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── GameStore — roster persistence ──────────────────────────────────────────

describe('GameStore — roster persistence', () => {
  it('saves roster when players change during setup phase (both prev and new phase are setup)', () => {
    const store = new GameStore(mockCards);

    // Walk through the standard flow that lands in setup phase
    store.update(Actions.selectTier(2)); // phase → age-gate
    store.update(Actions.confirmAge()); // phase → player-roster
    store.update(Actions.skipRoster()); // phase → setup, players = []
    store.update(Actions.addPlayer(p1T1)); // still setup, players = [p1T1]

    const saved = JSON.parse(localStorage.getItem('tod_roster_v1')!);
    expect(saved).toEqual([p1T1]);
  });

  it('does NOT save roster when transitioning into setup (prev phase is not setup)', () => {
    const store = new GameStore(mockCards);

    // selectTier(1) → phase goes from home to player-roster, not setup
    store.update(Actions.selectTier(1));

    expect(localStorage.getItem('tod_roster_v1')).toBeNull();
  });

  it('does NOT save roster when players change outside the setup phase', () => {
    const store = new GameStore(mockCards);

    // Put the store in a non-setup phase with players
    store.update((s) => ({
      ...s,
      players: [p1T1, p2T1],
      phase: 'game-selecting' as const,
    }));
    // Clear anything that might have been saved by the transition
    localStorage.removeItem('tod_roster_v1');

    // Change players while staying in game-selecting
    store.update((s) => ({
      ...s,
      players: [p1T1],
    }));

    expect(localStorage.getItem('tod_roster_v1')).toBeNull();
  });
});
