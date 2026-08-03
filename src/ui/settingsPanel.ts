import type { GameStore } from '../state/store.js';
import { Actions } from '../state/store.js';
import { flipThemeMode, getThemeMode, getThemePalette, PALETTES } from '../theme.js';
import type { Theme } from '../types/index.js';

// ─── LocalStorage key for frosted glass preference ────────────────────────────
const GLASS_KEY = 'tod_glass';

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * Injects the persistent glass dock + themes menu + settings menu + wiki modal
 * into document.body. Called once at app startup; survives screen transitions.
 */
export function createSettingsPanel(store: GameStore): void {
  // ── Glass dock ─────────────────────────────────────────────
  const dock = buildDock();
  document.body.appendChild(dock);

  // ── Themes menu ────────────────────────────────────────────
  const { menu: themesMenu, updateThemeRows } = buildThemesMenu(store);
  document.body.appendChild(themesMenu);

  // ── Platform menu (settings / definições) ──────────────────
  const { menu: settingsMenu, frostedToggle, darkToggle, darkIconSvg } = buildSettingsMenu(store);
  document.body.appendChild(settingsMenu);

  // ── Wiki modal ─────────────────────────────────────────────
  const { modal, openModal, closeModal } = buildWikiModal();
  document.body.appendChild(modal);

  // ── Wire buttons ───────────────────────────────────────────
  const btnThemes = dock.querySelector<HTMLButtonElement>('#btn-themes');
  const btnSettings = dock.querySelector<HTMLButtonElement>('#btn-settings');

  function closeThemesMenu(): void {
    themesMenu.classList.remove('visible');
    btnThemes?.setAttribute('aria-expanded', 'false');
  }

  function closeSettingsMenu(): void {
    settingsMenu.classList.remove('visible');
    btnSettings?.setAttribute('aria-expanded', 'false');
  }

  btnThemes?.addEventListener('click', () => {
    const isOpen = themesMenu.classList.contains('visible');
    closeSettingsMenu();
    if (isOpen) {
      closeThemesMenu();
    } else {
      themesMenu.classList.add('visible');
      btnThemes.setAttribute('aria-expanded', 'true');
    }
  });

  btnSettings?.addEventListener('click', () => {
    const isOpen = settingsMenu.classList.contains('visible');
    closeThemesMenu();
    if (isOpen) {
      closeSettingsMenu();
    } else {
      settingsMenu.classList.add('visible');
      btnSettings.setAttribute('aria-expanded', 'true');
    }
  });

  // Wire wiki button inside settings menu
  const btnWikiInMenu = settingsMenu.querySelector<HTMLButtonElement>('#btn-wiki-in-settings');
  btnWikiInMenu?.addEventListener('click', () => {
    closeSettingsMenu();
    openModal();
  });

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (
      themesMenu.classList.contains('visible') &&
      !themesMenu.contains(target) &&
      !btnThemes?.contains(target)
    ) {
      closeThemesMenu();
    }
    if (
      settingsMenu.classList.contains('visible') &&
      !settingsMenu.contains(target) &&
      !btnSettings?.contains(target)
    ) {
      closeSettingsMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeThemesMenu();
      closeSettingsMenu();
      closeModal();
    }
  });

  // ── Sync dark toggle + theme buttons with store state ───────
  store.subscribe((state) => {
    const isDark = state.theme.startsWith('dark');
    if (darkToggle.getAttribute('aria-checked') !== String(isDark)) {
      darkToggle.setAttribute('aria-checked', String(isDark));
      animateLiquidToggle(darkToggle, isDark);
    }
    darkIconSvg.innerHTML = isDark ? SVG_SUN : SVG_MOON;
    updateThemeRows(state.theme);
  });

  // ── Dark mode toggle ───────────────────────────────────────
  darkToggle.addEventListener('click', () => {
    const current = darkToggle.getAttribute('aria-checked') === 'true';
    const next = !current;
    darkToggle.setAttribute('aria-checked', String(next));
    animateLiquidToggle(darkToggle, next);
    const newTheme = flipThemeMode(store.state.theme, next ? 'dark' : 'light');
    document.documentElement.dataset.theme = newTheme;
    store.update(Actions.setTheme(newTheme));
  });

  // ── Frosted glass toggle ───────────────────────────────────
  frostedToggle.addEventListener('click', () => {
    const current = frostedToggle.getAttribute('aria-checked') === 'true';
    const next = !current;
    frostedToggle.setAttribute('aria-checked', String(next));
    animateLiquidToggle(frostedToggle, next);
    if (next) {
      document.documentElement.dataset.glass = 'frosted';
      localStorage.setItem(GLASS_KEY, 'frosted');
    } else {
      delete document.documentElement.dataset.glass;
      localStorage.removeItem(GLASS_KEY);
    }
  });
}

