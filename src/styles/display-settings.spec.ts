/**
 * The global rules of the display settings (`display-settings.scss`), read as text,
 * because jsdom computes no colours.
 *
 * - §000595 more contrast: text 7:1 to every surface of its theme, edges 4.5:1.
 * - §000598 highlighted fields: black on yellow at 7:1 or more.
 * - §000614 to §000623: the forms of a control in very high contrast, the focus of a script and
 *   the motion of a script.
 * - §000219, §000596: every style reads the attribute of the setting, no stylesheet asks
 *   the media query itself, because a media query cannot follow the choice of a person.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STYLES = __dirname;
const DISPLAY = readFileSync(join(STYLES, 'display-settings.scss'), 'utf8');
const TOKENS = readFileSync(join(STYLES, 'tokens.scss'), 'utf8');
const FORMS = readFileSync(join(STYLES, '_very-high.scss'), 'utf8');
const BASE = readFileSync(join(STYLES, 'base.scss'), 'utf8');

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
    for (const token of ['--field-text', '--field-label', '--check-mark', '--field-danger']) {
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

describe('highlightedButtons (§000598)', () => {
  it('makes every button with a surface black on yellow with the field edge', () => {
    const button = readFileSync(join(STYLES, '../lib/button/button.component.scss'), 'utf8');
    expect(button).toMatch(
      /\.btn--fill,\s*\.btn--tonal,\s*\.btn--outlined,\s*\.btn--text \{\s*(\/\*[^*]*\*\/\s*)?background: var\(--field-bg\);\s*color: var\(--field-text\);/,
    );
    expect(button).toMatch(/\.btn--fab \{\s*background: var\(--field-bg\);/);
    expect(button).toMatch(
      /\.btn--danger \{\s*background: var\(--field-bg\);\s*color: var\(--field-danger\);/,
    );
  });
  it('makes the count plate black with a yellow number', () => {
    const button = readFileSync(join(STYLES, '../lib/button/button.component.scss'), 'utf8');
    expect(button).toMatch(
      /\.btn > \.btn__count\.num \{\s*background: var\(--field-text\);\s*color: var\(--field-bg\);/,
    );
  });
});

describe('highlightedOwnChecks (§000598)', () => {
  it.each(['filter-select/filter-select.component.scss', 'data-table/data-table.component.scss'])(
    '%s draws its own check box from the check tokens',
    (file) => {
      const css = readFileSync(join(STYLES, '../lib', file), 'utf8');
      expect(css).toContain('var(--check-on, var(--color-accent))');
      expect(css).toContain('var(--check-edge, var(--color-border-strong))');
      expect(css).toContain('var(--check-checked-edge, none)');
    },
  );
});

describe('highlightedRing (§000598)', () => {
  it('covers the outer rim of every yellow surface with a black ring', () => {
    expect(DISPLAY).toMatch(
      /\.sp,[\s\S]*?input\[type='radio'\] \{\s*outline: 2px solid var\(--field-text\);\s*outline-offset: -2px;/,
    );
    const field = readFileSync(join(STYLES, '_field.scss'), 'utf8');
    expect(field).toMatch(
      /@mixin -ring \{\s*outline: 2px solid var\(--field-text\);\s*outline-offset: -2px;/,
    );
  });
});

describe('highlightedChosenRow (§000598)', () => {
  it.each([
    ['select/select.component.scss', ".sel__option[aria-selected='true']"],
    ['filter-select/filter-select.component.scss', ".fs__option[aria-selected='true']"],
    ['row-menu/row-menu.component.scss', ".rm__item[aria-checked='true']"],
  ])('%s paints the chosen row black on yellow', (file, selector) => {
    const css = readFileSync(join(STYLES, '../lib', file), 'utf8');
    expect(css).toContain(`${selector} {\n  @include f.highlight-chosen;\n}`);
  });
});

describe('highlightedCurrentRow (§000598)', () => {
  it('paints the current list row and a selected table row black on yellow', () => {
    const li = readFileSync(join(STYLES, '../lib/list-item/list-item.component.scss'), 'utf8');
    expect(li).toMatch(/\.li--on \{[^}]*@include f\.highlight-chosen;/);
    const dt = readFileSync(join(STYLES, '../lib/data-table/data-table.component.scss'), 'utf8');
    expect(dt).toMatch(
      /tr\.dt__row--selected td \{[^}]*@include f\.highlight-chosen\(\$edge: false\);/,
    );
  });
});

describe('highlightedFocus (§000598)', () => {
  it('draws the focus as a black inner ring with a yellow ring outside it', () => {
    expect(DISPLAY).toMatch(/--field-focus: inset 0 0 0 3px #000000, 0 0 0 3px #ffe600;/);
    expect(DISPLAY).toMatch(/outline: 3px solid #ffe600 !important;/);
    expect(DISPLAY).toMatch(/box-shadow: inset 0 0 0 3px #000000 !important;/);
    const field = readFileSync(join(STYLES, '_field.scss'), 'utf8');
    expect(field).toMatch(/box-shadow: var\(--field-focus, inset 0 0 0 var\(--focus-width, 2px\)/);
  });
});

describe('highlightedToasts (§000598)', () => {
  it('makes the toast card and the toast bar black on yellow with the black edge', () => {
    const toast = readFileSync(join(STYLES, '../lib/toast/toast.component.scss'), 'utf8');
    expect(toast).toMatch(
      /background: var\(--field-bg\);\s*color: var\(--field-text\);\s*-webkit-backdrop-filter: none;/,
    );
    expect(toast).toContain('box-shadow: var(--field-edge), var(--shadow-elevated);');
    expect(toast).toContain(
      'box-shadow: inset 0 0 0 2px var(--field-danger), var(--shadow-elevated);',
    );
    const bar = readFileSync(join(STYLES, '../lib/toast/toast-bar.component.scss'), 'utf8');
    expect(bar).toMatch(/--tbar-fg: var\(--field-text\);\s*background: var\(--field-bg\);/);
  });
});

describe('highlightedRowMenu (§000598)', () => {
  it('makes the row menu black on yellow and the open button yellow on black', () => {
    const rm = readFileSync(join(STYLES, '../lib/row-menu/row-menu.component.scss'), 'utf8');
    expect(rm).toMatch(
      /\.rm__menu \{[^}]*--color-danger: var\(--field-danger\);[^}]*background: var\(--field-bg\);[^}]*box-shadow: var\(--field-edge\), var\(--shadow-elevated\);/,
    );
    expect(rm).toMatch(
      /\.rm__trigger--on \{\s*background: var\(--field-text\);\s*color: var\(--field-bg\);/,
    );
    expect(DISPLAY).toMatch(
      /:is\(button, a\)\[aria-label\]:has\(> app-icon:only-child, > svg:only-child\):not\(\.btn, \.chip\) \{[^}]*background: var\(--field-bg\);/,
    );
  });
});

describe('fabTextCentred', () => {
  it('raises the text of a FAB by 0.5px and keeps its icon in place', () => {
    const button = readFileSync(join(STYLES, '../lib/button/button.component.scss'), 'utf8');
    expect(button).toMatch(/\.btn--fab \.btn__label \{\s*padding-block-end: 1px;/);
    expect(button).toMatch(/> app-icon \{\s*margin-block-start: 1px;/);
  });
});

describe('listItemTrail', () => {
  it('lets the pointer through the trailing slot except on its controls', () => {
    const li = readFileSync(join(STYLES, '../lib/list-item/list-item.component.scss'), 'utf8');
    expect(li).toMatch(/\.li__trail \{\s*position: relative;\s*z-index: 1;\s*pointer-events: none;/);
    expect(li).toMatch(/\[tabindex\]:not\(\[tabindex='-1'\]\)\s*\) \{\s*pointer-events: auto;/);
  });
});

describe('highlightedPicked (§000598)', () => {
  it('draws the choice of an autocomplete black in a highlighted field', () => {
    const ac = readFileSync(join(STYLES, '../lib/autocomplete/autocomplete.component.scss'), 'utf8');
    expect(ac).toMatch(/\.ac__picked \{[^}]*color: var\(--field-text, var\(--color-text\)\);/);
    const ta = readFileSync(join(STYLES, '../lib/textarea/textarea.component.scss'), 'utf8');
    expect(ta).toContain('color: var(--field-text, var(--color-text));');
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
      /@media[^{]*prefers-(reduced-motion|contrast|reduced-transparency)/.test(
        readFileSync(f, 'utf8'),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it('turns off the press scale with less motion', () => {
    expect(DISPLAY).toMatch(/--press-scale: 1;\s*--press-scale-control: 1;/);
  });
});

describe('highlightedTagsAndBars (§000598)', () => {
  it('makes a tag a black plate with yellow text', () => {
    const css = readFileSync(join(STYLES, '../lib/badge/badge.component.scss'), 'utf8');
    expect(css).toMatch(
      /\.badge--neutral,\s*\.badge--accent \{\s*background: var\(--field-text\);\s*color: var\(--field-bg\);/,
    );
  });
  it('makes the bar a yellow plate with black parts', () => {
    const css = readFileSync(join(STYLES, '../lib/seg-bar/seg-bar.component.scss'), 'utf8');
    expect(css).toMatch(/\.bar__seg--filled,\s*\.bar__seg--muted \{\s*background: var\(--field-text\);/);
    expect(css).toMatch(/& \{[^}]*padding: 2px;[^}]*background: var\(--field-bg\);/);
  });
});

describe('ringInside (§000598)', () => {
  it('keeps the ring inside the box, so a scroll container does not cut it', () => {
    const field = readFileSync(join(STYLES, '_field.scss'), 'utf8');
    expect(field).not.toContain('outline-offset: -1px');
    expect(DISPLAY).not.toContain('outline-offset: -1px');
  });
});

describe('veryHighContrast (§000605)', () => {
  const start = DISPLAY.indexOf(":root[data-theme][data-very-high-contrast='on']");
  const block = DISPLAY.slice(start, DISPLAY.indexOf('}', start));
  const rules = DISPLAY.slice(DISPLAY.indexOf('@include d.on(veryHigh)'));
  const FOUR = ['#000000', '#ffffff', '#ffff00', '#ff8a8a'];

  it('uses only the four colours for every colour token', () => {
    const values = [...block.matchAll(/--vh-(?:bg|fg|hi|err):\s*(#[0-9a-f]{6});/g)].map((m) => m[1]);
    expect(values).toEqual(FOUR);
    const colours = [...block.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].filter(
      ([, name]) => name !== '--color-scrim',
    );
    expect(colours.length).toBeGreaterThan(30);
    for (const [, , value] of colours) expect(value).toMatch(/^var\(--vh-(bg|fg|hi|err)\)$/);
  });

  it('gives text 21:1 and errors and controls more than 7:1 on black', () => {
    expect(ratio('#ffffff', '#000000')).toBeCloseTo(21, 0);
    expect(ratio('#ffff00', '#000000')).toBeGreaterThan(7);
    expect(ratio('#ff8a8a', '#000000')).toBeGreaterThan(7);
  });

  it('removes every shadow', () => {
    const shadows = [...block.matchAll(/(--shadow-[\w-]+):\s*([^;]+);/g)];
    expect(shadows.length).toBeGreaterThan(5);
    for (const [, , value] of shadows) expect(value).toBe('none');
  });

  it('draws a white edge on the surfaces and turns a state into text with an edge', () => {
    for (const surface of ['.card', '.dialog', '.ss', '.rm__menu', '.sel__menu', '.dt--boxed']) {
      expect(rules).toContain(surface);
    }
    expect(rules).toMatch(/outline: var\(--vh-edge\)/);
    expect(rules).toMatch(/\.badge--status,\s*app-status-text \{[^}]*box-shadow: inset 0 0 0 2px var\(--vh-ink\)/);
  });

  it('underlines a link and draws a disabled button with a dashed edge', () => {
    expect(rules).toMatch(/text-decoration: underline/);
    expect(rules).toMatch(/outline: 2px dashed var\(--vh-fg\)/);
  });
});

/** The source files with this extension under `dir`, without the specs. */
function sources(dir: string, ext: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : sources(path, ext);
    return name.endsWith(ext) && !name.endsWith(`.spec${ext}`) ? [path] : [];
  });
}

