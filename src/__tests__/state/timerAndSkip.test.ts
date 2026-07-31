import { describe, expect, it } from 'vitest';
import { Actions, buildInitialState } from '../../state/store';
import type { GameState } from '../../types/index.js';
import {
  dareT1NoTarget,
  dareT3TimedRounds,
  dareT3TimerSeconds1,
  dareT3TimerSeconds60,
  dareT3WithTimer,
  dareT3WithTimerOver60,
  mockCards,
  truthT1NoTarget,
} from '../fixtures/cards';
import { p1T1, p2T1, p3T1 } from '../fixtures/players';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(overrides?: Partial<GameState>): GameState {
  return {
    ...buildInitialState(mockCards),
    theme: 'light',
    ...overrides,
  };
}

// ─── Actions.acceptCard — timer phase ─────────────────────────────────────────

describe('Actions.acceptCard — timer phase', () => {
  it('transitions to game-timer when the current card has a timer of 1-60s', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentCard: dareT3WithTimer,
    });
    const next = Actions.acceptCard()(state);
    expect(next.phase).toBe('game-timer');
    expect(next.timerRunning).toBe(false);
  });

  it('timerSeconds=1 is a valid boundary for entering the timer phase', () => {
    const state = makeState({ currentCard: dareT3TimerSeconds1 });
    expect(Actions.acceptCard()(state).phase).toBe('game-timer');
  });

  it('timerSeconds=60 is a valid boundary for entering the timer phase', () => {
    const state = makeState({ currentCard: dareT3TimerSeconds60 });
    expect(Actions.acceptCard()(state).phase).toBe('game-timer');
  });

  it('does NOT enter the timer phase when timerSeconds > 60 — advances instead', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentCard: dareT3WithTimerOver60,
    });
    const next = Actions.acceptCard()(state);
    expect(next.phase).toBe('game-selecting');
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.timerRunning).toBe(false);
  });

  it('does NOT enter the timer phase when timerSeconds is null', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentCard: truthT1NoTarget,
    });
    expect(Actions.acceptCard()(state).phase).toBe('game-selecting');
  });

  it('registers a round effect AND goes to the timer phase for a timed round-based dare', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
      currentRound: 1,
      currentCard: dareT3TimedRounds,
    });
    const next = Actions.acceptCard()(state);
    expect(next.phase).toBe('game-timer');
    expect(next.activeEffects).toHaveLength(1);
    expect(next.activeEffects[0]!.playerId).toBe('p1');
    expect(next.activeEffects[0]!.targetRound).toBe(3); // 1 + roundsCount(2)
  });
});

// ─── Actions.skipPlayer ──────────────────────────────────────────────────────

describe('Actions.skipPlayer', () => {
  it('advances currentPlayerIndex by 1 without assigning a card', () => {
    const state = makeState({
      players: [p1T1, p2T1, p3T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.skipPlayer()(state);
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.currentCard).toBeNull();
  });

  it('wraps to index 0 and increments currentRound on the last player', () => {
    const state = makeState({
      players: [p1T1, p2T1, p3T1],
      currentPlayerIndex: 2,
      currentRound: 2,
    });
    const next = Actions.skipPlayer()(state);
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.currentRound).toBe(3);
  });

  it('does NOT increment currentRound when not wrapping around', () => {
    const state = makeState({
      players: [p1T1, p2T1, p3T1],
      currentPlayerIndex: 1,
      currentRound: 5,
    });
    expect(Actions.skipPlayer()(state).currentRound).toBe(5);
  });

  it('clears currentCard, pendingCardType and currentTargetPlayerId', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      currentCard: dareT1NoTarget,
      pendingCardType: 'dare',
      currentTargetPlayerId: 'p2',
    });
    const next = Actions.skipPlayer()(state);
    expect(next.currentCard).toBeNull();
    expect(next.pendingCardType).toBeNull();
    expect(next.currentTargetPlayerId).toBeNull();
  });

  it('returns to game-selecting and clears showingPenalty', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      phase: 'game-showing',
      showingPenalty: true,
    });
    const next = Actions.skipPlayer()(state);
    expect(next.phase).toBe('game-selecting');
    expect(next.showingPenalty).toBe(false);
  });

  it('does NOT record any shots for the skipped player', () => {
    const state = makeState({
      players: [p1T1, p2T1],
      shotCounts: { p1: 2 },
    });
    expect(Actions.skipPlayer()(state).shotCounts).toEqual({ p1: 2 });
  });
});

// ─── Actions.startTimer ───────────────────────────────────────────────────────

describe('Actions.startTimer', () => {
  it('sets timerRunning to true', () => {
    const state = makeState({ timerRunning: false });
    expect(Actions.startTimer()(state).timerRunning).toBe(true);
  });

  it('leaves the phase unchanged', () => {
    const state = makeState({ phase: 'game-timer' });
    expect(Actions.startTimer()(state).phase).toBe('game-timer');
  });
});

// ─── Actions.refuseTimer ─────────────────────────────────────────────────────

describe('Actions.refuseTimer', () => {
  it('with penalties enabled: shows the penalty overlay without advancing', () => {
    const state = makeState({
      penaltiesEnabled: true,
      phase: 'game-timer',
      timerRunning: true,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.refuseTimer()(state);
    expect(next.phase).toBe('game-showing');
    expect(next.showingPenalty).toBe(true);
    expect(next.timerRunning).toBe(false);
    expect(next.currentPlayerIndex).toBe(0);
  });

  it('with penalties disabled: advances to the next player', () => {
    const state = makeState({
      penaltiesEnabled: false,
      phase: 'game-timer',
      timerRunning: true,
      players: [p1T1, p2T1],
      currentPlayerIndex: 0,
    });
    const next = Actions.refuseTimer()(state);
    expect(next.phase).toBe('game-selecting');
    expect(next.timerRunning).toBe(false);
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.currentCard).toBeNull();
  });
});

// ─── Actions.completeTimer ───────────────────────────────────────────────────

describe('Actions.completeTimer', () => {
  it('advances to the next player and returns to game-selecting', () => {
    const state = makeState({
      phase: 'game-timer',
      timerRunning: true,
      players: [p1T1, p2T1, p3T1],
      currentPlayerIndex: 1,
    });
    const next = Actions.completeTimer()(state);
    expect(next.phase).toBe('game-selecting');
    expect(next.timerRunning).toBe(false);
    expect(next.currentPlayerIndex).toBe(2);
    expect(next.currentCard).toBeNull();
  });

  it('wraps to index 0 and increments the round on the last player', () => {
    const state = makeState({
      phase: 'game-timer',
      timerRunning: true,
      players: [p1T1, p2T1],
      currentPlayerIndex: 1,
      currentRound: 1,
    });
    const next = Actions.completeTimer()(state);
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.currentRound).toBe(2);
  });
});