/** Read persisted glass preference and apply to <html>. Call on startup. */
export function initGlassState(): void {
  const saved = localStorage.getItem(GLASS_KEY);
  if (saved === 'frosted') {
    document.documentElement.dataset.glass = 'frosted';
  }
}

// ─── Glass Dock ──────────────────────────────────────────────────────────────

function buildDock(): HTMLElement {
  const dock = document.createElement('div');
  dock.id = 'glass-dock';
  dock.className = 'glass-dock';
  dock.setAttribute('role', 'toolbar');
  dock.setAttribute('aria-label', 'Barra de ações');

  dock.innerHTML = `
    <div class="glass-effect" aria-hidden="true"></div>
    <div class="glass-tint" aria-hidden="true"></div>
    <div class="glass-shine" aria-hidden="true"></div>
    <div class="glass-content">
      <button id="btn-themes" class="dock-btn has-menu"
        aria-label="Temas de cor" aria-expanded="false" aria-haspopup="true">
        <svg class="dock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <span class="dock-label">Temas</span>
      </button>
      <div class="dock-sep" aria-hidden="true"></div>
      <button id="btn-settings" class="dock-btn has-menu"
        aria-label="Definições" aria-expanded="false" aria-haspopup="true">
        <svg class="dock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/>
          <line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/>
          <line x1="9" y1="8" x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
        <span class="dock-label">Definições</span>
      </button>
    </div>
  `;

  return dock;
}

// ─── Themes Platform Menu ────────────────────────────────────────────────────