/** The rules of the controls in very high contrast: the last block of the stylesheet. */
const CONTROLS = DISPLAY.slice(DISPLAY.indexOf('// --- The controls in very high contrast'));

/** The declarations of the rule in `CONTROLS` whose selector list has this selector. */
function controlRule(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = CONTROLS.match(new RegExp(`(?:^|\\n)\\s*${esc}(?:,[^{]*)? \\{([^}]*)\\}`));
  if (!m) throw new Error(`No rule ${selector}`);
  return m[1];
}

describe('everyControlShowsYellow (§000614)', () => {
  it('gives a link and a button without a look of its own yellow text', () => {
    expect(CONTROLS).toMatch(
      /:is\(a\[href\], button, summary, \[role='button'\], \[role='link'\]\) \{\s*color: var\(--vh-press, var\(--vh-hi\)\);/,
    );
  });

  it('keeps the accent text white, so a text that is no control is not yellow', () => {
    expect(DISPLAY).toMatch(/--color-accent-text: var\(--vh-fg\);/);
  });

  it('has the three forms: a yellow fill, a yellow edge and yellow text', () => {
    expect(FORMS).toMatch(/@mixin fill \{[^}]*background: var\(--vh-hi\) !important;\s*color: var\(--vh-bg\) !important;/);
    expect(FORMS).toMatch(
      /@mixin edge \{[^}]*background: var\(--vh-bg\) !important;\s*color: var\(--vh-hi\) !important;[^}]*outline: 2px solid var\(--vh-hi\) !important;/,
    );
    expect(FORMS).toMatch(/@mixin text \{[^}]*color: var\(--vh-hi\) !important;/);
  });
});

