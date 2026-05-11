#!/usr/bin/env node
/**
 * Converts dataset.md → src/data/dataset.json
 * Run with: node scripts/convert-dataset.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SHOTS_RE = /\s*\[(\d+)\s+shots?\]\s*$/i;
const SECTION_RE = /^Tier\s+(\d)\s+-\s+(Verdades|Desafios)/i;
const ITEM_RE = /^(\d+)\.\s+(.+)/;

const content = readFileSync(resolve(root, 'dataset.md'), 'utf8');
const cards = [];

const sections = content.split(/^## /m);

for (const section of sections) {
  const firstLine = section.split('\n')[0] ?? '';
  const sectionMatch = SECTION_RE.exec(firstLine);
  if (!sectionMatch) continue;

  const tier = parseInt(sectionMatch[1] ?? '1', 10);
  const type = /verdades/i.test(sectionMatch[2] ?? '') ? 'truth' : 'dare';

  const lines = section.split('\n');
  for (const line of lines) {
    const itemMatch = ITEM_RE.exec(line.trim());
    if (!itemMatch) continue;

    const id = parseInt(itemMatch[1] ?? '0', 10);
    let rawText = (itemMatch[2] ?? '').trim();

    rawText = rawText.replace(/\s+$/, '');

    const shotsMatch = SHOTS_RE.exec(rawText);
    const shots = shotsMatch ? parseInt(shotsMatch[1] ?? '0', 10) : null;

    if (shotsMatch) {
      rawText = rawText.slice(0, rawText.length - shotsMatch[0].length).trim();
    }

    const hasTarget = rawText.includes('[Target Player]');

    cards.push({ id, type, tier, rawText, shots, hasTarget });
  }
}

const outDir = resolve(root, 'src', 'data');
mkdirSync(outDir, { recursive: true });

const outPath = resolve(outDir, 'dataset.json');
writeFileSync(outPath, JSON.stringify(cards, null, 2), 'utf8');

console.log(`✓ Converted ${cards.length} cards → src/data/dataset.json`);
