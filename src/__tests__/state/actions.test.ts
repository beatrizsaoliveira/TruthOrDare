import { describe, expect, it, vi } from 'vitest';
import { Actions, buildInitialState } from '../../state/store';
import type { GameState, Player } from '../../types/index.js';
import {
  dareT1NoTarget,
  dareT1WithRounds,
  mockCards,
  truthT1NoTarget,
  truthT1WithTarget,
  truthT3NoTarget,
} from '../fixtures/cards';
import { heteroMale, heteroMale2, p1T1, p2T1, p3T1 } from '../fixtures/players';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(overrides?: Partial<GameState>): GameState {
  return {
    ...buildInitialState(mockCards),
    theme: 'light',
    ...overrides,
  };
}

// ─── buildInitialState ───────────────────────────────────────────────────────

describe('buildInitialState', () => {
  it('returns phase:home, tier:null, penaltiesEnabled:false, ageConfirmed:false', () => {
    const state = buildInitialState(mockCards);
    expect(state.phase).toBe('home');
    expect(state.tier).toBeNull();
    expect(state.penaltiesEnabled).toBe(false);
    expect(state.ageConfirmed).toBe(false);
  });

  it('returns empty players, currentPlayerIndex:0, no current card', () => {
    const state = buildInitialState(mockCards);
    expect(state.players).toEqual([]);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.currentCard).toBeNull();
    expect(state.pendingCardType).toBeNull();
    expect(state.currentTargetPlayerId).toBeNull();
    expect(state.showingPenalty).toBe(false);
  });

  it('allCards field matches the provided cards array', () => {
    const state = buildInitialState(mockCards);
    expect(state.allCards).toBe(mockCards);
  });

  it('shotCounts is empty', () => {
    const state = buildInitialState(mockCards);
    expect(state.shotCounts).toEqual({});
  });
});

// ─── Actions.setTheme ────────────────────────────────────────────────────────

describe('Actions.setTheme', () => {
  it('changes theme to the given value', () => {
    const state = makeState({ theme: 'light' });
    const next = Actions.setTheme('dark')(state);
    expect(next.theme).toBe('dark');
  });

  it('does not change other state fields', () => {
    const state = makeState({ phase: 'setup', tier: 2, theme: 'light' });
    const next = Actions.setTheme('dark-ocean')(state);
    expect(next.phase).toBe('setup');
    expect(next.tier).toBe(2);
    expect(next.players).toEqual([]);
  });
});

// ─── Actions.selectTier ─────────────────────────────────────────────────────

describe('Actions.selectTier', () => {
  it.each([2, 3, 4] as const)('tier=%d → phase becomes age-gate', (tier) => {
    const state = makeState();
    const next = Actions.selectTier(tier)(state);
    expect(next.phase).toBe('age-gate');
    expect(next.tier).toBe(tier);
  });

  it('tier=1 → phase becomes player-roster (skips age gate)', () => {
    const state = makeState();
    const next = Actions.selectTier(1)(state);
    expect(next.phase).toBe('player-roster');
    expect(next.tier).toBe(1);
  });

  it('resets players to []', () => {
    const state = makeState({ players: [p1T1, p2T1] });
    const next = Actions.selectTier(1)(state);
    expect(next.players).toEqual([]);
  });

  it('resets shotCounts to {}', () => {
    const state = makeState({ shotCounts: { p1: 5 } });
    const next = Actions.selectTier(2)(state);
    expect(next.shotCounts).toEqual({});
  });

  it('resets currentCard to null', () => {
    const state = makeState({ currentCard: truthT1NoTarget });
    const next = Actions.selectTier(2)(state);
    expect(next.currentCard).toBeNull();
  });

  it('resets showingPenalty to false', () => {
    const state = makeState({ showingPenalty: true });
    const next = Actions.selectTier(2)(state);
    expect(next.showingPenalty).toBe(false);
  });

  it('resets penaltiesEnabled to false', () => {
    const state = makeState({ penaltiesEnabled: true });
    const next = Actions.selectTier(2)(state);
    expect(next.penaltiesEnabled).toBe(false);
  });

  it('sets ageConfirmed to false', () => {
    const state = makeState({ ageConfirmed: true });
    const next = Actions.selectTier(2)(state);
    expect(next.ageConfirmed).toBe(false);
  });
});

