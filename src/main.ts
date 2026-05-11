import { loadCards } from './engine/markdownParser.js';
import { GameStore } from './state/store.js';
import './styles/main.css';
import { renderScreen } from './ui/router.js';
import { createSettingsPanel } from './ui/settingsPanel.js';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function main(): void {
  // 1. Load the static JSON dataset into Card objects once at startup
  const allCards = loadCards();

  if (allCards.length === 0) {
    const appEl2 = document.getElementById('app');
    if (appEl2)
      appEl2.innerHTML =
        '<p style="padding:2rem;color:red">⚠️ Failed to parse dataset.md — no cards found.</p>';
    return;
  }

  // 2. Initialise the reactive store (restores persisted state if available)
  const store = new GameStore(allCards);

  // 3. Inject the persistent settings panel (survives screen changes)
  createSettingsPanel(store);

  // 3. Sync initial theme from stored state / OS preference
  document.documentElement.dataset['theme'] = store.state.theme;

  // 4. Get the app container
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('#app element not found in DOM');

  // 5. Render the current screen whenever state changes
  store.subscribe(() => renderScreen(appEl, store));

  // 6. Initial render
  renderScreen(appEl, store);
}

// Run after the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
