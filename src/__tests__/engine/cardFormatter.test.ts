import { describe, expect, it } from 'vitest';
import {
  formatCardText,
  orientationLabel,
  relationshipLabel,
  sexLabel,
} from '../../engine/cardFormatter';
import type { Player } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function player(name: string): Player {
  return { id: 'p1', name };
}

// ---------------------------------------------------------------------------
// formatCardText
// ---------------------------------------------------------------------------

describe('formatCardText', () => {
  it('returns rawText unchanged when no targetPlayer provided', () => {
    const raw = 'Hello [Target Player]';
    const p = player('Alice');
    expect(formatCardText(raw, p)).toBe(raw);
  });

  it('returns rawText unchanged when targetPlayer is undefined and text has NO placeholder', () => {
    const raw = 'Hello world';
    const p = player('Alice');
    expect(formatCardText(raw, p, undefined)).toBe(raw);
  });

  it('replaces single [Target Player] with <strong>Name</strong>', () => {
    const raw = 'Massage [Target Player] shoulders.';
    const active = player('Alice');
    const target = player('Bob');
    expect(formatCardText(raw, active, target)).toBe('Massage <strong>Bob</strong> shoulders.');
  });

  it('replaces MULTIPLE occurrences of [Target Player] in same text', () => {
    const raw = 'Look at [Target Player] and tell [Target Player] the truth.';
    const active = player('Alice');
    const target = player('Bob');
    expect(formatCardText(raw, active, target)).toBe(
      'Look at <strong>Bob</strong> and tell <strong>Bob</strong> the truth.',
    );
  });

  it('the replacement is wrapped in <strong> tags', () => {
    const raw = 'Kiss [Target Player].';
    const active = player('Alice');
    const target = player('Charlie');
    const result = formatCardText(raw, active, target);
    expect(result).toContain('<strong>');
    expect(result).toContain('</strong>');
    expect(result).not.toContain('[Target Player]');
  });

  it('does NOT replace [Target Player] when targetPlayer is undefined', () => {
    const raw = 'Do something with [Target Player].';
    const active = player('Alice');
    expect(formatCardText(raw, active)).toBe(raw);
  });

  it('HTML escaping — name with <script>: < becomes &lt; and > becomes &gt;', () => {
    const raw = 'Poke [Target Player]';
    const target = player('<script>');
    const result = formatCardText(raw, player('A'), target);
    expect(result).toBe('Poke <strong>&lt;script&gt;</strong>');
  });

  it('HTML escaping — name with &: becomes &amp;', () => {
    const raw = 'Look at [Target Player]';
    const target = player('Ben & Jerry');
    const result = formatCardText(raw, player('A'), target);
    expect(result).toBe('Look at <strong>Ben &amp; Jerry</strong>');
  });

  it('HTML escaping — name with ": becomes &quot;', () => {
    const raw = 'Ask [Target Player]';
    const target = player('Mr "Big"');
    const result = formatCardText(raw, player('A'), target);
    expect(result).toBe('Ask <strong>Mr &quot;Big&quot;</strong>');
  });

  it("HTML escaping — name with ': becomes &#x27;", () => {
    const raw = 'I choose [Target Player]';
    const target = player("D'Artagnan");
    const result = formatCardText(raw, player('A'), target);
    expect(result).toBe('I choose <strong>D&#x27;Artagnan</strong>');
  });

  it('Name with all special chars combined: <>&"\'', () => {
    const raw = 'Hello [Target Player]';
    const target = player('<>&"\'');
    const result = formatCardText(raw, player('A'), target);
    expect(result).toBe('Hello <strong>&lt;&gt;&amp;&quot;&#x27;</strong>');
  });

  it('Plain name with no special chars: unchanged in the replacement', () => {
    const raw = 'Truth for [Target Player]';
    const target = player('Maria');
    const result = formatCardText(raw, player('A'), target);
    expect(result).toBe('Truth for <strong>Maria</strong>');
  });

  it('activePlayer is accepted but not used in replacement (it is there for future use)', () => {
    // The function signature accepts activePlayer; we just verify the
    // result does not depend on it.
    const raw = 'Dare [Target Player]';
    const active = player('Alice');
    const target = player('Bob');
    const result = formatCardText(raw, active, target);
    expect(result).not.toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('Empty rawText returns empty string', () => {
    expect(formatCardText('', player('A'))).toBe('');
  });

  it('Text with no placeholder and a targetPlayer: returns text unchanged (no replacement happens)', () => {
    const raw = 'Say something nice.';
    const active = player('A');
    const target = player('B');
    expect(formatCardText(raw, active, target)).toBe('Say something nice.');
  });
});

// ---------------------------------------------------------------------------
// sexLabel
// ---------------------------------------------------------------------------

describe('sexLabel', () => {
  it('male → Masculino', () => {
    expect(sexLabel('male')).toBe('Masculino');
  });

  it('female → Feminino', () => {
    expect(sexLabel('female')).toBe('Feminino');
  });
});

// ---------------------------------------------------------------------------
// orientationLabel
// ---------------------------------------------------------------------------

describe('orientationLabel', () => {
  it('hetero → Heterossexual', () => {
    expect(orientationLabel('hetero')).toBe('Heterossexual');
  });

  it('homo → Homossexual', () => {
    expect(orientationLabel('homo')).toBe('Homossexual');
  });

  it('bi → Bissexual', () => {
    expect(orientationLabel('bi')).toBe('Bissexual');
  });

  it('undefined → — (em dash)', () => {
    expect(orientationLabel(undefined)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// relationshipLabel
// ---------------------------------------------------------------------------

describe('relationshipLabel', () => {
  it('single → Solteiro/a', () => {
    expect(relationshipLabel('single')).toBe('Solteiro/a');
  });

  it('open → Relação Aberta', () => {
    expect(relationshipLabel('open')).toBe('Relação Aberta');
  });

  it('closed → Relação Exclusiva', () => {
    expect(relationshipLabel('closed')).toBe('Relação Exclusiva');
  });

  it('undefined → — (em dash)', () => {
    expect(relationshipLabel(undefined)).toBe('—');
  });
});