// ─── Actions.confirmAge ──────────────────────────────────────────────────────

describe('Actions.confirmAge', () => {
  it('sets ageConfirmed to true', () => {
    const state = makeState({ ageConfirmed: false });
    const next = Actions.confirmAge()(state);
    expect(next.ageConfirmed).toBe(true);
  });

  it('phase becomes player-roster', () => {
    const state = makeState({ phase: 'age-gate' });
    const next = Actions.confirmAge()(state);
    expect(next.phase).toBe('player-roster');
  });
});

// ─── Actions.useRoster ───────────────────────────────────────────────────────

describe('Actions.useRoster', () => {
  it('sets players from provided list', () => {
    const state = makeState();
    const next = Actions.useRoster([p1T1, p2T1])(state);
    expect(next.players).toEqual([p1T1, p2T1]);
  });

  it('phase becomes setup', () => {
    const state = makeState({ phase: 'player-roster' });
    const next = Actions.useRoster([p1T1])(state);
    expect(next.phase).toBe('setup');
  });
});

// ─── Actions.skipRoster ──────────────────────────────────────────────────────

describe('Actions.skipRoster', () => {
  it('clears players to []', () => {
    const state = makeState({ players: [p1T1, p2T1] });
    const next = Actions.skipRoster()(state);
    expect(next.players).toEqual([]);
  });

  it('phase becomes setup', () => {
    const state = makeState({ phase: 'player-roster' });
    const next = Actions.skipRoster()(state);
    expect(next.phase).toBe('setup');
  });
});

// ─── Actions.goBack ──────────────────────────────────────────────────────────

describe('Actions.goBack', () => {
  it('phase becomes home', () => {
    const state = makeState({ phase: 'setup' });
    const next = Actions.goBack()(state);
    expect(next.phase).toBe('home');
  });
});

// ─── Actions.addPlayer ───────────────────────────────────────────────────────

describe('Actions.addPlayer', () => {
  it('adds player to players list', () => {
    const state = makeState({ players: [p1T1] });
    const next = Actions.addPlayer(p2T1)(state);
    expect(next.players).toEqual([p1T1, p2T1]);
  });

  it('bidirectionally links partner when player has partnerId', () => {
    const alice: Player = { id: 'a', name: 'Alice' };
    const bob: Player = { id: 'b', name: 'Bob' };
    const state = makeState({ players: [bob] });
    const next = Actions.addPlayer({ ...alice, partnerId: 'b' })(state);
    const updatedBob = next.players.find((p) => p.id === 'b')!;
    expect(updatedBob.partnerId).toBe('a');
    expect(next.players.find((p) => p.id === 'a')!.partnerId).toBe('b');
  });

  it('does not mutate back-links when player has no partnerId', () => {
    const state = makeState({ players: [p1T1] });
    const next = Actions.addPlayer(p2T1)(state);
    expect(next.players[0].partnerId).toBeUndefined();
  });

  it('multiple players can be added sequentially', () => {
    const state = makeState({ players: [] });
    const afterFirst = Actions.addPlayer(p1T1)(state);
    const afterSecond = Actions.addPlayer(p2T1)(afterFirst);
    const afterThird = Actions.addPlayer(p3T1)(afterSecond);
    expect(afterThird.players).toEqual([p1T1, p2T1, p3T1]);
  });
});

// ─── Actions.removePlayer ────────────────────────────────────────────────────

