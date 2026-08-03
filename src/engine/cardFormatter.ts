import type { Player, Sex } from '../types/index.js';
import { escapeHtml } from '../ui/domHelpers.js';

/**
 * Processes raw card text for display:
 *
 *  1. Replaces `[Target Player]` with the target player's name (if provided).
 *
 * Gender is expressed directly in the text using the (a) convention,
 * e.g. "nu(a)", "sozinho(a)". No dynamic adaptation is performed.
 *
 * @param rawText       - The original card text from the dataset.
 * @param activePlayer  - The player whose turn it is.
 * @param targetPlayer  - The target player for this card (optional).
 */
export function formatCardText(
  rawText: string,
  activePlayer: Player,
  targetPlayer?: Player,
): string {
  let text = rawText;

  // Convert *italic* markers to <em> tags
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Replace target player placeholder
  if (targetPlayer) {
    text = text.replaceAll('[Target Player]', `<strong>${escapeHtml(targetPlayer.name)}</strong>`);
  }

  return text;
}

/**
 * Returns the Portuguese label for a sex value.
 * Used in the UI to display player profiles.
 */
export function sexLabel(sex: Sex): string {
  return sex === 'male' ? 'Masculino' : 'Feminino';
}

/**
 * Returns the Portuguese label for an orientation value.
 */
export function orientationLabel(o: Player['orientation']): string {
  if (o === 'hetero') return 'Heterossexual';
  if (o === 'homo') return 'Homossexual';
  if (o === 'bi') return 'Bissexual';
  return '—';
}

/**
 * Returns the Portuguese label for a relationship status.
 */
export function relationshipLabel(r: Player['relationshipStatus']): string {
  if (r === 'single') return 'Solteiro/a';
  if (r === 'open') return 'Relação Aberta';
  if (r === 'closed') return 'Relação Exclusiva';
  return '—';
}
