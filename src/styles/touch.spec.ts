/**
 * Source checks of the touch rules: a hover that does not stick after a tap, one press
 * state for every tappable control, and control labels that a long press does not select.
 * jsdom applies no component styles, so these read the SCSS.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pressUses } from '../../testing/scss';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(join(__dirname, rel), 'utf8');

function scssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules') return [];
    if (statSync(path).isDirectory()) return scssFiles(path);
    return name.endsWith('.scss') ? [path] : [];
  });
}

/**
 * The selectors with `:hover` that no `@media (hover: hover)` block holds. On a touch
 * screen a tap sets `:hover` and it stays until the next tap elsewhere, so such a rule
 * paints a stuck hover.
 */
function unguardedHovers(source: string): string[] {
  const text = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/#\{[^}]*\}/g, 'x');
  const stack: string[] = [];
  const found: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      const prelude = text.slice(start, i).trim();
      const guarded = stack.some((p) => /^@media\b[^{]*\(\s*hover\s*:\s*hover\s*\)/.test(p));
      if (!prelude.startsWith('@') && prelude.includes(':hover') && !guarded) found.push(prelude);
      stack.push(prelude);
      start = i + 1;
    } else if (c === '}') {
      stack.pop();
      start = i + 1;
    } else if (c === ';') {
      start = i + 1;
    }
  }
  return found;
}

const kitStyles = (): string[] => [join(ROOT, 'src'), join(ROOT, 'markdown-editor', 'src')].flatMap((dir) => {
  try {
    return scssFiles(dir);
  } catch {
    return [];
  }
});

