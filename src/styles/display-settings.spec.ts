/**
 * The global rules of the display settings (`display-settings.scss`), read as text,
 * because jsdom computes no colours.
 *
 * - §000595 more contrast: text 7:1 to every surface of its theme, edges 4.5:1.
 * - §000598 highlighted fields: black on yellow at 7:1 or more.
 * - §000219, §000596: every style reads the attribute of the setting, no stylesheet asks
 *   the media query itself, because a media query cannot follow the choice of a person.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STYLES = __dirname;
const DISPLAY = readFileSync(join(STYLES, 'display-settings.scss'), 'utf8');
const TOKENS = readFileSync(join(STYLES, 'tokens.scss'), 'utf8');

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function ratio(a: string, b: string): number {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}

function primitive(name: string): string {
  const m = TOKENS.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6});`));
  if (!m) throw new Error(`No primitive ${name}`);
  return m[1];
}

/** The `--color-*` values of the contrast rule of one theme. */
function contrastBlock(selector: string): Record<string, string> {
  const start = DISPLAY.indexOf(selector);
  const block = DISPLAY.slice(start, DISPLAY.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2]]),
  );
}

const THEMES = {
  light: {
    block: contrastBlock(":root:not([data-theme='dark'])[data-contrast='more']"),
    surfaces: ['bg', 'c1', 'c2', 'c3', 'c4', 'sel'].map((s) => primitive(`--c-light-${s}`)),
  },
  dark: {
    block: contrastBlock(":root[data-theme='dark'][data-contrast='more']"),
    surfaces: ['bg', 'c1', 'c2', 'c3', 'c4', 'sel'].map((s) => primitive(`--c-dark-${s}`)),
  },
};

describe('moreContrast (§000595)', () => {
  for (const [theme, { block, surfaces }] of Object.entries(THEMES)) {
    describe(theme, () => {
      const text = [
        '--color-text-muted',
        '--color-text-subtle',
        '--color-accent-text',
        '--color-primary',
        '--color-danger',
        '--color-warning',
      ];
      for (const token of text) {
        it(`${token} has 7:1 on every surface`, () => {
          expect(block[token]).toBeDefined();
          for (const s of surfaces) expect(ratio(block[token], s)).toBeGreaterThanOrEqual(7);
        });
      }
      for (const token of ['--color-border', '--color-border-strong', '--color-focus-ring']) {
        it(`${token} has 4.5:1 on every surface`, () => {
          for (const s of surfaces) expect(ratio(block[token], s)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }

  it('draws a focus ring of 3 px', () => {
    expect(DISPLAY).toMatch(/--focus-width: 3px;/);
    expect(DISPLAY).toMatch(/outline-width: 3px !important;/);
  });
});

describe('highlightedFields (§000598)', () => {
  it('sets black text, label and mark on yellow, with a black edge', () => {
    const yellow = DISPLAY.match(/--field-bg: (#[0-9a-f]{6});/)![1];
    for (const token of ['--field-text', '--field-label', '--check-mark']) {
      const fg = DISPLAY.match(new RegExp(`${token}: (#[0-9a-f]{6});`))![1];
      expect(ratio(fg, yellow)).toBeGreaterThanOrEqual(7);
    }
    expect(DISPLAY).toMatch(/--field-edge: inset 0 0 0 2px #000000;/);
    expect(DISPLAY).toMatch(/--check-edge: #000000;/);
  });

  it('reads the tokens in the field, the checkbox and the switch', () => {
    const field = readFileSync(join(STYLES, '_field.scss'), 'utf8');
    expect(field).toMatch(/var\(--field-bg, var\(--color-surface-sunken\)\)/);
    expect(field).toMatch(/var\(--field-label, var\(--color-text-subtle\)\)/);
    const check = readFileSync(join(STYLES, '_check.scss'), 'utf8');
    expect(check).toMatch(/var\(--check-edge, var\(--color-border-strong\)\)/);
    const sw = readFileSync(join(STYLES, '../lib/switch/switch.component.scss'), 'utf8');
    expect(sw).toMatch(/var\(--check-bg, var\(--color-surface-4\)\)/);
  });
});

describe('highlightedFab (§000598)', () => {
  it('makes a FAB black on yellow with the field edge', () => {
    const button = readFileSync(join(STYLES, '../lib/button/button.component.scss'), 'utf8');
    expect(button).toMatch(
      /@include d\.host-on\(fields\) \{\s*\.btn--fab \{\s*background: var\(--field-bg\);\s*color: var\(--field-text\);/,
    );
  });
});

describe('highlightedFocus (§000598)', () => {
  it('draws the focus as a black ring with a yellow ring outside it', () => {
    expect(DISPLAY).toMatch(/--field-focus: 0 0 0 3px #000000, 0 0 0 6px #ffe600;/);
    expect(DISPLAY).toMatch(/outline: 3px solid #000000 !important;/);
    expect(DISPLAY).toMatch(/box-shadow: 0 0 0 6px #ffe600 !important;/);
    const field = readFileSync(join(STYLES, '_field.scss'), 'utf8');
    expect(field).toMatch(/box-shadow: var\(--field-focus, inset 0 0 0 var\(--focus-width, 2px\)/);
  });
});

describe('lessTransparency (§000596)', () => {
  it('makes the glass solid and removes the blur', () => {
    expect(DISPLAY).toMatch(/--glass-tint: 100%;/);
    expect(DISPLAY).toMatch(/backdrop-filter: none !important;/);
    const frosted = readFileSync(join(STYLES, '_frosted.scss'), 'utf8');
    expect(frosted).not.toMatch(/#\{\$tint\}, transparent\)/);
  });
});

function scssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : scssFiles(path);
    return name.endsWith('.scss') ? [path] : [];
  });
}

describe('settingsFollowChoice (§000219, §000594)', () => {
  it('no stylesheet asks a system media query of a display setting', () => {
    const files = [...scssFiles(join(STYLES, '..')), ...scssFiles(join(STYLES, '../../shell'))];
    const offenders = files.filter((f) =>
      /@media[^{]*prefers-(reduced-motion|contrast|reduced-transparency)/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('turns off the press scale with less motion', () => {
    expect(DISPLAY).toMatch(/--press-scale: 1;\s*--press-scale-control: 1;/);
  });
});
