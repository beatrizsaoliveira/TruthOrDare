import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('./src/data/dataset.json', 'utf-8'));

const cards = [];
for (const tierData of Object.values(data.tiers)) {
  for (const c of tierData.truth) cards.push(c);
  for (const c of tierData.dare) cards.push(c);
}

const tierNames = {
  1: '🌱 Tier 1 — Familiar',
  2: '🌿 Tier 2 — Picante',
  3: '🔥 Tier 3 — Quente',
  4: '💀 Tier 4 — Extremo',
};

const TRUE_COUNTDOWN = 60;

function badges(c) {
  const parts = [];
  if (c.shots !== null) parts.push(`🍺 ${c.shots} shots`);
  if (c.timerSeconds !== null) {
    const flag = c.timerSeconds > TRUE_COUNTDOWN ? ' (sem cronómetro)' : '';
    parts.push(`⏱️ ${c.timerSeconds}s${flag}`);
  }
  if (c.hasTarget) parts.push('👥 Target');
  if (c.requiresThirdParty) parts.push('👤 3ª pessoa');
  if (c.hasRounds && c.roundsCount !== null) {
    parts.push(`🔄 ${c.roundsCount} ronda${c.roundsCount > 1 ? 's' : ''}`);
  }
  return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
}

let md = '# 🎲 Verdade ou Desafio — Edição Completa (800 Cartas)\n\n';
md += '> Dataset revisto e consolidado — 58 cartas com restrição para relações exclusivas.\n';
md += `> **${cards.length}** cartas | 200 por tier (100 verdades + 100 desafios)\n`;
md += '> 🍺 = shots | ⏱️ = cronómetro | 👥 = target | 👤 = 3ª pessoa | 🔄 = rondas\n\n';
md += '---\n';

for (let t = 1; t <= 4; t++) {
  const tier = cards.filter((c) => c.tier === t);
  const truths = tier.filter((c) => c.type === 'truth');
  const dares = tier.filter((c) => c.type === 'dare');

  md += `\n## ${tierNames[t]}\n\n`;

  // Truths
  md += `### 🤔 Verdades (${truths.length})\n\n`;
  for (const c of truths) {
    md += `**${c.id}** · Verdade${badges(c)}\n> ${c.rawText}\n\n`;
  }

  // Dares
  md += `\n### 🔥 Desafios (${dares.length})\n\n`;
  for (const c of dares) {
    md += `**${c.id}** · Desafio${badges(c)}\n> ${c.rawText}\n\n`;
  }

  md += '---\n';
}

md += `\n> Gerado a partir de \`src/data/dataset.json\` — ${cards.length} cartas únicas.\n`;
md +=
  '> ⏱️ Valores > 60s não disparam cronómetro. 👤 3ª pessoa = excluída em relações exclusivas.\n';

writeFileSync('CARDS.md', md);
console.log(`CARDS.md gerado com ${cards.length} cartas em formato de cards.`);