describe('touch rules in the stylesheets', () => {
  it('finds a hover outside the hover media query, also nested and in a list', () => {
    expect(unguardedHovers('.a:hover { color: red; }')).toEqual(['.a:hover']);
    expect(unguardedHovers('.a { &:hover { color: red; } }')).toEqual(['&:hover']);
    expect(unguardedHovers('@media (max-width: 768px) { .a:hover, .b { x: y; } }')).toEqual([
      '.a:hover, .b',
    ]);
    expect(unguardedHovers('@media (hover: hover) { .a:hover { x: y; } }')).toEqual([]);
    expect(unguardedHovers('.a { @media (hover: hover) { &:hover { x: y; } } }')).toEqual([]);
    expect(unguardedHovers('/* .a:hover { } */ .b { x: y; }')).toEqual([]);
  });

  it('puts every hover of the kit behind @media (hover: hover)', () => {
    const offenders = [join(ROOT, 'src'), join(ROOT, 'markdown-editor', 'src')]
      .flatMap(scssFiles)
      .flatMap((file) =>
        unguardedHovers(readFileSync(file, 'utf8')).map((s) => `${relative(ROOT, file)}: ${s}`),
      );
    expect(offenders).toEqual([]);
  });

  it('defines one press tint and two press scales, for a row and for a control', () => {
    const tokens = read('tokens.scss');
    expect(tokens).toMatch(/--press-tint: color-mix\(in srgb, currentColor 10%, transparent\);/);
    expect(tokens).toMatch(/--press-scale: 0\.98;/);
    expect(tokens).toMatch(/--press-scale-control: 0\.94;/);
    const press = read('_press.scss');
    expect(press).toMatch(/linear-gradient\(var\(--press-tint\), var\(--press-tint\)\)/);
    // A control shrinks by default; a row asks for the smaller amount.
    expect(press).toMatch(/@mixin press\(\$scale: control\)/);
    expect(press).toMatch(/@mixin press-on\(\$child, \$scale: row\)/);
    expect(press).toMatch(/@return var\(--press-scale-control\);/);
    expect(press).toMatch(/@return var\(--press-scale\);/);
    // The scale never runs with reduced motion, and every press includes the scale.
    const scale = press.indexOf('scale: amount-of($scale);');
    expect(press.slice(0, scale).lastIndexOf('@media (prefers-reduced-motion: no-preference)'))
      .toBeGreaterThan(press.slice(0, scale).lastIndexOf('@mixin press-scale'));
    expect(press.match(/@include press-scale\(\$scale\);/g)).toHaveLength(2);
    expect(read('base.scss')).toMatch(/-webkit-tap-highlight-color: transparent;/);
  });

  it('reads the press uses of a stylesheet with their own transition', () => {
    expect(
      pressUses(`.a { transition: color 1s; .b { transition: none; } @include press.press; }
        .c { @include press.press($scale: row); }`),
    ).toEqual([
      { include: '@include press.press;', selector: '.a', transition: 'transition: color 1s' },
      { include: '@include press.press($scale: row);', selector: '.c', transition: null },
    ]);
  });

  it('shrinks every pressed element of the kit and eases it back on the release', () => {
    const offenders = kitStyles().flatMap((file) =>
      pressUses(readFileSync(file, 'utf8'))
        .filter((u) => u.include.includes('$scale: none') || !u.transition?.includes('scale var(--motion-xs)'))
        .map((u) => `${relative(ROOT, file)}: ${u.selector}`),
    );
    expect(offenders).toEqual([]);
  });

  it('gives a press state of its own (outside the mixins) the scale too', () => {
    const offenders = kitStyles()
      .filter((file) => !file.endsWith('_press.scss'))
      .filter((file) => {
        const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        return /:active\b/.test(text) && !text.includes('@include press.press-scale');
      })
      .map((file) => relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it.each([
    ['option row', '_option-menu.scss'],
    ['menu row', '../lib/row-menu/row-menu.component.scss'],
    ['card', '../lib/card/card.component.scss'],
    ['autocomplete option', '../lib/autocomplete/autocomplete.component.scss'],
  ])('shrinks a %s by the row amount, because it is wide', (_name, path) => {
    expect(read(path)).toContain('@include press.press($scale: row);');
  });

  it.each([
    ['button', '../lib/button/button.component.scss', true],
    ['segment', '../lib/segmented/segmented.component.scss', true],
    ['tab', '../lib/tabs/tabs.component.scss', true],
    ['row menu', '../lib/row-menu/row-menu.component.scss', true],
    ['filter chip', 'base.scss', true],
    ['option row', '_option-menu.scss', true],
    ['card', '../lib/card/card.component.scss', false],
  ])('gives the %s the shared press', (_name, path, chrome) => {
    const scss = read(path);
    expect(scss).toMatch(/@use '(\.\.\/\.\.\/styles\/)?press';/);
    expect(scss).toMatch(/@include press\.press(\(\$scale: row\))?;/);
    if (chrome) expect(scss).toContain('@include press.chrome-text;');
  });

  it('keeps the interface unselectable on a touch screen, and the content selectable', () => {
    const base = read('base.scss');
    const start = base.indexOf('@media (hover: none) and (pointer: coarse) {');
    expect(start).toBeGreaterThan(-1);
    const rule = base.slice(start, base.indexOf('\n}\n', start));
    expect(rule).toMatch(/html \{\s*@include press\.chrome-text;/);
    for (const content of ['input,', 'textarea,', "[contenteditable]:not([contenteditable='false']),", '.selectable,', '.kv dd,', '.fld__value,', '.lfld__value {']) {
      expect(rule).toContain(content);
    }
    expect(rule).toMatch(/\.lfld__value \{\s*@include press\.selectable;/);
    expect(rule).toMatch(/img \{\s*-webkit-user-drag: none;/);
    expect(read('_press.scss')).toMatch(
      /@mixin selectable \{\s*-webkit-user-select: text;\s*user-select: text;\s*-webkit-touch-callout: default;/,
    );
  });

  it('keeps the sheets clear of the status bar, the home bar and the notch', () => {
    const sheet = read('../lib/side-sheet/side-sheet.component.scss');
    for (const side of ['top', 'bottom']) {
      expect(sheet).toContain(`${side}: calc(12px + env(safe-area-inset-${side}, 0px));`);
      expect(sheet).toContain(`${side}: calc(8px + env(safe-area-inset-${side}, 0px));`);
    }
    expect(sheet).toContain('right: calc(12px + env(safe-area-inset-right, 0px));');
    expect(sheet).toContain('left: calc(12px + env(safe-area-inset-left, 0px));');
    expect(read('../lib/dialog/dialog.component.scss')).toContain(
      'padding-inline: env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px);',
    );
  });

  it('tints a list row while its title is pressed, not while a trail button is', () => {
    expect(read('../lib/list-item/list-item.component.scss')).toContain(
      "@include press.press-on('.li__title');",
    );
    expect(read('rowgroup.scss')).toContain("@include press.press-on('.hitrow__open');");
  });
});