describe('Actions.removePlayer', () => {
  it('removes the player from players list', () => {
    const state = makeState({ players: [p1T1, p2T1, p3T1] });
    const next = Actions.removePlayer('p2')(state);
    expect(next.players).toEqual([p1T1, p3T1]);
  });

  it('clears partnerId on any player that pointed to the removed player', () => {
    const alice: Player = { id: 'a', name: 'Alice', partnerId: 'b' };
    const bob: Player = { id: 'b', name: 'Bob', partnerId: 'a' };
    const state = makeState({ players: [alice, bob] });
    const next = Actions.removePlayer('a')(state);
    expect(next.players).toEqual([{ id: 'b', name: 'Bob', partnerId: null }]);
  });

  it('removes the player entry from playerHistories', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      playerHistories: {
        p1: { playerId: 'p1', seenCards: new Set(), recentCards: [] },
        p2: { playerId: 'p2', seenCards: new Set(), recentCards: [] },
      },
    });
    const next = Actions.removePlayer('p1')(state);
    expect(next.playerHistories).not.toHaveProperty('p1');
    expect(next.playerHistories).toHaveProperty('p2');
  });

  it('does not affect other players histories', () => {
    const history = {
      playerId: 'p2',
      seenCards: new Set(['1']),
      recentCards: ['1'],
    };
    const state = makeState({
      players: [p1T1, p2T1],
      playerHistories: { p2: history },
    });
    const next = Actions.removePlayer('p1')(state);
    expect(next.playerHistories['p2']).toBe(history);
  });

  it('does not affect players who had a different partner', () => {
    const alice: Player = { id: 'a', name: 'Alice', partnerId: 'b' };
    const bob: Player = { id: 'b', name: 'Bob', partnerId: 'a' };
    const carol: Player = { id: 'c', name: 'Carol', partnerId: 'd' };
    const dave: Player = { id: 'd', name: 'Dave', partnerId: 'c' };
    const state = makeState({ players: [alice, bob, carol, dave] });
    const next = Actions.removePlayer('a')(state);
    const daveInResult = next.players.find((p) => p.id === 'd')!;
    expect(daveInResult.partnerId).toBe('c');
  });
});

// ─── Actions.updatePlayer ────────────────────────────────────────────────────

describe('Actions.updatePlayer', () => {
  it('updates the player data in place', () => {
    const state = makeState({ players: [{ id: 'a', name: 'Alice' }] });
    const next = Actions.updatePlayer({
      id: 'a',
      name: 'Alice Updated',
    })(state);
    expect(next.players[0]!.name).toBe('Alice Updated');
  });

  it('clears old partners back-link when partner changes', () => {
    const state = makeState({
      players: [
        { id: 'a', name: 'Alice', partnerId: 'b' },
        { id: 'b', name: 'Bob', partnerId: 'a' },
        { id: 'c', name: 'Carol' },
      ],
    });
    const next = Actions.updatePlayer({
      id: 'a',
      name: 'Alice',
      partnerId: 'c',
    })(state);
    const bob = next.players.find((p) => p.id === 'b')!;
    expect(bob.partnerId).toBeNull();
  });

  it('sets new partners back-link when partner changes', () => {
    const state = makeState({
      players: [
        { id: 'a', name: 'Alice', partnerId: 'b' },
        { id: 'b', name: 'Bob', partnerId: 'a' },
        { id: 'c', name: 'Carol' },
      ],
    });
    const next = Actions.updatePlayer({
      id: 'a',
      name: 'Alice',
      partnerId: 'c',
    })(state);
    const carol = next.players.find((p) => p.id === 'c')!;
    expect(carol.partnerId).toBe('a');
  });

  it('when partner stays the same: no extra back-link changes', () => {
    const state = makeState({
      players: [
        { id: 'a', name: 'Alice', partnerId: 'b' },
        { id: 'b', name: 'Bob', partnerId: 'a' },
      ],
    });
    const next = Actions.updatePlayer({
      id: 'a',
      name: 'Alice Updated',
      partnerId: 'b',
    })(state);
    const bob = next.players.find((p) => p.id === 'b')!;
    expect(bob.partnerId).toBe('a');
  });

  it('when partner is removed (partnerId becomes null): clears old partners back-link', () => {
    const state = makeState({
      players: [
        { id: 'a', name: 'Alice', partnerId: 'b' },
        { id: 'b', name: 'Bob', partnerId: 'a' },
      ],
    });
    const next = Actions.updatePlayer({
      id: 'a',
      name: 'Alice',
      partnerId: null,
    })(state);
    const bob = next.players.find((p) => p.id === 'b')!;
    expect(bob.partnerId).toBeNull();
  });
});

