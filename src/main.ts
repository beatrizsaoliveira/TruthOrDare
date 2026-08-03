import { loadCards } from './engine/datasetLoader.js';
import { initGlassDistortion } from './engine/glassDistortion.js';
import { GameStore } from './state/store.js';
import './styles/main.css';
import { getPaletteId, PALETTE_COLOURS } from './theme.js';
import { renderScreen } from './ui/router.js';
import { createSettingsPanel, initGlassState } from './ui/settingsPanel.js';

// ─── tsParticles CDN type shim ────────────────────────────────────────────────
declare const tsParticles:
  | {
      load: (id: string, config: unknown) => Promise<unknown>;
    }
  | undefined;

let particlesContainer: { destroy: () => void } | null = null;

async function startParticles(theme: string): Promise<void> {
  if (typeof tsParticles === 'undefined') return;
  if (particlesContainer) {
    particlesContainer.destroy();
    particlesContainer = null;
  }
  const colours = PALETTE_COLOURS[getPaletteId(theme)] ?? PALETTE_COLOURS.violet;
  const container = (await tsParticles.load('particles-bg', {
    background: { opacity: 0 },
    fpsLimit: 30,
    particles: {
      number: { value: 14 },
      color: { value: colours },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.05, max: 0.18 },
        animation: { enable: true, speed: 0.4, sync: false },
      },
      size: { value: { min: 60, max: 200 } },
      move: {
        enable: true,
        speed: { min: 0.3, max: 0.9 },
        direction: 'none',
        random: true,
        outModes: { default: 'out' },
      },
    },
    interactivity: {
      events: { onHover: { enable: false }, onClick: { enable: false } },
    },
    detectRetina: true,
  })) as { destroy: () => void } | null;
  if (container) particlesContainer = container;
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function main(): void {
  // 1. Load the static JSON dataset into Card objects once at startup
  const allCards = loadCards();

  if (allCards.length === 0) {
    const appEl2 = document.getElementById('app');
    if (appEl2)
      appEl2.innerHTML =
        '<p style="padding:2rem;color:red">⚠️ Failed to parse dataset.json — no cards found.</p>';
    return;
  }

  // 2. Initialise the reactive store (restores persisted state if available)
  const store = new GameStore(allCards);

  // 3. Apply theme from store state (persisted or OS preference)
  document.documentElement.dataset.theme = store.state.theme;

  // 4. Apply frosted glass preference from localStorage
  initGlassState();

  // 5. Inject the persistent glass dock (settings panel)
  createSettingsPanel(store);

  // 6. Initialise physics-based glass displacement maps
  initGlassDistortion();

  // 6a. Start ambient particles (theme-aware)
  void startParticles(store.state.theme);

  // 7. Get the app container
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('#app element not found in DOM');

  // 8. Render the current screen on state changes; re-colour particles on theme switch
  let lastTheme = store.state.theme;
  let lastPhase = store.state.phase;
  let lastShowingPenalty = store.state.showingPenalty;
  let lastPendingRoundExpiry = store.state.pendingRoundExpiry.length;
  let lastTimerRunning = store.state.timerRunning;
  let lastPlayerIndex = store.state.currentPlayerIndex;
  store.subscribe(() => {
    if (store.state.theme !== lastTheme) {
      lastTheme = store.state.theme;
      void startParticles(store.state.theme);
    }
    const phaseChanged = store.state.phase !== lastPhase;
    const penaltyChanged = store.state.showingPenalty !== lastShowingPenalty;
    const expiryChanged = store.state.pendingRoundExpiry.length !== lastPendingRoundExpiry;
    const timerChanged = store.state.timerRunning !== lastTimerRunning;
    const playerChanged = store.state.currentPlayerIndex !== lastPlayerIndex;
    if (phaseChanged || penaltyChanged || expiryChanged || timerChanged || playerChanged) {
      lastPhase = store.state.phase;
      lastShowingPenalty = store.state.showingPenalty;
      lastPendingRoundExpiry = store.state.pendingRoundExpiry.length;
      lastTimerRunning = store.state.timerRunning;
      lastPlayerIndex = store.state.currentPlayerIndex;
      renderScreen(appEl, store);
    }
  });

  // 9. Initial render
  renderScreen(appEl, store);
}

// Run after the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// ─── PWA: reload when a new service worker takes control ─────────────────────
// vite-plugin-pwa (registerType: 'autoUpdate') calls skipWaiting() automatically
// once a new SW finishes installing. When it claims this client the
// 'controllerchange' event fires and we do a hard reload so the user always
// gets the latest version without having to manually close/reopen the app.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
