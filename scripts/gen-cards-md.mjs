import { readFileSync, writeFileSync } from 'node:fs';

const cards = JSON.parse(readFileSync('./src/data/dataset.json', 'utf-8'));

const tierNames = {
  1: '🌱 Tier 1 — Familiar',
  2: '🌿 Tier 2 — Picante',
  3: '🔥 Tier 3 — Quente',
  4: '💀 Tier 4 — Extremo',
};

const TRUE_COUNTDOWN_SECONDS = 60;

function shotsLabel(s) {
  if (s === null) return '—';
  return `🍺 ${s}`;
}

function timerLabel(s) {
  if (s === null) return '—';
  // Values above the countdown trigger are still shown, but flagged so readers
  // know the in-game countdown won't fire for them.
  const flag = s > TRUE_COUNTDOWN_SECONDS ? ' *' : '';
  return `${s}s${flag}`;
}

function targetLabel(c) {
  return c.hasTarget ? '✓' : '—';
}

function thirdPartyLabel(c) {
  return c.requiresThirdParty ? '✓' : '—';
}

function roundsLabel(c) {
  if (!c.hasRounds || c.roundsCount === null) return '—';
  return c.roundsCount === 1 ? '1 ronda' : `${c.roundsCount} rondas`;
}

let md = '# 🎲 Verdade ou Desafio — Edição Completa (800 Cartas)\n\n';
md += '> Dataset final revisto e consolidado.\n';
md += `> **${cards.length}** cartas únicas | Shots: 1–3 (Tiers 2–4) | Tier 1 sem shots.\n`;
md += '> Todas as referências a outros jogadores usam `[Target Player]` para compatibilidade com casais.\n';
md += '> ⏱️ Timer: valores > 60s (`*`) decorrem em tempo real e não disparam a contagem regressiva.\n';
md += '> 👤 3ª pessoa: cartas que exigem um terceiro jogador (excluídas em relações fechadas).\n\n';
md += '---\n';

for (let t = 1; t <= 4; t++) {
  const tier = cards.filter(c => c.tier === t);
  const truths = tier.filter(c => c.type === 'truth');
  const dares = tier.filter(c => c.type === 'dare');

  md += `\n## ${tierNames[t]}\n\n`;

  // Truths
  md += `### 🤔 Verdades (${truths.length})\n\n`;
  md += `| # | Pergunta | 🍺 Shots | ⏱️ Timer | 👥 Target | 👤 3ª | 🔄 Rounds |\n`;
  md += `|---|----------|:---:|:---:|:---:|:---:|:---:|\n`;
  truths.forEach((c, i) => {
    md += `| ${i + 1} | ${c.rawText} | ${shotsLabel(c.shots)} | ${timerLabel(c.timerSeconds)} | ${targetLabel(c)} | ${thirdPartyLabel(c)} | ${roundsLabel(c)} |\n`;
  });

  // Dares
  md += `\n### 🔥 Desafios (${dares.length})\n\n`;
  md += `| # | Desafio | 🍺 Shots | ⏱️ Timer | 👥 Target | 👤 3ª | 🔄 Rounds |\n`;
  md += `|---|---------|:---:|:---:|:---:|:---:|:---:|\n`;
  dares.forEach((c, i) => {
    md += `| ${i + 1} | ${c.rawText} | ${shotsLabel(c.shots)} | ${timerLabel(c.timerSeconds)} | ${targetLabel(c)} | ${thirdPartyLabel(c)} | ${roundsLabel(c)} |\n`;
  });

  md += '\n---\n';
}

md += `\n> Gerado a partir de \`src/data/dataset.json\` com ${cards.length} cartas únicas.\n`;
md += '> ⏱️ Timer: `*` = valor acima do limite de contagem regressiva (60s).\n';

writeFileSync('CARDS.md', md);
console.log(`CARDS.md gerado com ${cards.length} cartas.`);