// ─── Actions.setPenalties ────────────────────────────────────────────────────

describe('Actions.setPenalties', () => {
  it('sets penaltiesEnabled to true', () => {
    const state = makeState({ penaltiesEnabled: false });
    const next = Actions.setPenalties(true)(state);
    expect(next.penaltiesEnabled).toBe(true);
  });

  it('sets penaltiesEnabled to false', () => {
    const state = makeState({ penaltiesEnabled: true });
    const next = Actions.setPenalties(false)(state);
    expect(next.penaltiesEnabled).toBe(false);
  });
});

// ─── Actions.startGame ───────────────────────────────────────────────────────

describe('Actions.startGame', () => {
  it('phase becomes game-selecting', () => {
    const state = makeState({ phase: 'setup' });
    const next = Actions.startGame()(state);
    expect(next.phase).toBe('game-selecting');
  });

  it('currentPlayerIndex resets to 0', () => {
    const state = makeState({ currentPlayerIndex: 3 });
    const next = Actions.startGame()(state);
    expect(next.currentPlayerIndex).toBe(0);
  });

  it('playerHistories resets to {}', () => {
    const state = makeState({
      playerHistories: {
        p1: {
          playerId: 'p1',
          seenCards: new Set(),
          recentCards: [],
        },
      },
    });
    const next = Actions.startGame()(state);
    expect(next.playerHistories).toEqual({});
  });

  it('shotCounts resets to {}', () => {
    const state = makeState({ shotCounts: { p1: 5 } });
    const next = Actions.startGame()(state);
    expect(next.shotCounts).toEqual({});
  });

  it('currentCard becomes null', () => {
    const state = makeState({ currentCard: truthT1NoTarget });
    const next = Actions.startGame()(state);
    expect(next.currentCard).toBeNull();
  });

  it('showingPenalty becomes false', () => {
    const state = makeState({ showingPenalty: true });
    const next = Actions.startGame()(state);
    expect(next.showingPenalty).toBe(false);
  });
});

// ─── Actions.chooseCardType ──────────────────────────────────────────────────

