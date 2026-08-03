import type { GameStore } from '../../state/store.js';
import { Actions } from '../../state/store.js';
import type { Player } from '../../types/index.js';
import { createGitHubLink, el } from '../domHelpers.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export function createRankingScreen(store: GameStore): HTMLElement {
  const { players, shotCounts } = store.state;

  const entries = [...players].map((p) => ({
    player: p,
    shots: shotCounts[p.id] ?? 0,
  }));

  // Players with shots > 0 sorted descending, then 0-shot players sorted alphabetically
  const withShots = entries.filter((e) => e.shots > 0).sort((a, b) => b.shots - a.shots);
  const withoutShots = entries
    .filter((e) => e.shots === 0)
    .sort((a, b) => a.player.name.localeCompare(b.player.name));
  const ranked = [...withShots, ...withoutShots];

  const screen = el('div', 'screen');

  // ── Header ────────────────────────────────────────────────
  const header = el('header', 'app-header');
  const logo = el('div', 'app-header__logo');
  logo.textContent = '🎲 Verdade ou Desafio';

  const actions = el('div', 'app-header__actions');
  actions.appendChild(createGitHubLink());

  header.append(logo, actions);

  // ── Main ──────────────────────────────────────────────────
  const main = el('main', 'screen-body');
  main.style.cssText = 'padding-top: 1.5rem;';

  const container = el('div', 'container stack stack--6 text-center');

  const title = el('h1', 'heading-xl gradient-text');
  title.textContent = 'Ranking dos mais bêbados';
  const emoji = document.createElement('span');
  emoji.textContent = ' 🍺';
  emoji.style.cssText = '-webkit-text-fill-color: initial;';
  title.appendChild(emoji);

  const subtitle = el('p', 'body-lg text-muted');
  subtitle.textContent = 'Shots consumidos durante o jogo';

  container.append(title, subtitle);

  // ── Ranking list ──────────────────────────────────────────
  const list = el('ol', 'ranking-list');
  list.setAttribute('aria-label', 'Ranking de shots');

  ranked.forEach((entry, i) => {
    // Pass the 0-based index to buildRankingItem for medal/position logic
    const medalIndex = i;
    const item = buildRankingItem(entry.player, entry.shots, medalIndex);
    list.appendChild(item);
  });

  container.appendChild(list);
  main.appendChild(container);

  // ── Footer ────────────────────────────────────────────────
  const footer = el('footer', 'container pb-safe');
  footer.style.cssText = 'padding-top: 1.5rem; padding-bottom: var(--dock-clearance);';

  const homeBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--full btn--lg');
  homeBtn.textContent = '🏠  Voltar ao Início';
  homeBtn.setAttribute('aria-label', 'Voltar ao ecrã inicial');
  homeBtn.addEventListener('click', () => store.update(Actions.confirmEndGame()));

  footer.appendChild(homeBtn);

  screen.append(header, main, footer);
  return screen;
}

// ─── Ranking item ─────────────────────────────────────────────────────────────

function buildRankingItem(player: Player, shots: number, index: number): HTMLElement {
  const item = el('li', 'ranking-item');
  if (shots > 0 && index === 0) item.classList.add('ranking-item--first');

  const medal = el('span', 'ranking-item__medal');
  medal.setAttribute('aria-hidden', 'true');
  medal.textContent = shots > 0 && index < 3 ? (MEDALS[index] ?? `${index + 1}º`) : `${index + 1}º`;

  const name = el('span', 'ranking-item__name');
  name.textContent = player.name;

  const shotsEl = el('span', 'ranking-item__shots');
  shotsEl.setAttribute('aria-label', `${shots} shot${shots === 1 ? '' : 's'}`);
  shotsEl.textContent = `${shots} shot${shots === 1 ? '' : 's'}`;

  item.append(medal, name, shotsEl);
  return item;
}