function buildThemesMenu(store: GameStore): {
  menu: HTMLElement;
  updateThemeRows: (theme: Theme) => void;
} {
  const menu = document.createElement('div');
  menu.id = 'menu-themes';
  menu.className = 'platform-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Temas');

  const content = document.createElement('div');
  content.className = 'platform-menu-content';

  const label = document.createElement('div');
  label.className = 'platform-menu-label';
  label.textContent = 'Paleta de cor';
  content.appendChild(label);

  const paletteRows: { btn: HTMLButtonElement; id: string }[] = [];

  PALETTES.forEach(({ id, label: palLabel, desc, swatch }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-row';
    btn.dataset.palette = id;
    const isActive = getThemePalette(store.state.theme) === id;
    if (isActive) btn.classList.add('palette-row--active');
    btn.innerHTML = `
      <span class="palette-row-dot" style="background:${swatch}" aria-hidden="true"></span>
      <span class="palette-row-text">
        <span class="palette-row-name">${palLabel}</span>
        <span class="palette-row-desc">${desc}</span>
      </span>
      <svg class="palette-row-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
    btn.addEventListener('click', () => {
      const mode = getThemeMode(store.state.theme);
      const newTheme: Theme = id === 'violet' ? mode : (`${mode}-${id}` as Theme);
      document.documentElement.dataset.theme = newTheme;
      store.update(Actions.setTheme(newTheme));
    });
    content.appendChild(btn);
    paletteRows.push({ btn, id });
  });

  function updateThemeRows(theme: Theme): void {
    const palette = getThemePalette(theme);
    paletteRows.forEach(({ btn, id }) => {
      btn.classList.toggle('palette-row--active', id === palette);
    });
  }

  menu.innerHTML = `
    <div class="glass-effect" aria-hidden="true"></div>
    <div class="glass-tint" aria-hidden="true"></div>
    <div class="glass-shine" aria-hidden="true"></div>
  `;
  menu.appendChild(content);

  return { menu, updateThemeRows };
}

// ─── Settings (Definições) Platform Menu ─────────────────────────────────────

const SVG_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
const SVG_SUN =
  '<circle cx="12" cy="12" r="5"/>' +
  '<line x1="12" y1="1" x2="12" y2="3"/>' +
  '<line x1="12" y1="21" x2="12" y2="23"/>' +
  '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
  '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
  '<line x1="1" y1="12" x2="3" y2="12"/>' +
  '<line x1="21" y1="12" x2="23" y2="12"/>' +
  '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
  '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

function buildSettingsMenu(store: GameStore): {
  menu: HTMLElement;
  frostedToggle: HTMLButtonElement;
  darkToggle: HTMLButtonElement;
  darkIconSvg: SVGSVGElement;
} {
  const isFrosted = document.documentElement.dataset.glass === 'frosted';
  const frostedToggle = buildLiquidToggle('toggle-frosted-glass', isFrosted);
  const isDark = store.state.theme.startsWith('dark');
  const darkToggle = buildLiquidToggle('toggle-dark-mode', isDark);

  const menu = document.createElement('div');
  menu.id = 'menu-settings';
  menu.className = 'platform-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Definições');

  const content = document.createElement('div');
  content.className = 'platform-menu-content';

  // ── Appearance section ─────────────────────────────────────
  const appearLabel = document.createElement('div');
  appearLabel.className = 'platform-menu-label';
  appearLabel.textContent = 'Aparência';

  const darkRow = document.createElement('div');
  darkRow.className = 'settings-row';
  darkRow.innerHTML = `
    <div class="settings-row-icon" aria-hidden="true">
      <svg id="icon-dark-mode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        ${isDark ? SVG_SUN : SVG_MOON}
      </svg>
    </div>
    <div class="settings-row-text">
      <div class="settings-row-name">Modo escuro</div>
      <div class="settings-row-desc">Alterna claro / escuro</div>
    </div>
  `;
  darkRow.appendChild(darkToggle);
  const darkIconSvg = darkRow.querySelector<SVGSVGElement>('#icon-dark-mode')!;

  // ── Interface section ──────────────────────────────────────
  const sep1 = document.createElement('div');
  sep1.className = 'settings-sep';
  sep1.setAttribute('aria-hidden', 'true');

  const glassLabel = document.createElement('div');
  glassLabel.className = 'platform-menu-label';
  glassLabel.textContent = 'Interface';

  const frostedRow = document.createElement('div');
  frostedRow.className = 'settings-row';
  frostedRow.innerHTML = `
    <div class="settings-row-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
      </svg>
    </div>
    <div class="settings-row-text">
      <div class="settings-row-name">Vidro fosco</div>
      <div class="settings-row-desc">Desfoque mais intenso nos painéis</div>
    </div>
  `;
  frostedRow.appendChild(frostedToggle);

  // ── Wiki / help row ────────────────────────────────────────
  const sep2 = document.createElement('div');
  sep2.className = 'settings-sep';
  sep2.setAttribute('aria-hidden', 'true');

  const helpLabel = document.createElement('div');
  helpLabel.className = 'platform-menu-label';
  helpLabel.textContent = 'Ajuda';

  const wikiRow = document.createElement('div');
  wikiRow.className = 'settings-row settings-row--link';

  const wikiBtn = document.createElement('button');
  wikiBtn.id = 'btn-wiki-in-settings';
  wikiBtn.className = 'settings-row-link-btn';
  wikiBtn.setAttribute('aria-label', 'Abrir guia de como jogar');
  wikiBtn.innerHTML = `
    <div class="settings-row-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <div class="settings-row-text">
      <div class="settings-row-name">Como Jogar</div>
      <div class="settings-row-desc">Regras, níveis e opções do jogo</div>
    </div>
    <svg class="settings-row-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  `;
  wikiRow.appendChild(wikiBtn);

  content.append(appearLabel, darkRow, sep1, glassLabel, frostedRow, sep2, helpLabel, wikiRow);

  menu.innerHTML = `
    <div class="glass-effect" aria-hidden="true"></div>
    <div class="glass-tint" aria-hidden="true"></div>
    <div class="glass-shine" aria-hidden="true"></div>
  `;
  menu.appendChild(content);

  return { menu, frostedToggle, darkToggle, darkIconSvg };
}

// ─── Wiki Modal ───────────────────────────────────────────────────────────────

function buildWikiModal(): {
  modal: HTMLElement;
  openModal: () => void;
  closeModal: () => void;
} {
  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className = 'help-modal';
  modal.setAttribute('inert', '');

  const backdrop = document.createElement('div');
  backdrop.className = 'help-modal-backdrop';
  backdrop.id = 'help-modal-backdrop';

  const panel = document.createElement('div');
  panel.className = 'help-modal-panel';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'btn-close-help';
  closeBtn.className = 'modal-close-btn';
  closeBtn.setAttribute('aria-label', 'Fechar ajuda');
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  const content = document.createElement('div');
  content.className = 'help-modal-content';

  const header = document.createElement('div');
  header.className = 'help-modal-header';

  const titleEl = document.createElement('span');
  titleEl.className = 'help-modal-title';
  titleEl.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    Como Jogar
  `;

  header.append(titleEl, closeBtn);

  const body = document.createElement('div');
  body.className = 'help-body';
  body.appendChild(buildWikiContent());

  content.append(header, body);

  panel.innerHTML = `
    <div class="glass-effect" aria-hidden="true"></div>
    <div class="glass-tint" aria-hidden="true"></div>
    <div class="glass-shine" aria-hidden="true"></div>
  `;
  panel.appendChild(content);

  modal.append(backdrop, panel);

  function openModal(): void {
    modal.removeAttribute('inert');
    modal.classList.add('visible');
    requestAnimationFrame(() => closeBtn.focus());
  }

  function closeModal(): void {
    if (!modal.classList.contains('visible')) return;
    modal.classList.remove('visible');
    modal.setAttribute('inert', '');
  }

  backdrop.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  return { modal, openModal, closeModal };
}

// ─── Liquid Toggle factory ────────────────────────────────────────────────────

export function buildLiquidToggle(id: string, initialChecked: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = id;
  btn.type = 'button';
  btn.className = 'liquid-toggle';
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', String(initialChecked));
  // Matches the exact DOM structure from the reference implementation
  btn.innerHTML = `
    <div class="knockout" aria-hidden="true">
      <div class="indicator indicator--masked">
        <div class="mask"></div>
      </div>
    </div>
    <div class="indicator__liquid" aria-hidden="true">
      <div class="shadow"></div>
      <div class="wrapper">
        <div class="liquids">
          <div class="liquid__shadow"></div>
          <div class="liquid__track"></div>
        </div>
      </div>
      <div class="cover"></div>
    </div>
  `;
  btn.style.setProperty('--complete', initialChecked ? '100' : '0');
  return btn;
}

export function animateLiquidToggle(btn: HTMLButtonElement, toChecked: boolean): void {
  const startVal = Number.parseFloat(btn.style.getPropertyValue('--complete') || '0');
  const endVal = toChecked ? 100 : 0;
  if (startVal === endVal) return;

  // Phase 1: set active (squish) immediately
  btn.dataset.active = 'true';

  // Phase 2: after brief delay, animate --complete (matches GSAP delay: 180ms)
  const DELAY = 180;
  const DURATION = 140;
  let phaseStart: number | null = null;
  let animPhase = false;
  let animStart = 0;

  function frame(ts: number): void {
    phaseStart ??= ts;
    if (!animPhase) {
      if (ts - phaseStart < DELAY) {
        requestAnimationFrame(frame);
        return;
      }
      animPhase = true;
      animStart = ts;
    }
    const progress = Math.min((ts - animStart) / DURATION, 1);
    // power1.inOut
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    btn.style.setProperty('--complete', String(Math.round(startVal + (endVal - startVal) * eased)));
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      // Phase 3: clear active after 50ms (matches GSAP onComplete delay)
      setTimeout(() => {
        delete btn.dataset.active;
      }, 50);
    }
  }

  requestAnimationFrame(frame);
}

// ─── Wiki content ─────────────────────────────────────────────────────────────

// ─── Wiki content factory ─────────────────────────────────────────────────────

type WikiBlock = {
  icon?: string;
  title: string;
  html: string;
  warn?: boolean;
};

type WikiSection = {
  label?: string;
  blocks: WikiBlock[];
};

const WIKI_CHEVRON = `<svg class="wiki-block__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2.2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="6 9 12 15 18 9"/>
</svg>`;

function buildWikiContent(): DocumentFragment {
  const frag = document.createDocumentFragment();

  const sections: WikiSection[] = [
    {
      blocks: [
        {
          icon: '🎲',
          title: 'O que é o Verdade ou Desafio?',
          html: `<p>Um jogo social em que cada jogador escolhe, na sua vez, entre <strong>Verdade</strong> (responder honestamente a uma pergunta) ou <strong>Desafio</strong> (completar uma tarefa divertida ou ousada). Há 4 níveis de intensidade crescente — do familiar ao extremo. Escolhe o que melhor se adapta ao teu grupo.</p>`,
        },
        {
          icon: '🏆',
          title: 'Os 4 Níveis',
          html: `<ul>
        <li><strong>🌟 Diversão Familiar</strong> — Perguntas e desafios leves para qualquer grupo e idade. Sem conteúdo adulto nem penalizações.</li>
        <li><strong>🎉 Noite entre Amigos</strong> — Conteúdo picante sobre experiências e segredos. Inclui estado de casal e o sistema de <em>shots</em> como penalização. Requer 18+.</li>
        <li><strong>🔥 Onde a Ousadia Começa</strong> — Conteúdo adulto com envolvimento físico entre jogadores. Motor de alvos com base na orientação sexual e estado relacional. Requer 18+.</li>
        <li><strong>💀 Extremo</strong> — O nível mais intenso. Apenas para grupos completamente à vontade entre si. Conteúdo explícito. Requer 18+.</li>
      </ul>`,
        },
      ],
    },
    {
      label: 'Como Jogar',
      blocks: [
        {
          icon: '📋',
          title: 'Passo a Passo',
          html: `<ol>
        <li>Escolhe o nível na ecrã inicial.</li>
        <li>Confirma a idade, se necessário (18+ para os níveis 2, 3 e 4).</li>
        <li>Se já tiveres jogadores guardados, podes reutilizá-los diretamente ou começar do zero.</li>
        <li>Adiciona (ou ajusta) os jogadores com as respetivas informações.</li>
        <li>Ativa ou desativa o sistema de penalizações em <em>shots</em>.</li>
        <li>Carrega em <strong>Iniciar Jogo</strong>.</li>
        <li>Na tua vez, escolhe <strong>Verdade</strong> ou <strong>Desafio</strong>.</li>
        <li>Se o desafio tiver cronómetro (até 60 segundos), carrega em <strong>⏱️ Aceitar Desafio</strong> e depois em <strong>▶️ Iniciar</strong> — a vez só passa quando o tempo chegar a zero. Caso contrário, completa o desafio e carrega em ✅ Feito! para passar a vez.</li>
        <li>Se recusares, carrega em ❌ Recusar e ajusta os shots bebidos de facto (pode ser zero).</li>
        <li>No ecrã de escolha, também podes usar <strong>⏭️ Saltar Jogador</strong> para avançar a vez sem carta (por exemplo, se um membro de um casal tiver de sair).</li>
        <li>Quando o jogo terminar com penalizações ativas e algum jogador tiver bebido, é mostrado um <strong>ranking</strong> antes de voltar ao início.</li>
      </ol>`,
        },
        {
          icon: '👥',
          title: 'Configuração de Jogadores',
          html: `<p>Consoante o nível escolhido, é pedida diferente informação:</p>
      <ul>
        <li><strong>Nível 1:</strong> Apenas o nome.</li>
        <li><strong>Nível 2:</strong> Nome + género + estado de casal (<em>Solteiro/a</em> ou <em>Em casal</em>). Jogadores em casal interagem exclusivamente entre si nas cartas com alvo.</li>
        <li><strong>Níveis 3 e 4:</strong> Nome, género, orientação sexual e estado relacional. O toggle <em>"aberto/a a interações externas"</em> é necessário para poder ser alvo de outros (relações abertas) ou definir preferência de sexo alvo (solteiros).</li>
      </ul>
      <p>Podes <strong>editar</strong> um jogador a qualquer momento (botão de lápis) ou <strong>removê-lo</strong> (✕). Ambas as ações pedem confirmação numa janela de vidro; ao remover um jogador, a ligação com o/a parceiro/a é desfeita automaticamente.</p>`,
        },
        {
          icon: '🎯',
          title: 'Sistema de Alvos (Níveis 2–4)',
          html: `<p><strong>Nível 2:</strong> Jogadores <em>Em casal</em> interagem exclusivamente com o/a seu/sua parceiro/a. Solteiros/as podem ser alvo de qualquer outro jogador.</p>
      <p><strong>Níveis 3 e 4:</strong> O motor respeita orientação sexual mútua, exclusividade relacional e o toggle de interação externa. Tanto solteiros como jogadores em relação aberta precisam de ter o toggle ativo para interagir com terceiros (ou ser alvo deles). O parceiro de uma relação exclusiva está sempre disponível como alvo. Se não existir alvo elegível, o jogo recua para cartas sem alvo.</p>
      <p><strong>Relações exclusivas:</strong> 57 cartas exigem uma terceira pessoa para além do alvo (ex.: um beijo a três). Essas cartas são removidas do baralho para jogadores em relações exclusivas. O parceiro registado está sempre disponível como alvo, independentemente de outras restrições.</p>`,
        },
        {
          icon: '🔁',
          title: 'Desafios com Duração (Rondas)',
          html: `<p>Alguns desafios têm uma duração definida em <strong>rondas</strong> — por exemplo, <em>"Fala com sotaque estrangeiro durante as próximas 3 rondas."</em></p>
      <p>Quando aceitas um desafio com duração, o jogo fica a contar as rondas automaticamente. A <strong>Ronda atual</strong> é visível no topo do ecrã durante o jogo — incrementa sempre que a vez volta ao primeiro jogador.</p>
      <p>Quando chegares à ronda alvo e for <strong>a tua vez</strong>, aparece um aviso a informar que o efeito terminou — antes de escolheres Verdade ou Desafio.</p>`,
        },
        {
          icon: '⏱️',
          title: 'Desafios com Cronómetro',
          html: `<p>Alguns desafios têm uma duração em <strong>segundos</strong> (até 60) — por exemplo, <em>"Dança como um robô durante 30 segundos."</em> O campo <code>timerSeconds</code> vem pré-calculado na base de dados.</p>
      <p>Quando aceitas um desafio destes com <strong>⏱️ Aceitar Desafio</strong>, abre um ecrã de cronómetro com o texto do desafio e o tempo. Carrega em <strong>▶️ Iniciar</strong> para começar a contagem — o jogo fica bloqueado até chegar a zero e só então passa a vez automaticamente. Se preferires não o fazer, carrega em ❌ Recusar (vai para a penalização, se estiver ativa).</p>
      <p>Durações superiores a 60 segundos ficam guardadas nos dados, mas não ativam o cronómetro.</p>`,
        },
        {
          icon: '🍺',
          title: 'Penalizações (Shots)',
          html: `<p>Nos níveis 2–4, cada carta indica quantos <em>shots</em> o jogador deve beber se recusar. A indicação <em>🍺 N shots se recusar</em> só aparece quando o modo de penalizações está ativo.</p>
      <p>Ao recusar, aparece um seletor para ajustar os shots bebidos de facto — podes colocar zero. O jogo regista apenas o que confirmares. O botão ❌ Recusar está sempre disponível.</p>
      <p>Alguns desafios também incluem <strong>shots por sucesso</strong> — beber faz parte do próprio desafio, não é penalização. Esses também contam para o ranking final.</p>
      <p>O <strong>Saldo</strong> de shots por jogador é visível durante o jogo (<em>Saldo: X shots</em>). No fim, se alguém bebeu, é mostrado um <strong>ranking 🏆</strong> antes de voltar ao início — medalhas para os 3 primeiros que beberam e posição numérica (ex.: 4º) para os restantes. Este sistema pode ser desativado antes de iniciar o jogo.</p>`,
        },
        {
          icon: '🔄',
          title: 'Motor Anti-Repetição',
          html: `<p>Antes de cada carta, o jogo calcula uma pontuação para cada candidata e favorece sempre as menos vistas recentemente:</p>
      <ul>
        <li>Cartas nos últimos <strong>12 turnos</strong> do jogador → penalização elevada (+200).</li>
        <li>Cartas vistas pelo/a <strong>parceiro/a nos últimos 8 turnos</strong> → penalização alta (+120).</li>
        <li>Cartas vistas por <strong>qualquer outro jogador</strong> recentemente → penalização média (+80).</li>
        <li>Cartas já vistas mas não recentemente → penalização leve (+40).</li>
        <li>Cartas nunca vistas → prioridade máxima.</li>
        <li>Empates resolvidos com aleatoriedade uniforme entre as melhores.</li>
      </ul>`,
        },
      ],
    },
    {
      label: 'App & Personalização',
      blocks: [
        {
          icon: '🎨',
          title: 'Aparência e Temas',
          html: `<p>A dock no fundo do ecrã tem dois botões de personalização:</p>
      <ul>
        <li><strong>Temas</strong> — seleciona a paleta de cor (Violeta, Oceano, Âmbar, Rosa, Floresta).</li>
        <li><strong>Definições</strong> — toggle de modo escuro/claro, vidro fosco e acesso a este guia.</li>
      </ul>
      <p>Na primeira visita, o modo claro/escuro segue a preferência do sistema. A partir da primeira alteração, o tema fica guardado automaticamente.</p>`,
        },
        {
          icon: '📱',
          title: 'Instalar como App (PWA)',
          html: `<ul>
        <li><strong>Android (Chrome):</strong> banner automático ou menu ⋮ → <em>Adicionar ao ecrã principal</em>.</li>
        <li><strong>iOS (Safari):</strong> botão de partilha → <em>Adicionar ao ecrã de início</em>.</li>
        <li><strong>macOS / Windows:</strong> ícone de instalação na barra de endereço.</li>
      </ul>
      <p>Depois de instalado, o jogo abre em ecrã inteiro, funciona <strong>sem ligação à internet</strong> e <strong>atualiza-se automaticamente</strong> quando uma nova versão é publicada.</p>`,
        },
      ],
    },
  ];

  // Warning block — always visible, no collapse toggle
  const warnBlock: WikiBlock = {
    title: '⚠️ Consentimento e Segurança',
    html: `<p>A participação em qualquer desafio deve ser <strong>sempre voluntária e consensual</strong>. Ninguém deve sentir pressão para fazer algo com que não se sinta confortável.</p>
      <p>Qualquer pessoa pode <strong>passar a vez a qualquer momento</strong>, sem julgamentos. O bem-estar e os limites de cada pessoa vêm sempre em primeiro lugar.</p>`,
    warn: true,
  };

  let isFirst = true;

  for (const section of sections) {
    if (section.label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'wiki-group-label';
      labelEl.textContent = section.label;
      frag.appendChild(labelEl);
    }

    for (const block of section.blocks) {
      const el = document.createElement('div');
      el.className = 'wiki-block';
      if (!isFirst) el.classList.add('wiki-block--collapsed');

      const headerBtn = document.createElement('button');
      headerBtn.className = 'wiki-block__header';
      headerBtn.setAttribute('aria-expanded', isFirst ? 'true' : 'false');
      headerBtn.innerHTML = `<span class="wiki-block__header-label">${
        block.icon ? `<span class="wiki-block__icon" aria-hidden="true">${block.icon}</span>` : ''
      }<span>${block.title}</span></span>${WIKI_CHEVRON}`;

      headerBtn.addEventListener('click', () => {
        const nowCollapsed = el.classList.toggle('wiki-block--collapsed');
        headerBtn.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
      });

      const body = document.createElement('div');
      body.className = 'wiki-block__body';
      const bodyInner = document.createElement('div');
      bodyInner.className = 'wiki-block__body-inner';
      bodyInner.innerHTML = block.html;
      body.appendChild(bodyInner);

      el.append(headerBtn, body);
      frag.appendChild(el);

      isFirst = false;
    }
  }

  // Warning block: no collapse toggle, always visible
  {
    const el = document.createElement('div');
    el.className = 'wiki-block wiki-block--warn';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'wiki-block__header wiki-block__header--static';
    headerDiv.innerHTML = `<span class="wiki-block__header-label"><span>${warnBlock.title}</span></span>`;

    const body = document.createElement('div');
    body.className = 'wiki-block__body';
    const bodyInner = document.createElement('div');
    bodyInner.className = 'wiki-block__body-inner';
    bodyInner.innerHTML = warnBlock.html;
    body.appendChild(bodyInner);

    el.append(headerDiv, body);
    frag.appendChild(el);
  }

  return frag;
}