describe('Actions.chooseCardType', () => {
  it('returns state unchanged when tier is null', () => {
    const state = makeState({ tier: null, players: [p1T1] });
    const next = Actions.chooseCardType('truth')(state);
    expect(next).toBe(state);
  });

  it('returns state unchanged when no active player (empty players array)', () => {
    const state = makeState({ tier: 1, players: [] });
    const next = Actions.chooseCardType('truth')(state);
    expect(next).toBe(state);
  });

  it('with valid tier+players+allCards: phase becomes game-showing', () => {
    const state = makeState({
      tier: 1,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      allCards: [truthT1NoTarget],
    });
    const next = Actions.chooseCardType('truth')(state);
    expect(next.phase).toBe('game-showing');
  });

  it('pendingCardType matches the requested type', () => {
    const state = makeState({
      tier: 1,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      allCards: [truthT1NoTarget, dareT1NoTarget],
    });
    const truthNext = Actions.chooseCardType('truth')(state);
    expect(truthNext.pendingCardType).toBe('truth');

    const dareNext = Actions.chooseCardType('dare')(state);
    expect(dareNext.pendingCardType).toBe('dare');
  });

  it('currentCard is not null', () => {
    const state = makeState({
      tier: 1,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      allCards: [truthT1NoTarget],
    });
    const next = Actions.chooseCardType('truth')(state);
    expect(next.currentCard).not.toBeNull();
  });

  it('playerHistories is updated (the active player history now exists)', () => {
    const state = makeState({
      tier: 1,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      allCards: [truthT1NoTarget],
    });
    const next = Actions.chooseCardType('truth')(state);
    expect(next.playerHistories).toHaveProperty('p1');
  });

  it('when card has hasTarget=false: currentTargetPlayerId is null', () => {
    const state = makeState({
      tier: 1,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      allCards: [truthT1NoTarget],
    });
    const next = Actions.chooseCardType('truth')(state);
    expect(next.currentCard?.hasTarget).toBe(false);
    expect(next.currentTargetPlayerId).toBeNull();
  });

  it('when only one possible target (tier 1, 2 players): sets currentTargetPlayerId to the other player', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const state = makeState({
        tier: 1,
        currentPlayerIndex: 0,
        players: [p1T1, p2T1],
        allCards: [truthT1WithTarget],
      });
      const next = Actions.chooseCardType('truth')(state);
      // With 2 players at tier 1, the only eligible target is the other player
      expect(next.currentTargetPlayerId).toBe('p2');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('no eligible target (two hetero males tier 3): currentTargetPlayerId null, card hasTarget=false', () => {
    const state = makeState({
      tier: 3,
      players: [heteroMale, heteroMale2],
      currentPlayerIndex: 0,
      // Only a no-target card is available
      allCards: [truthT3NoTarget],
    });
    const next = Actions.chooseCardType('truth')(state);
    expect(next.currentTargetPlayerId).toBeNull();
    expect(next.currentCard?.hasTarget).toBe(false);
  });
});

// ─── Actions.acceptCard ──────────────────────────────────────────────────────

describe('Actions.acceptCard', () => {
  it('phase becomes game-selecting', () => {
    const state = makeState({ phase: 'game-showing' });
    const next = Actions.acceptCard()(state);
    expect(next.phase).toBe('game-selecting');
  });

  it('currentPlayerIndex advances by 1', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.acceptCard()(state);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it('wraps around: last player (index=players.length-1) → index becomes 0', () => {
    const state = makeState({
      players: [p1T1, p2T1, p3T1],
      currentPlayerIndex: 2,
    });
    const next = Actions.acceptCard()(state);
    expect(next.currentPlayerIndex).toBe(0);
  });

  it('currentCard becomes null', () => {
    const state = makeState({ currentCard: truthT1NoTarget });
    const next = Actions.acceptCard()(state);
    expect(next.currentCard).toBeNull();
  });

  it('currentTargetPlayerId becomes null', () => {
    const state = makeState({ currentTargetPlayerId: 'p2' });
    const next = Actions.acceptCard()(state);
    expect(next.currentTargetPlayerId).toBeNull();
  });
});

// ─── Actions.refuseCard ──────────────────────────────────────────────────────

describe('Actions.refuseCard', () => {
  it('when penaltiesEnabled=true: showingPenalty becomes true, phase stays game-showing', () => {
    const state = makeState({
      penaltiesEnabled: true,
      phase: 'game-showing',
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.refuseCard()(state);
    expect(next.showingPenalty).toBe(true);
    expect(next.phase).toBe('game-showing');
  });

  it('when penaltiesEnabled=true: currentPlayerIndex does NOT advance yet', () => {
    const state = makeState({
      penaltiesEnabled: true,
      phase: 'game-showing',
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.refuseCard()(state);
    expect(next.currentPlayerIndex).toBe(0);
  });

  it('when penaltiesEnabled=false: phase becomes game-selecting, index advances', () => {
    const state = makeState({
      penaltiesEnabled: false,
      phase: 'game-showing',
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.refuseCard()(state);
    expect(next.phase).toBe('game-selecting');
    expect(next.currentPlayerIndex).toBe(1);
  });

  it('when penaltiesEnabled=false: currentCard becomes null', () => {
    const state = makeState({
      penaltiesEnabled: false,
      phase: 'game-showing',
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentCard: truthT1NoTarget,
    });
    const next = Actions.refuseCard()(state);
    expect(next.currentCard).toBeNull();
  });
});

// ─── Actions.confirmPenalty ──────────────────────────────────────────────────

describe('Actions.confirmPenalty', () => {
  it('records shots for the active player in shotCounts', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      shotCounts: {},
    });
    const next = Actions.confirmPenalty(3)(state);
    expect(next.shotCounts).toEqual({ p1: 3 });
  });

  it('accumulates shots on top of existing count', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      shotCounts: { p1: 2 },
    });
    const next = Actions.confirmPenalty(3)(state);
    expect(next.shotCounts).toEqual({ p1: 5 });
  });

  it('phase becomes game-selecting', () => {
    const state = makeState({
      phase: 'game-showing',
      players: [p1T1, p2T1],
    });
    const next = Actions.confirmPenalty(1)(state);
    expect(next.phase).toBe('game-selecting');
  });

  it('currentPlayerIndex advances', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.confirmPenalty(1)(state);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it('currentCard becomes null', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentCard: truthT1NoTarget,
    });
    const next = Actions.confirmPenalty(1)(state);
    expect(next.currentCard).toBeNull();
  });

  it('showingPenalty becomes false', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      showingPenalty: true,
    });
    const next = Actions.confirmPenalty(1)(state);
    expect(next.showingPenalty).toBe(false);
  });

  it('when shots=0: shotCounts NOT modified (same reference)', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      shotCounts: { p1: 3 },
    });
    const next = Actions.confirmPenalty(0)(state);
    expect(next.shotCounts).toBe(state.shotCounts);
  });

  it('wraps index around correctly', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 1,
    });
    const next = Actions.confirmPenalty(0)(state);
    expect(next.currentPlayerIndex).toBe(0);
  });
});

