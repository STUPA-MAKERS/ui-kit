/**
 * Source checks of the touch rules: a hover that does not stick after a tap, one press
 * state for every tappable control, and control labels that a long press does not select.
 * jsdom applies no component styles, so these read the SCSS.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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

  it('defines one press tint and one press scale', () => {
    const tokens = read('tokens.scss');
    expect(tokens).toMatch(/--press-tint: color-mix\(in srgb, currentColor 10%, transparent\);/);
    expect(tokens).toMatch(/--press-scale: 0\.98;/);
    const press = read('_press.scss');
    expect(press).toMatch(/linear-gradient\(var\(--press-tint\), var\(--press-tint\)\)/);
    // The scale never runs with reduced motion.
    for (const m of press.matchAll(/scale: var\(--press-scale\)/g)) {
      expect(press.slice(0, m.index).lastIndexOf('@media (prefers-reduced-motion: no-preference)'))
        .toBeGreaterThan(press.slice(0, m.index).lastIndexOf('@mixin'));
    }
    expect(read('base.scss')).toMatch(/-webkit-tap-highlight-color: transparent;/);
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
    expect(scss).toMatch(/@include press\.press(\(\$scale: true\))?;/);
    if (chrome) expect(scss).toContain('@include press.chrome-text;');
  });

  it('tints a list row while its title is pressed, not while a trail button is', () => {
    expect(read('../lib/list-item/list-item.component.scss')).toContain(
      "@include press.press-on('.li__title', $scale: true);",
    );
    expect(read('rowgroup.scss')).toContain("@include press.press-on('.hitrow__open');");
  });
});
