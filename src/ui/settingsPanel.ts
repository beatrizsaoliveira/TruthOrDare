import type { GameStore } from '../state/store.js';
import { Actions } from '../state/store.js';

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * Injects the persistent settings FAB and modal into document.body.
 * Called once at app startup; survives screen transitions.
 */
export function createSettingsPanel(store: GameStore): void {
  // ── Floating action button ─────────────────────────────────
  const fab = document.createElement('button');
  fab.className = 'settings-fab';
  fab.setAttribute('aria-label', 'Abrir definições');
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.setAttribute('aria-controls', 'settings-modal');
  fab.innerHTML = '<span aria-hidden="true">⚙️</span>';

  // ── Modal overlay ──────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'settings-modal';
  overlay.className = 'settings-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'settings-modal-title');
  overlay.hidden = true;

  // ── Panel ──────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  const handle = document.createElement('div');
  handle.className = 'settings-panel__handle';
  handle.setAttribute('aria-hidden', 'true');

  // Header
  const panelHeader = document.createElement('div');
  panelHeader.className = 'settings-panel__header';

  const title = document.createElement('h2');
  title.id = 'settings-modal-title';
  title.className = 'heading-md';
  title.textContent = 'Definições';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn--ghost btn--sm settings-panel__close';
  closeBtn.setAttribute('aria-label', 'Fechar definições');
  closeBtn.textContent = '✕ Fechar';

  panelHeader.append(title, closeBtn);

  // ── Appearance section ─────────────────────────────────────
  const appearanceSection = document.createElement('section');
  appearanceSection.className = 'settings-section';

  const appearanceTitle = document.createElement('h3');
  appearanceTitle.className = 'settings-section__title';
  appearanceTitle.textContent = 'Aparência';

  const themeRow = buildThemeToggle(store);
  appearanceSection.append(appearanceTitle, themeRow);

  // ── Divider ────────────────────────────────────────────────
  const divider = document.createElement('div');
  divider.className = 'divider';
  divider.setAttribute('aria-hidden', 'true');

  // ── Wiki section ───────────────────────────────────────────
  const wikiSection = buildWikiSection();

  panel.append(handle, panelHeader, appearanceSection, divider, wikiSection);
  overlay.appendChild(panel);
  document.body.append(fab, overlay);

  // ── Interaction ────────────────────────────────────────────
  let previouslyFocused: HTMLElement | null = null;

  function openPanel(): void {
    previouslyFocused = document.activeElement as HTMLElement | null;
    overlay.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => closeBtn.focus());
  }

  function closePanel(): void {
    overlay.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    previouslyFocused?.focus();
  }

  fab.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closePanel();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) {
      e.preventDefault();
      closePanel();
    }
  });

  // Keep toggle in sync with store state changes
  store.subscribe(state => {
    const toggle = document.getElementById('settings-theme-toggle') as HTMLInputElement | null;
    if (toggle) toggle.checked = state.theme === 'dark';
  });
}

// ─── Theme toggle row ─────────────────────────────────────────────────────────

function buildThemeToggle(store: GameStore): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'toggle-wrap';

  const labelDiv = document.createElement('div');
  labelDiv.className = 'toggle-label';
  const labelTitle = document.createElement('div');
  labelTitle.className = 'toggle-label__title';
  labelTitle.textContent = 'Modo escuro';
  const labelDesc = document.createElement('div');
  labelDesc.className = 'toggle-label__desc';
  labelDesc.textContent = 'Alterna entre tema claro e escuro';
  labelDiv.append(labelTitle, labelDesc);

  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle';
  toggleLabel.htmlFor = 'settings-theme-toggle';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.id = 'settings-theme-toggle';
  toggleInput.setAttribute('role', 'switch');
  toggleInput.setAttribute('aria-label', 'Ativar modo escuro');
  toggleInput.checked = store.state.theme === 'dark';

  const toggleTrack = document.createElement('span');
  toggleTrack.className = 'toggle__track';

  toggleLabel.append(toggleInput, toggleTrack);
  wrap.append(labelDiv, toggleLabel);

  toggleInput.addEventListener('change', () => {
    const next = toggleInput.checked ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = next;
    store.update(Actions.setTheme(next));
  });

  return wrap;
}

// ─── Wiki / Help section ──────────────────────────────────────────────────────

interface WikiBlock {
  title: string;
  html: string;
  warn?: boolean;
}

function buildWikiSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'settings-section wiki-section';

  const sectionTitle = document.createElement('h3');
  sectionTitle.className = 'settings-section__title';
  sectionTitle.innerHTML = '📖&nbsp; Como Jogar';

  const content = document.createElement('div');
  content.className = 'wiki-content';

  const blocks: WikiBlock[] = [
    {
      title: 'O que é o Truth or Dare?',
      html: `<p>Um jogo social em que cada jogador escolhe, na sua vez, entre <strong>Verdade</strong> (responder honestamente a uma pergunta) ou <strong>Desafio</strong> (completar uma tarefa divertida ou ousada). Há 4 níveis de intensidade crescente — escolhe o que melhor se adapta ao teu grupo.</p>`,
    },
    {
      title: 'Os 4 Níveis (Tiers)',
      html: `<ul>
        <li><strong>🟢 Tier 1 — Diversão Familiar:</strong> Perguntas e desafios leves para qualquer grupo e idade. Sem conteúdo adulto nem penalizações. Ideal para reuniões de família ou grupos mistos.</li>
        <li><strong>🔵 Tier 2 — Noite entre Amigos:</strong> Conteúdo mais picante sobre experiências, segredos e situações embaraçosas. Inclui o sistema de <em>shots</em> como penalização por recusar. Requer confirmação de 18+.</li>
        <li><strong>🟣 Tier 3 — Onde a Ousadia Começa:</strong> Conteúdo adulto com envolvimento físico e sensual entre jogadores. O motor de <em>targets</em> entra em ação, respeitando orientações sexuais e o estado relacional de cada pessoa. Requer 18+.</li>
        <li><strong>🔴 Tier 4 — Extremo:</strong> O nível mais intenso, sem limites dentro do consenso. Apenas para grupos completamente à vontade entre si. Conteúdo explícito. Requer 18+.</li>
      </ul>`,
    },
    {
      title: 'Configuração de Jogadores',
      html: `<p>Consoante o nível escolhido, é pedida diferente informação ao registar cada jogador:</p>
      <ul>
        <li><strong>Tier 1:</strong> Apenas o nome.</li>
        <li><strong>Tier 2:</strong> Nome + género (para concordância gramatical nas cartas em português).</li>
        <li><strong>Tiers 3 e 4:</strong> Nome, género, orientação sexual, estado relacional (solteiro/a, relação aberta ou fechada), parceiro/a presente no jogo (opcional) e preferência de alvo (homens, mulheres ou ambos).</li>
      </ul>`,
    },
    {
      title: 'Penalizações (Shots)',
      html: `<p>Nos Tiers 2–4, cada carta indica quantos <em>shots</em> o jogador deve beber se recusar responder ou completar o desafio. Um ecrã de penalização aparece automaticamente ao recusar.</p>
      <p>Este sistema pode ser <strong>desativado</strong> no ecrã de configuração antes de iniciar o jogo.</p>
      <p><em>Joga sempre com responsabilidade. Podes substituir álcool por água, sumo ou qualquer outra bebida à tua escolha.</em></p>`,
    },
    {
      title: 'Sistema de Targets (Alvos)',
      html: `<p>Algumas cartas envolvem um <strong>[Target Player]</strong> — um jogador alvo selecionado automaticamente pelo motor de afinidades. Nos Tiers 3 e 4, o motor respeita:</p>
      <ul>
        <li><strong>Orientação sexual:</strong> o sistema só seleciona pares com atração mútua (ex: um jogador heterossexual não será alvo de outro do mesmo género).</li>
        <li><strong>Relação fechada:</strong> jogadores nesta situação interagem exclusivamente com o/a seu/sua parceiro/a registado/a no jogo.</li>
        <li><strong>Relação aberta:</strong> requer o campo "aberto/a a interações fora da relação" ativo para ser elegível como alvo por outros jogadores.</li>
        <li><strong>Preferência de alvo:</strong> podes especificar se preferes interagir com homens, mulheres ou ambos.</li>
      </ul>`,
    },
    {
      title: 'Motor Anti-Repetição',
      html: `<p>O jogo pontua cada carta antes de a selecionar, dando sempre preferência às menos vistas recentemente:</p>
      <ul>
        <li>Cartas nos últimos <strong>12 turnos</strong> do jogador têm penalização elevada.</li>
        <li>Cartas nos últimos <strong>6 turnos do/a parceiro/a</strong> também são penalizadas (casais partilham histórico).</li>
        <li>Cartas nunca vistas têm prioridade máxima.</li>
      </ul>
      <p>Isso garante variedade ao longo de toda a sessão de jogo.</p>`,
    },
    {
      title: 'Como Jogar — Passo a Passo',
      html: `<ol>
        <li>Escolhe o nível (Tier) na ecrã inicial.</li>
        <li>Confirma a idade, se necessário.</li>
        <li>Adiciona todos os jogadores com as respetivas informações.</li>
        <li>Ativa ou desativa as penalizações em <em>shots</em>.</li>
        <li>Carrega em <strong>Iniciar Jogo</strong>.</li>
        <li>Na tua vez, escolhe <strong>Verdade</strong> ou <strong>Desafio</strong>.</li>
        <li>Responde ou completa o desafio. Carrega em ✅ Feito! para passar a vez.</li>
        <li>Se recusares, carrega em ❌ Recusar e bebe a penalização indicada.</li>
      </ol>`,
    },
    {
      title: '⚠️ Segurança e Consentimento',
      html: `<p>A participação em qualquer desafio deve ser <strong>sempre voluntária e consensual</strong>. Ninguém deve sentir pressão para fazer algo com que não se sinta confortável.</p>
      <p>Qualquer pessoa pode <strong>passar a vez a qualquer momento</strong>, sem julgamentos. O jogo é diversão partilhada — o bem-estar e os limites de cada pessoa vêm sempre em primeiro lugar.</p>`,
      warn: true,
    },
  ];

  for (const block of blocks) {
    const blockEl = document.createElement('div');
    blockEl.className = `wiki-block${block.warn === true ? ' wiki-block--warn' : ''}`;

    const blockTitle = document.createElement('h4');
    blockTitle.textContent = block.title;

    const blockBody = document.createElement('div');
    blockBody.className = 'wiki-block__body';
    // Content is hardcoded source strings, not user input — no XSS risk
    blockBody.innerHTML = block.html;

    blockEl.append(blockTitle, blockBody);
    content.appendChild(blockEl);
  }

  section.append(sectionTitle, content);
  return section;
}