// ─── Actions.endGame ─────────────────────────────────────────────────────────

describe('Actions.endGame', () => {
  it('when penaltiesEnabled=false: resets to initial state (phase=home)', () => {
    const state = makeState({
      phase: 'game-showing',
      penaltiesEnabled: false,
      shotCounts: {},
      players: [p1T1],
      theme: 'dark',
    });
    const next = Actions.endGame()(state);
    expect(next.phase).toBe('home');
    expect(next.players).toEqual([]);
    expect(next.shotCounts).toEqual({});
  });

  it('when penaltiesEnabled=true but shotCounts is empty: resets to initial state', () => {
    const state = makeState({
      phase: 'game-showing',
      penaltiesEnabled: true,
      shotCounts: {},
      players: [p1T1],
    });
    const next = Actions.endGame()(state);
    expect(next.phase).toBe('home');
  });

  it('when penaltiesEnabled=true and at least one player has shots>0: phase becomes ranking', () => {
    const state = makeState({
      phase: 'game-showing',
      penaltiesEnabled: true,
      shotCounts: { p1: 3 },
    });
    const next = Actions.endGame()(state);
    expect(next.phase).toBe('ranking');
  });

  it('when going to ranking: shotCounts are preserved', () => {
    const state = makeState({
      phase: 'game-showing',
      penaltiesEnabled: true,
      shotCounts: { p1: 3, p2: 1 },
    });
    const next = Actions.endGame()(state);
    expect(next.shotCounts).toEqual({ p1: 3, p2: 1 });
  });

  it('theme is preserved after reset', () => {
    const state = makeState({
      phase: 'game-showing',
      penaltiesEnabled: false,
      theme: 'dark-ocean',
    });
    const next = Actions.endGame()(state);
    expect(next.theme).toBe('dark-ocean');
  });
});

// ─── Actions.confirmEndGame ──────────────────────────────────────────────────

describe('Actions.confirmEndGame', () => {
  it('always resets to initial state (phase=home) regardless of shotCounts', () => {
    const state = makeState({
      phase: 'ranking',
      penaltiesEnabled: true,
      shotCounts: { p1: 5 },
      theme: 'dark',
    });
    const next = Actions.confirmEndGame()(state);
    expect(next.phase).toBe('home');
    expect(next.shotCounts).toEqual({});
  });

  it('theme is preserved', () => {
    const state = makeState({
      phase: 'ranking',
      theme: 'dark-ocean',
    });
    const next = Actions.confirmEndGame()(state);
    expect(next.theme).toBe('dark-ocean');
  });
});

