/**
 * Deterministischer Farbkontrast-Test der CD-Tokens (T-43, requirements N3 —
 * WCAG 2.1 AA, Erfolgskriterien 1.4.3 Text und 1.4.11 Non-Text).
 *
 * Hintergrund: axe kann `color-contrast` in jsdom nicht berechnen (kein Layout).
 * Statt eines Browser-Tests parsen wir `tokens.scss`, lösen die Semantic-Tokens
 * (`--color-*`) pro Theme über die Primitive (`--c-*`) auf und prüfen die
 * Vordergrund/Hintergrund-Rollenpaare gegen die WCAG-Schwellen. So schlägt CI
 * an, sobald jemand ein Token unter den AA-Schwellwert ändert — ohne Browser.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TOKENS = readFileSync(join(__dirname, 'tokens.scss'), 'utf8');

// --- WCAG-Kontrastberechnung (sRGB → relative Luminanz) ---------------------
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function ratio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// --- tokens.scss parsen ------------------------------------------------------
/** Alle Primitive `--c-*: #hex;` (theme-unabhängig, eindeutige Namen). */
function parsePrimitives(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of TOKENS.matchAll(/(--c-[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

const PRIMITIVES = parsePrimitives();

/**
 * Löst einen Token-Wert (`#hex` oder `var(--c-…)`) zu einem #hex auf. Ein Wert, der
 * keine deckende Farbe ist (etwa der Scrim `rgba(…)`), ergibt `null` und bleibt
 * außerhalb der Prüfung.
 */
function resolve(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  const varMatch = v.match(/^var\((--[\w-]+)\)$/);
  if (varMatch) {
    const ref = PRIMITIVES[varMatch[1]];
    if (!ref) throw new Error(`Unaufgelöste Token-Referenz: ${varMatch[1]}`);
    return ref;
  }
  if (v.startsWith('rgba(')) return null;
  throw new Error(`Unerwarteter Token-Wert: ${value}`);
}

/** Semantic-Block für ein Theme aus tokens.scss ausschneiden + Map bauen. */
function parseSemantic(theme: 'light' | 'dark'): Record<string, string> {
  const darkIdx = TOKENS.indexOf("data-theme='dark'");
  const lightIdx = TOKENS.indexOf("data-theme='light'");
  const block =
    theme === 'light' ? TOKENS.slice(lightIdx, darkIdx) : TOKENS.slice(darkIdx);
  const map: Record<string, string> = {};
  for (const m of block.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    const hex = resolve(m[2]);
    if (hex) map[m[1]] = hex;
  }
  return map;
}

const LIGHT = parseSemantic('light');
const DARK = parseSemantic('dark');

// --- Rollenpaare -------------------------------------------------------------
const AA_TEXT = 4.5; // 1.4.3 normaler Text
const AA_NONTEXT = 3.0; // 1.4.11 UI-Komponenten / Fokus / Grenzen

interface Pair {
  name: string;
  fg: string;
  bg: string;
  min: number;
}

function textPairs(t: Record<string, string>): Pair[] {
  const p = (name: string, fg: string, bg: string, min = AA_TEXT): Pair => ({
    name,
    fg: t[fg],
    bg: t[bg],
    min,
  });
  return [
    p('text / bg', '--color-text', '--color-bg'),
    p('text / surface', '--color-text', '--color-surface'),
    p('text / bg-elevated', '--color-text', '--color-bg-elevated'),
    p('text / surface-sunken', '--color-text', '--color-surface-sunken'),
    p('text-muted / bg', '--color-text-muted', '--color-bg'),
    p('text-muted / surface', '--color-text-muted', '--color-surface'),
    p('on-primary / primary', '--color-on-primary', '--color-primary'),
    p('primary (link) / bg', '--color-primary', '--color-bg'),
    p('primary (link) / surface', '--color-primary', '--color-surface'),
    p('success / surface', '--color-success', '--color-surface'),
    p('warning / surface', '--color-warning', '--color-surface'),
    p('danger / surface', '--color-danger', '--color-surface'),
    p('info / surface', '--color-info', '--color-surface'),
    // Badge-Chips: Status-/muted-Text auf *-subtle bzw. surface-sunken
    // (app-badge nutzt diese Paare — eigene Hintergründe, nicht surface).
    p('badge neutral: muted / surface-sunken', '--color-text-muted', '--color-surface-sunken'),
    p('badge primary / primary-subtle', '--color-primary', '--color-primary-subtle'),
    p('badge success / success-subtle', '--color-success', '--color-success-subtle'),
    p('badge warning / warning-subtle', '--color-warning', '--color-warning-subtle'),
    p('badge danger / danger-subtle', '--color-danger', '--color-danger-subtle'),
    p('badge info / info-subtle', '--color-info', '--color-info-subtle'),
    // Redesign (one accent): accent text on the surfaces, text on the accent fill,
    // signal colours on the surface, the selected row.
    p('accent-text / bg', '--color-accent-text', '--color-bg'),
    p('accent-text / surface', '--color-accent-text', '--color-surface'),
    p('accent-text / surface-2', '--color-accent-text', '--color-surface-2'),
    p('accent-text / selected (active tab, selected label)', '--color-accent-text', '--color-selected'),
    p('on-accent / accent (fill button, switch)', '--color-on-accent', '--color-accent'),
    p('on-accent-container / accent-container', '--color-on-accent-container', '--color-accent-container'),
    p('danger / surface-1', '--color-danger', '--color-surface-1'),
    p('warning / surface-1', '--color-warning', '--color-surface-1'),
    p('on-selected / selected', '--color-on-selected', '--color-selected'),
    p('text / surface-3 (tonal button, tag)', '--color-text', '--color-surface-3'),
    p('text-muted / surface-2 (filled field)', '--color-text-muted', '--color-surface-2'),
    p('text-subtle / surface (caption, table header)', '--color-text-subtle', '--color-surface'),
    p('text-subtle / surface-2 (field label)', '--color-text-subtle', '--color-surface-2'),
    // Non-Text (1.4.11): Fokus-Ring + Control-Rahmen
    p('focus-ring / bg', '--color-focus-ring', '--color-bg', AA_NONTEXT),
    p('focus-ring / surface', '--color-focus-ring', '--color-surface', AA_NONTEXT),
    p('border-strong / surface', '--color-border-strong', '--color-surface', AA_NONTEXT),
    p('border-strong / bg', '--color-border-strong', '--color-bg', AA_NONTEXT),
    p('focus-ring / surface-2 (field focus line)', '--color-focus-ring', '--color-surface-2', AA_NONTEXT),
    p('border-strong / surface-2', '--color-border-strong', '--color-surface-2', AA_NONTEXT),
  ];
}

describe('CD-Token-Kontraste (WCAG 2.1 AA)', () => {
  it('parst Primitive und Semantic-Tokens', () => {
    expect(Object.keys(PRIMITIVES).length).toBeGreaterThan(10);
    expect(LIGHT['--color-text']).toMatch(/^#/);
    expect(DARK['--color-text']).toMatch(/^#/);
    expect(LIGHT['--color-text-muted']).not.toBe(DARK['--color-text-muted']);
  });

  it('hat genau eine Akzentfarbe in beiden Themes', () => {
    expect(LIGHT['--color-accent']).toBe('#72a384');
    expect(DARK['--color-accent']).toBe('#72a384');
    // Kein British-Racing-Green mehr in semantischer Verwendung.
    for (const t of [LIGHT, DARK]) {
      expect(Object.values(t)).not.toContain('#004225');
    }
  });

  it('lässt den Scrim (rgba) aus der Kontrastprüfung', () => {
    expect(LIGHT['--color-scrim']).toBeUndefined();
    expect(TOKENS).toMatch(/--color-scrim:\s*rgba\(/);
  });

  for (const [theme, tokens] of [
    ['light', LIGHT],
    ['dark', DARK],
  ] as const) {
    describe(`Theme: ${theme}`, () => {
      for (const pair of textPairs(tokens)) {
        it(`${pair.name} ≥ ${pair.min}:1`, () => {
          expect(pair.fg).toBeDefined();
          expect(pair.bg).toBeDefined();
          const r = ratio(pair.fg, pair.bg);
          // Hilfreiche Diagnose bei Verstoß.
          expect({ pair: pair.name, fg: pair.fg, bg: pair.bg, ratio: +r.toFixed(2) }).toMatchObject({
            ratio: expect.any(Number),
          });
          expect(r).toBeGreaterThanOrEqual(pair.min);
        });
      }
    });
  }
});

// --- Surface contexts (`_surface.scss`) ----------------------------------------
// A table steps one surface up from its container. Each level must keep the table
// visible against the container, keep the hover visible against the table, and keep the
// header text at 4.5:1 on the table.
const SURFACE = readFileSync(join(__dirname, '_surface.scss'), 'utf8');

/** The `--table-*` and `--dt-gap` values the mixin emits for one level. */
function surfaceContext(level: 1 | 2): Record<string, string> {
  const head = level === 1 ? '@if $level == 1 {' : '} @else if $level == 2 {';
  const start = SURFACE.indexOf(head);
  if (start < 0) throw new Error(`No surface context ${level}`);
  const body = SURFACE.slice(start + head.length, SURFACE.indexOf('}', start + head.length));
  const map: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*var\((--color-[\w-]+)\)\s*;/g)) map[m[1]] = m[2];
  return map;
}

describe('surface contexts: a table on a container (WCAG 2.1 AA)', () => {
  for (const [theme, tokens] of [
    ['light', LIGHT],
    ['dark', DARK],
  ] as const) {
    for (const level of [1, 2] as const) {
      describe(`${theme}, container on surface ${level}`, () => {
        const ctx = surfaceContext(level);
        const hex = (prop: string): string => tokens[ctx[prop]];
        const container = tokens[`--color-surface-${level}`];

        it('sets every table property', () => {
          for (const prop of ['--table-bg', '--table-hover-bg', '--table-raised-bg', '--table-head-fg', '--dt-gap']) {
            expect(hex(prop)).toMatch(/^#/);
          }
        });
        it('puts the table on the next higher surface', () => {
          expect(ctx['--table-bg']).toBe(`--color-surface-${level + 1}`);
          expect(hex('--table-bg')).not.toBe(container);
        });
        it('puts the gap between rows on the container itself', () => {
          expect(hex('--dt-gap')).toBe(container);
        });
        it('keeps the hover and the opened row apart from the table', () => {
          expect(hex('--table-hover-bg')).not.toBe(hex('--table-bg'));
          expect(hex('--table-raised-bg')).not.toBe(hex('--table-bg'));
        });
        it(`header text ≥ ${AA_TEXT}:1 on the table`, () => {
          expect(ratio(hex('--table-head-fg'), hex('--table-bg'))).toBeGreaterThanOrEqual(AA_TEXT);
        });
        it(`body text and muted text ≥ ${AA_TEXT}:1 on the table`, () => {
          expect(ratio(tokens['--color-text'], hex('--table-bg'))).toBeGreaterThanOrEqual(AA_TEXT);
          expect(ratio(tokens['--color-text-muted'], hex('--table-bg'))).toBeGreaterThanOrEqual(AA_TEXT);
        });
      });
    }
  }
});
