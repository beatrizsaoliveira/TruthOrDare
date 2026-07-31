import { beforeEach, describe, expect, it } from 'vitest';
import { GameStore } from '../../state/store';
import type { Player } from '../../types/index.js';
import { createRankingScreen } from '../../ui/screens/rankingScreen';
import { mockCards } from '../fixtures/cards';

function makeStore(players: Player[], shotCounts: Record<string, number>): GameStore {
  const store = new GameStore(mockCards);
  store.update((s) => ({ ...s, players, shotCounts }));
  return store;
}

function names(screen: HTMLElement): string[] {
  return [...screen.querySelectorAll('.ranking-item__name')].map((n) => n.textContent ?? '');
}

function medals(screen: HTMLElement): (string | null)[] {
  return [...screen.querySelectorAll('.ranking-item__medal')].map((m) => m.textContent);
}

beforeEach(() => {
  localStorage.clear();
});

describe('createRankingScreen', () => {
  it('sorts players with shots in descending order', () => {
    const store = makeStore(
      [
        { id: 'a', name: 'Ana' },
        { id: 'b', name: 'Bruno' },
        { id: 'c', name: 'Carla' },
      ],
      { a: 3, b: 5, c: 1 },
    );
    const screen = createRankingScreen(store);
    expect(names(screen)).toEqual(['Bruno', 'Ana', 'Carla']);
  });

  it('places 0-shot players alphabetically AFTER players with shots', () => {
    const store = makeStore(
      [
        { id: 'a', name: 'Zé' },
        { id: 'b', name: 'Ana' },
        { id: 'c', name: 'Bruno' },
      ],
      { c: 4 },
    );
    const screen = createRankingScreen(store);
    expect(names(screen)).toEqual(['Bruno', 'Ana', 'Zé']);
  });

  it('sorts all 0-shot players alphabetically', () => {
    const store = makeStore(
      [
        { id: 'a', name: 'Zé' },
        { id: 'b', name: 'Ana' },
        { id: 'c', name: 'Bruno' },
      ],
      {},
    );
    const screen = createRankingScreen(store);
    expect(names(screen)).toEqual(['Ana', 'Bruno', 'Zé']);
  });

  it('gives the top 3 players with shots the medals 🥇🥈🥉 and 0-shot players a position number', () => {
    const store = makeStore(
      [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
        { id: 'd', name: 'D' },
      ],
      { a: 1, b: 3, c: 2, d: 0 },
    );
    const screen = createRankingScreen(store);
    expect(medals(screen)).toEqual(['🥇', '🥈', '🥉', '4º']);
  });

  it('a 4th player WITH shots also gets a position number, not a medal', () => {
    const store = makeStore(
      [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
        { id: 'd', name: 'D' },
      ],
      { a: 4, b: 3, c: 2, d: 1 },
    );
    const screen = createRankingScreen(store);
    expect(medals(screen)).toEqual(['🥇', '🥈', '🥉', '4º']);
  });

  it('marks only the top player with shots using ranking-item--first', () => {
    const store = makeStore(
      [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      { a: 2, b: 1 },
    );
    const screen = createRankingScreen(store);
    const first = screen.querySelector('.ranking-item--first');
    expect(first).not.toBeNull();
    expect(first?.querySelector('.ranking-item__name')?.textContent).toBe('A');
  });

  it('renders the shots count with correct singular/plural form', () => {
    const store = makeStore([{ id: 'a', name: 'Ana' }], { a: 3 });
    const screen = createRankingScreen(store);
    expect(screen.querySelector('.ranking-item__shots')?.textContent).toBe('3 shots');
  });
});
