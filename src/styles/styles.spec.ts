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

  it('centres a projected icon and text in the button label', () => {
    const scss = read('../lib/button/button.component.scss');
    expect(block(scss, '.btn__label ::ng-deep > * {')).toMatch(/vertical-align: top/);
    expect(block(scss, '.btn__label ::ng-deep > app-icon {')).toMatch(/vertical-align: middle/);
    const iconOnly = block(scss, '.btn--icon .btn__label {');
    expect(iconOnly).toMatch(/display: inline-flex/);
    expect(iconOnly).toMatch(/align-items: center/);
  });

  it('draws a configured badge colour as text, never as a plate', () => {
    const scss = read('../lib/badge/badge.component.scss');
    const custom = block(scss, '.badge--custom {');
    expect(custom).toMatch(/color: var\(--badge-text-light/);
    expect(custom).not.toMatch(/background/);
    expect(scss).toMatch(/data-theme='dark'\]\) \.badge--custom \{\s*color: var\(--badge-text-dark/);
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

  it('colours the whole card for a selected row on a phone, never a box of cells', () => {
    const scss = read('../lib/data-table/data-table.component.scss');
    const last = scss.slice(scss.lastIndexOf('@media (max-width: 768px)'));
    // The cells go transparent and the row takes the colour, after every surface rule.
    expect(block(last, '.dt .dt__table tbody tr > td,')).toMatch(/background: transparent/);
    expect(block(last, '.dt .dt__table tbody tr.dt__row--selected,')).toMatch(
      /background: var\(--color-selected\)/,
    );
  });

  it('puts the card checkbox and actions in the card header with a 44px touch target', () => {
    const scss = read('../lib/data-table/data-table.component.scss');
    expect(block(scss, '.dt__table td.dt__selectCell {')).toMatch(/grid-column: 1;/);
    expect(block(scss, "\n  .dt__table td[data-card='actions'] {\n    grid-column")).toMatch(/grid-column: 3;/);
    const hit = block(scss, '.dt__table td.dt__selectCell .dt__checkHit {');
    expect(hit).toMatch(/width: 2\.75rem/);
    expect(hit).toMatch(/height: 2\.75rem/);
  });

  it('draws the table checkbox as the design-system checkbox, centred in its cell', () => {
    const scss = read('../lib/data-table/data-table.component.scss');
    const box = block(scss, '\n.dt__check {');
    // No native box: it is a grey filled square in the dark theme.
    expect(box).toMatch(/appearance: none/);
    expect(box).toMatch(/box-shadow: inset 0 0 0 2px var\(--color-border-strong\)/);
    expect(block(scss, '.dt__check:checked {')).toMatch(/background: var\(--color-accent\)/);
    expect(block(scss, '.dt__check:indeterminate {')).toMatch(/background: var\(--color-accent\)/);
    expect(block(scss, '.dt__check:focus-visible {')).toMatch(/outline: 2px solid var\(--color-focus-ring\)/);
    // A flex label, so the box sits in the middle of the cell and not on a baseline.
    const hit = block(scss, '\n.dt__checkHit {');
    expect(hit).toMatch(/display: flex/);
    expect(hit).toMatch(/align-items: center/);
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