// ─── Round Tracker ──────────────────────────────────────────────────────────

describe('Round Tracker — initial state', () => {
  it('currentRound starts at 1', () => {
    const state = buildInitialState(mockCards);
    expect(state.currentRound).toBe(1);
  });

  it('activeEffects starts empty', () => {
    const state = buildInitialState(mockCards);
    expect(state.activeEffects).toEqual([]);
  });

  it('pendingRoundExpiry starts empty', () => {
    const state = buildInitialState(mockCards);
    expect(state.pendingRoundExpiry).toEqual([]);
  });
});

describe('Round Tracker — Actions.startGame resets round fields', () => {
  it('resets currentRound to 1', () => {
    const state = makeState({ currentRound: 5 });
    const next = Actions.startGame()(state);
    expect(next.currentRound).toBe(1);
  });

  it('resets activeEffects to []', () => {
    const effect = {
      cardId: 11,
      cardText: 'some effect',
      playerId: 'p1',
      triggerRound: 1,
      targetRound: 3,
    };
    const state = makeState({ activeEffects: [effect] });
    const next = Actions.startGame()(state);
    expect(next.activeEffects).toEqual([]);
  });

  it('resets pendingRoundExpiry to []', () => {
    const effect = {
      cardId: 11,
      cardText: 'some effect',
      playerId: 'p1',
      triggerRound: 1,
      targetRound: 3,
    };
    const state = makeState({ pendingRoundExpiry: [effect] });
    const next = Actions.startGame()(state);
    expect(next.pendingRoundExpiry).toEqual([]);
  });
});

describe('Round Tracker — currentRound increments on wrap-around', () => {
  it('does NOT increment when advancing to player index 1 (no wrap)', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentRound: 1,
    });
    const next = Actions.acceptCard()(state);
    expect(next.currentRound).toBe(1);
  });

  it('increments by 1 when the last player advances (wraps to index 0)', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 1,
      currentRound: 1,
    });
    const next = Actions.acceptCard()(state);
    expect(next.currentRound).toBe(2);
  });

  it('increments also on refuseCard (no penalties) when last player wraps', () => {
    const state = makeState({
      penaltiesEnabled: false,
      players: [p1T1, p2T1],
      currentPlayerIndex: 1,
      currentRound: 3,
    });
    const next = Actions.refuseCard()(state);
    expect(next.currentRound).toBe(4);
  });

  it('increments also on confirmPenalty when last player wraps', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 1,
      currentRound: 2,
      showingPenalty: true,
    });
    const next = Actions.confirmPenalty(1)(state);
    expect(next.currentRound).toBe(3);
  });
});

describe('Round Tracker — acceptCard registers a round effect', () => {
  it('adds a RoundEffect to activeEffects when card hasRounds=true', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentRound: 1,
      currentCard: dareT1WithRounds,
      activeEffects: [],
    });
    const next = Actions.acceptCard()(state);
    expect(next.activeEffects).toHaveLength(1);
    expect(next.activeEffects[0]).toMatchObject({
      cardId: dareT1WithRounds.id,
      cardText: dareT1WithRounds.rawText,
      playerId: p1T1.id,
      triggerRound: 1,
      targetRound: 3, // triggerRound(1) + roundsCount(2)
    });
  });

  it('does NOT add an effect when card hasRounds=false', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentCard: truthT1NoTarget,
      activeEffects: [],
    });
    const next = Actions.acceptCard()(state);
    expect(next.activeEffects).toHaveLength(0);
  });

  it('accumulates multiple effects from different turns', () => {
    const existingEffect = {
      cardId: 3,
      cardText: 'earlier effect',
      playerId: p2T1.id,
      triggerRound: 1,
      targetRound: 2,
    };
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentRound: 1,
      currentCard: dareT1WithRounds,
      activeEffects: [existingEffect],
    });
    const next = Actions.acceptCard()(state);
    expect(next.activeEffects).toHaveLength(2);
  });
});

