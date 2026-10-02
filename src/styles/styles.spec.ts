/**
 * Source checks of the design-system rules that jsdom cannot see: component styles are
 * not applied in a unit test, so these read the SCSS and assert the rule is written.
 * The pixel checks of the running app cover what the rules look like.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string): string => readFileSync(join(__dirname, rel), 'utf8');

/** The body of a mixin or rule block, from its opening brace to the matching one. */
function block(source: string, head: string): string {
  const start = source.indexOf(head);
  if (start < 0) throw new Error(`block not found: ${head}`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`unbalanced block: ${head}`);
}

/** The block without its nested state blocks (`&:hover { … }` and so on). */
function restingState(body: string): string {
  return body.replace(/&[^{]*\{[^}]*\}/g, '');
}

const FIELD = read('_field.scss');

describe('design-system rules in the stylesheets', () => {
  it('draws fields without a shadow at rest; only focus and error draw an inside line', () => {
    const box = block(FIELD, '@mixin box {');
    expect(restingState(box)).not.toMatch(/box-shadow\s*:/);
    expect(box).toMatch(/&:focus-within\s*\{\s*box-shadow: inset 0 0 0 2px var\(--color-focus-ring\)/);
    expect(block(FIELD, '@mixin control {')).not.toMatch(/box-shadow\s*:/);
    expect(block(FIELD, '@mixin box-invalid {')).toMatch(/inset 0 0 0 2px var\(--color-danger\)/);
    expect(box).toMatch(/background: var\(--color-surface-sunken\)/);
    expect(box).toMatch(/border-radius: var\(--radius-field\)/);
  });

  it.each([
    ['input', '../lib/input/input.component.scss'],
    ['select', '../lib/select/select.component.scss'],
    ['datepicker', '../lib/datepicker/datepicker.component.scss'],
    ['time input', '../lib/time-input/time-input.component.scss'],
    ['currency input', '../lib/currency-input/currency-input.component.scss'],
  ])('builds the %s on the shared filled field', (_name, path) => {
    const scss = read(path);
    expect(scss).toContain("@use '../../styles/field' as f;");
    expect(scss).toContain('@include f.box;');
    expect(scss).not.toMatch(/box-shadow\s*:/);
    expect(scss).not.toMatch(/border: var\(--border-width\) solid/);
  });

  it('draws the danger button as an outline, never filled', () => {
    const danger = block(read('../lib/button/button.component.scss'), '.btn--danger {');
    expect(danger).toMatch(/background: transparent/);
    expect(danger).toMatch(/color: var\(--color-danger\)/);
  });

  it('keeps the block modifier to the width, so the base button rule applies to every button', () => {
    const scss = read('../lib/button/button.component.scss');
    expect(block(scss, ':host(.btn-block) .btn {').replace(/\s+/g, ' ')).toBe(
      ':host(.btn-block) .btn { width: 100%; }',
    );
    const base = block(scss, '\n.btn {');
    expect(base).toMatch(/border-radius: var\(--radius-pill\)/);
    expect(base).toMatch(/display: inline-flex/);
  });

  it('draws the filter chip 32px high with radius 8, in the selection colour when on', () => {
    for (const scss of [read('base.scss'), read('../lib/filter/filter-bar.component.scss')]) {
      const chip = block(scss, '.chip {');
      expect(chip).toMatch(/height: var\(--control-height-sm\)/);
      expect(chip).toMatch(/border-radius: var\(--radius-md\)/);
    }
    expect(read('base.scss')).toMatch(/\.chip\.on,[\s\S]*?background: var\(--color-selected\)/);
  });

  it('gives a selected table row the selection colour, its pinned cells included', () => {
    const scss = read('../lib/data-table/data-table.component.scss');
    expect(block(scss, '.dt__table tbody tr.dt__row--selected td {')).toMatch(
      /background: var\(--color-selected\)/,
    );
    expect(scss).toMatch(/tr\.dt__row--selected:hover td\.dt__cell--stickyEnd[\s\S]*?--pin-bg: var\(--color-selected\)/);
    expect(block(scss, '.dt__table tbody tr {')).toMatch(/height: 3\.5rem/);
  });

  it('draws the dialog as a sheet with radius 24', () => {
    const scss = read('../lib/dialog/dialog.component.scss');
    expect(block(scss, '.dialog {')).toMatch(/border-radius: var\(--radius-2xl\)/);
    expect(read('tokens.scss')).toMatch(/--radius-2xl: 24px;/);
  });

  it('uses IBM Plex for the sans and mono faces', () => {
    const tokens = read('tokens.scss');
    expect(tokens).toMatch(/--font-sans: 'IBM Plex Sans'/);
    expect(tokens).toMatch(/--font-mono: 'IBM Plex Mono'/);
    const fonts = read('fonts.scss');
    expect(fonts).not.toMatch(/Archivo/);
    for (const w of [400, 500, 600, 700]) {
      expect(fonts).toContain(`ibm-plex-sans-latin-${w}-normal.woff2`);
    }
    for (const w of [400, 500]) {
      expect(fonts).toContain(`ibm-plex-mono-latin-${w}-normal.woff2`);
    }
  });
});
