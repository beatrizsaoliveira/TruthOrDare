import type { GameStore } from '../state/store.js';
import type { GamePhase } from '../types/index.js';
import { createAgeGateScreen } from './screens/ageGateScreen.js';
import { createGameScreen } from './screens/gameScreen.js';
import { createHomeScreen } from './screens/homeScreen.js';
import { createRankingScreen } from './screens/rankingScreen.js';
import { createRosterScreen } from './screens/rosterScreen.js';
import { createSetupScreen } from './screens/setupScreen.js';

// ─── Screen registry ──────────────────────────────────────────────────────────

type ScreenFactory = (store: GameStore) => HTMLElement;

const SCREENS: Partial<Record<GamePhase, ScreenFactory>> = {
  home: createHomeScreen,
  'age-gate': createAgeGateScreen,
  'player-roster': createRosterScreen,
  setup: createSetupScreen,
  'game-selecting': createGameScreen,
  'game-showing': createGameScreen,
  ranking: createRankingScreen,
};

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Replaces the content of `container` with the screen that corresponds to
 * `store.state.phase`, then transfers focus to the first interactive element
 * for accessibility.
 */
export function renderScreen(container: HTMLElement, store: GameStore): void {
  const { phase, theme } = store.state;

  // Sync the data-theme attribute on the root element
  document.documentElement.dataset['theme'] = theme;

  const factory = SCREENS[phase];
  if (!factory) {
    container.innerHTML = `<div style="padding:2rem;text-align:center">Unknown phase: ${phase}</div>`;
    return;
  }

  // Full replace (no DOM diffing needed — game phases are distinct screens)
  container.innerHTML = '';
  const screen = factory(store);
  container.appendChild(screen);

  // Move focus to the first focusable element for keyboard/screen-reader users
  const firstFocusable = container.querySelector<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  firstFocusable?.focus({ preventScroll: false });
}