describe('Round Tracker — pendingRoundExpiry is set when advancing to a player with expiring effects', () => {
  it('populates pendingRoundExpiry when next player has an effect reaching targetRound', () => {
    // p2 (index 1) has an effect expiring at round 2.
    // We are at index 0, round 1 → after advance: index=1, round still 1 (no wrap).
    // So the effect does NOT expire yet (targetRound=2 > newRound=1).
    // To trigger expiry: p1 (index 0) has an effect expiring at round 1,
    // and we advance from last player (index=1) so newRound=2, then next=index 0.
    const expiringEffect = {
      cardId: 11,
      cardText: 'effect for p1',
      playerId: p1T1.id,
      triggerRound: 1,
      targetRound: 2,
    };
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 1, // last player → wraps to 0, newRound=2
      currentRound: 1,
      activeEffects: [expiringEffect],
    });
    const next = Actions.acceptCard()(state);
    expect(next.pendingRoundExpiry).toHaveLength(1);
    expect(next.pendingRoundExpiry[0]).toMatchObject({
      cardId: 11,
      playerId: p1T1.id,
      targetRound: 2,
    });
  });

  it('pendingRoundExpiry is empty when no effects expire on the next player', () => {
    const futureEffect = {
      cardId: 11,
      cardText: 'future effect',
      playerId: p2T1.id,
      triggerRound: 1,
      targetRound: 5,
    };
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentRound: 1,
      activeEffects: [futureEffect],
    });
    const next = Actions.acceptCard()(state);
    expect(next.pendingRoundExpiry).toHaveLength(0);
  });
});

describe('Round Tracker — Actions.acknowledgeRoundExpiry', () => {
  it('removes expired effects from activeEffects', () => {
    const expiredEffect = {
      cardId: 11,
      cardText: 'expired',
      playerId: p1T1.id,
      triggerRound: 1,
      targetRound: 2,
    };
    const ongoingEffect = {
      cardId: 3,
      cardText: 'ongoing',
      playerId: p2T1.id,
      triggerRound: 1,
      targetRound: 5,
    };
    const state = makeState({
      activeEffects: [expiredEffect, ongoingEffect],
      pendingRoundExpiry: [expiredEffect],
    });
    const next = Actions.acknowledgeRoundExpiry()(state);
    expect(next.activeEffects).toHaveLength(1);
    expect(next.activeEffects[0]).toMatchObject({ cardId: 3 });
  });

  it('clears pendingRoundExpiry to []', () => {
    const expiredEffect = {
      cardId: 11,
      cardText: 'expired',
      playerId: p1T1.id,
      triggerRound: 1,
      targetRound: 2,
    };
    const state = makeState({
      activeEffects: [expiredEffect],
      pendingRoundExpiry: [expiredEffect],
    });
    const next = Actions.acknowledgeRoundExpiry()(state);
    expect(next.pendingRoundExpiry).toEqual([]);
  });

  it('keeps effects that are NOT in pendingRoundExpiry', () => {
    const effectA = {
      cardId: 11,
      cardText: 'effect A',
      playerId: p1T1.id,
      triggerRound: 1,
      targetRound: 2,
    };
    const effectB = {
      cardId: 3,
      cardText: 'effect B',
      playerId: p1T1.id,
      triggerRound: 2,
      targetRound: 4,
    };
    const state = makeState({
      activeEffects: [effectA, effectB],
      pendingRoundExpiry: [effectA],
    });
    const next = Actions.acknowledgeRoundExpiry()(state);
    expect(next.activeEffects).toHaveLength(1);
    const [remaining] = next.activeEffects;
    expect(remaining?.cardId).toBe(3);
  });

  it('when pendingRoundExpiry is empty: activeEffects unchanged', () => {
    const activeEffect = {
      cardId: 11,
      cardText: 'ongoing',
      playerId: p1T1.id,
      triggerRound: 1,
      targetRound: 5,
    };
    const state = makeState({
      activeEffects: [activeEffect],
      pendingRoundExpiry: [],
    });
    const next = Actions.acknowledgeRoundExpiry()(state);
    expect(next.activeEffects).toEqual([activeEffect]);
  });
});
