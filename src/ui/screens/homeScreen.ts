import type { GameStore } from '../../state/store.js';
import { Actions } from '../../state/store.js';
import { TIER_META } from '../../types/index.js';

/**
 * Home screen — tier selection grid.
 * This is the root entry point of the game UI.
 */
export function createHomeScreen(store: GameStore): HTMLElement {
  const screen = el('div', 'screen');

  // ── Header ────────────────────────────────────────────────
  const header = el('header', 'app-header');

  const logo = el('div', 'app-header__logo');
  logo.textContent = '🎲 Truth or Dare';

  header.appendChild(logo);

  // ── Hero ────────────────────────────────────────────────────
  const main = el('main', 'screen-body');
  main.style.cssText = 'padding: 1.5rem 0 3rem;';

  const container = el('div', 'container stack stack--7');

  const heroSection = el('div', 'stack stack--3 text-center');
  heroSection.style.cssText = 'padding: 1.5rem 0 .5rem;';

  const heroTitle = el('h1', 'heading-xl gradient-text');
  heroTitle.textContent = 'Truth or Dare';

  const heroSub = el('p', 'body-lg text-muted');
  heroSub.textContent = 'Escolhe o nível e começa o jogo. Ousadia garantida.';

  heroSection.append(heroTitle, heroSub);

  // ── Tier grid ─────────────────────────────────────────────
  const tierSection = el('section', 'stack stack--3');
  const tierTitle = el('h2', 'heading-sm text-muted label');
  tierTitle.textContent = 'Seleciona o nível de jogo';
  tierTitle.setAttribute('id', 'tier-heading');

  const grid = el('div', 'tier-grid');
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-labelledby', 'tier-heading');

  for (const meta of TIER_META) {
    const card = buildTierCard(meta, () => {
      store.update(Actions.selectTier(meta.tier));
    });
    grid.appendChild(card);
  }

  tierSection.append(tierTitle, grid);
  container.append(heroSection, tierSection);
  main.appendChild(container);

  screen.append(header, main);
  return screen;
}

// ─── Tier card ────────────────────────────────────────────────────────────────

function buildTierCard(meta: (typeof TIER_META)[number], onClick: () => void): HTMLElement {
  const card = el<HTMLButtonElement>('button', 'card card--tier');
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `Tier ${meta.tier}: ${meta.label}`);
  card.style.textAlign = 'left';

  // Gradient background layer
  const bg = el('div', 'card--tier__bg');
  bg.style.background = meta.gradient;

  // Content
  const content = el('div', 'card--tier__content stack stack--2');

  const emoji = el('span', 'card--tier__emoji');
  emoji.setAttribute('aria-hidden', 'true');
  emoji.textContent = meta.emoji;

  const tierLabel = el('div', 'card--tier__label');
  tierLabel.textContent = `Tier ${meta.tier} · ${meta.label}`;

  const sub = el('div', 'card--tier__subtitle');
  sub.textContent = meta.subtitle;

  content.append(emoji, tierLabel, sub);

  if (meta.restricted) {
    const badge = el('span', 'card--tier__badge');
    badge.innerHTML = '🔞 &nbsp;Maiores de 18';
    content.appendChild(badge);
  }

  card.append(bg, content);
  card.addEventListener('click', onClick);
  return card;
}

// ─── Tiny DOM helper ─────────────────────────────────────────────────────────

function el<T extends HTMLElement = HTMLDivElement>(tag: string, className?: string): T {
  const e = document.createElement(tag) as T;
  if (className) e.className = className;
  return e;
}
