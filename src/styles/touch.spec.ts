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
    expect(unguardedHovers('@media (max-width: 767.98px) { .a:hover, .b { x: y; } }')).toEqual([
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

  it('defines one press tint and draws it as a ripple that grows from the press (001314)', () => {
    const tokens = read('tokens.scss');
    expect(tokens).toMatch(/--press-tint: color-mix\(in srgb, currentColor 10%, transparent\);/);
    expect(tokens).not.toContain('--press-scale');
    const press = read('_press.scss');
    expect(press).toMatch(
      /radial-gradient\(\s*circle at var\(--ripple-x, 50%\) var\(--ripple-y, 50%\),\s*var\(--press-tint\) var\(--press-ripple\),\s*transparent var\(--press-ripple\)\s*\)/,
    );
    expect(press).toMatch(/animation: press-ripple var\(--motion-slow\) var\(--ease-standard\) forwards;/);
    expect(press).toMatch(/animation: press-fade var\(--motion-base\) var\(--ease-standard\) forwards;/);
    expect(press).toMatch(/@mixin press \{\s*@include host;/);
    expect(press).toMatch(/@mixin press-on\(\$child\) \{\s*@include host;/);
    expect(press).not.toMatch(/\bscale:/);
    const base = read('base.scss');
    for (const prop of ['--press-ripple', '--press-fade', '--press-host']) {
      expect(base).toMatch(new RegExp(`@property ${prop} \\{[^}]*inherits: false;`));
    }
    expect(base).toMatch(/@keyframes press-ripple \{[\s\S]*?--press-ripple: var\(--ripple-r, 150vmax\);/);
    // With less motion every animation runs to its end at once, so the tint shows at once.
    expect(base).toMatch(/animation-duration: 0\.01ms !important;/);
    expect(read('display-settings.scss')).not.toContain('--press-scale');
    expect(base).toMatch(/-webkit-tap-highlight-color: transparent;/);
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

  it('shrinks no pressed element of the kit, because the ripple replaces the shrink', () => {
    const offenders = kitStyles()
      .filter((file) => {
        const text = readFileSync(file, 'utf8');
        return /press-scale|scale var\(--motion-xs\)|\$scale/.test(text);
      })
      .map((file) => relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it('paints the ripple in a press state of its own (outside the mixins)', () => {
    const offenders = kitStyles()
      .filter((file) => !file.endsWith('_press.scss'))
      .filter((file) => {
        const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        return /:active\b/.test(text) && !text.includes('@include press.paint');
      })
      .map((file) => relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it.each([
    ['option row', '_option-menu.scss'],
    ['menu row', '../lib/row-menu/row-menu.component.scss'],
    ['card', '../lib/card/card.component.scss'],
    ['autocomplete option', '../lib/autocomplete/autocomplete.component.scss'],
    ['tab', '../lib/tabs/tabs.component.scss'],
  ])('ripples a %s, also when it is wide', (_name, path) => {
    expect(read(path)).toContain('@include press.press;');
  });

  it.each([
    ['button', '../lib/button/button.component.scss', true],
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

  it('ripples only inside a pressed segment and never shrinks the control (001315)', () => {
    const scss = read('../lib/segmented/segmented.component.scss');
    expect(scss).toMatch(/\.seg \{[^}]*@include press\.press-part\('\.seg__opt'\);/);
    expect(scss).not.toMatch(/@include press\.press;/);
    expect(scss).toContain('@include press.chrome-text;');
    const press = read('_press.scss');
    expect(press).toMatch(/@mixin press-part\(\$part\) \{\s*#\{\$part\} \{\s*@include host;/);
  });

  it.each([
    ['option menu', '_option-menu.scss', /@mixin menu\(\$padding: 6px,/],
    ['row menu', '../lib/row-menu/row-menu.component.scss', /\.rm__menu \{[^}]*padding: 6px;/],
  ])('insets the rows of the %s, so a pressed row is a rounded tile', (_name, path, padding) => {
    expect(read(path)).toMatch(padding);
  });

  it.each([
    ['option row', '_option-menu.scss', /@mixin option \{[^}]*border-radius: var\(--radius-md\);/],
    ['menu row', '../lib/row-menu/row-menu.component.scss', /\.rm__item \{[^}]*border-radius: var\(--radius-md\);/],
  ])('rounds the %s inside the menu', (_name, path, radius) => {
    expect(read(path)).toMatch(radius);
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
    // No scroll bar and no reserved gutter on a touch screen.
    expect(rule).toMatch(/scrollbar-width: none !important;\s*scrollbar-gutter: auto !important;/);
    expect(rule).toMatch(/\*::-webkit-scrollbar \{\s*display: none;\s*width: 0;\s*height: 0;/);
    expect(read('_press.scss')).toMatch(
      /@mixin selectable \{\s*-webkit-user-select: text;\s*user-select: text;\s*-webkit-touch-callout: default;/,
    );
  });

  it('keeps the sheets clear of the status bar, the home bar and the notch', () => {
    const sheet = read('../lib/side-sheet/side-sheet.component.scss');
    // A sheet from the side is attached to the window edge; its padding keeps the content
    // clear of the safe areas.
    expect(sheet).toContain(
      'padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)\n    env(safe-area-inset-bottom, 0px) 0;',
    );
    expect(sheet).toContain(
      'padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px)\n    env(safe-area-inset-left, 0px);',
    );
    for (const side of ['top', 'bottom']) {
      expect(sheet).toContain(`${side}: calc(8px + env(safe-area-inset-${side}, 0px));`);
    }
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