describe('chosenIsYellowFill (§000615)', () => {
  const CHOICES: readonly (readonly [string, string])[] = [
    ['.seg__opt', '.seg__opt--on'],
    ["[role='tablist'] [role='tab']", "[role='tablist'] [role='tab'][aria-selected='true']"],
    ['.chip', '.chip.on'],
    ['.rm__trigger', '.rm__trigger--on'],
    [".btn[aria-pressed='false']", ".btn[aria-pressed='true']"],
    [".btn[aria-expanded='false']", ".btn[aria-expanded='true']"],
  ];

  it.each(CHOICES)('%s has the edge and %s has the fill', (other, chosen) => {
    const edge = CONTROLS.slice(CONTROLS.indexOf('  .seg__opt,'), CONTROLS.indexOf('@include vh.edge;'));
    const fill = CONTROLS.slice(CONTROLS.indexOf('  .seg__opt--on,'), CONTROLS.indexOf('@include vh.fill;'));
    expect(edge).toContain(`${other},`.replace(/,$/, ''));
    expect(fill).toContain(chosen);
  });

  it('the fields block draws no second look for a chip, a tab or a pressed button', () => {
    const fields = DISPLAY.slice(DISPLAY.indexOf('@include d.on(fields)'), DISPLAY.indexOf('// --- Very high contrast'));
    expect(fields).not.toMatch(/\.chip\.on \{/);
    expect(fields).not.toMatch(/\[role='tab'\]/);
    expect(fields).not.toMatch(/\[aria-pressed='true'\]:has/);
  });
});

describe('navigationYellowText (§000616)', () => {
  it('gives the entries of the rail and of the bottom bar yellow text without an edge', () => {
    const body = controlRule('.rail__item');
    expect(body).toMatch(/color: var\(--vh-hi\) !important;/);
    expect(body).not.toMatch(/outline|box-shadow/);
    expect(CONTROLS).toMatch(/\.rail__item,\s*\.bb__item,\s*\.am__trigger,/);
  });
});

describe('menusBlackYellowRows (§000617)', () => {
  it('makes every menu black with the white edge', () => {
    const body = controlRule('.rm__menu');
    expect(body).toMatch(/background: var\(--vh-bg\) !important;/);
    expect(body).toMatch(/outline: var\(--vh-edge\) !important;/);
    for (const menu of ['.fs__menu', '.sel__menu', '.ac__list', '.rc__pop']) {
      expect(CONTROLS).toMatch(new RegExp(`\\${menu},?\\s`));
    }
  });

  it('gives a row yellow text, the chosen row the fill, a heading white and a destructive row light red', () => {
    expect(controlRule('.rm__item')).toContain('@include vh.text;');
    expect(controlRule(".rm__item:is([aria-checked='true'], [aria-current='true'])")).toContain('@include vh.fill;');
    expect(controlRule('.rm__cap')).toMatch(/color: var\(--vh-fg\) !important;/);
    expect(controlRule('.rm__item--danger')).toMatch(/color: var\(--vh-err\) !important;/);
  });
});

describe('rowTitleYellow (§000619)', () => {
  it('makes the title of a list row and of a table row yellow', () => {
    expect(controlRule('.li__title')).toMatch(/color: var\(--vh-hi\) !important;/);
    expect(CONTROLS).toContain('tr.dt__row--clickable > td:first-child');
  });

  it('makes the text of the open row black', () => {
    expect(controlRule('.li--on .li__title')).toMatch(/color: var\(--vh-bg\) !important;/);
  });
});

describe('switchOffEdgeOnFill (§000620)', () => {
  it('fills the box only when on', () => {
    const start = DISPLAY.indexOf(":root[data-theme][data-very-high-contrast='on']");
    const tokens = DISPLAY.slice(start, DISPLAY.indexOf('\n}', start));
    expect(tokens).toMatch(/--check-bg: var\(--vh-bg\);/);
    expect(tokens).toMatch(/--check-edge: var\(--vh-hi\);/);
    expect(tokens).toMatch(/--check-on: var\(--vh-hi\);/);
  });

  it('draws the yellow edge on every box and the track of a switch that a person can use', () => {
    const body = controlRule('.cbx__input');
    expect(body).toMatch(/outline: 2px solid var\(--vh-hi\) !important;/);
    expect(CONTROLS).toContain('.sw__track:not(:disabled)');
  });

  it('gives the switch a yellow thumb when off and a black thumb when on', () => {
    const sw = readFileSync(join(STYLES, '../lib/switch/switch.component.scss'), 'utf8');
    expect(sw).toMatch(/\.sw__thumb \{\s*background: #ffff00;/);
    expect(sw).toMatch(/\.sw__track--on \.sw__thumb \{\s*background: #000000;/);
  });
});

describe('textOnYellowIsBlack (§000621)', () => {
  it('a fill turns the texts, the icons and the edges inside it black', () => {
    expect(FORMS).toMatch(/@mixin fill \{\s*@include ink\(var\(--vh-bg\), var\(--vh-bg\)\);/);
    expect(FORMS).toContain('--vh-press: #{$press};');
    for (const token of ['--vh-ink', '--color-text', '--color-text-muted', '--color-border', '--color-accent-text']) {
      expect(FORMS).toContain(`${token}: #{$ink};`);
    }
  });

  it('a status box reads the ink of the fill around it, and an avatar keeps light letters on its black plate', () => {
    expect(DISPLAY).toMatch(/app-status-text \{[^}]*color: var\(--vh-ink\) !important;/);
    expect(DISPLAY).toMatch(/app-avatar \{\s*color: var\(--vh-fg\) !important;\s*box-shadow: inset 0 0 0 2px var\(--vh-fg\);/);
  });
});

describe('noRingOnScriptFocus (§000622)', () => {
  it('the focus rules of the highlighted fields and of very high contrast exclude a script focus', () => {
    const rules = [...DISPLAY.matchAll(/:focus-visible:not\(([^{]*)\) \{/g)].map((m) => m[1]);
    expect(rules.length).toBe(2);
    for (const rule of rules) expect(rule).toContain("[tabindex='-1']");
  });

  it('a heading or a title that a script focuses has no outline', () => {
    expect(BASE).toMatch(/:is\(h1, h2, h3, h4, h5, h6, p, section, main\)\[tabindex='-1'\]:focus \{\s*outline: none;/);
  });
});

describe('scriptsReadMotionSetting (§000623)', () => {
  const files = [...sources(join(STYLES, '..'), '.ts'), ...sources(join(STYLES, '../../shell'), '.ts')];

  it('no script reads the system motion setting itself', () => {
    const allowed = /(breakpoints|display-settings\.service)\.ts$/;
    const offenders = files.filter(
      (f) => !allowed.test(f) && /prefers-reduced-motion/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('no script starts a smooth scroll without the motion setting', () => {
    const offenders = files.filter((f) => /behavior:\s*['"]smooth['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
