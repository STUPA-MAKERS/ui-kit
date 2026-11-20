/**
 * Style contract of the frame. jsdom does no layout, so this spec reads the styles: the
 * height of a fill page, the place of the toasts on a phone and the empty footer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const shell = readFileSync(join(__dirname, 'shell.component.scss'), 'utf8');

/** The declarations of the first rule with exactly this selector. */
function rule(css: string, selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`(?:^|\\n)${esc} \\{([^}]*)\\}`));
  if (!m) throw new Error(`No rule ${selector}`);
  return m[1];
}

describe('shell styles', () => {
  it('makes a fill page one screen high, so only its panes scroll', () => {
    expect(rule(shell, '.frame--fill')).toMatch(/height: 100dvh;/);
    expect(rule(shell, '.frame--fill .frame__body')).toMatch(/flex: 1 1 0;[^}]*min-height: 0;/);
    expect(rule(shell, '.main--fill')).toMatch(/flex: 1 1 0;[^}]*min-height: 0;/);
    expect(rule(shell, '.frame--rail .main.main--fill')).toMatch(
      /--main-pad-bottom: var\(--pane-foot-gap\);/,
    );
    expect(rule(shell, '.frame--phone .main.main--fill')).toMatch(
      /--main-pad-bottom: var\(--space-3\);/,
    );
  });

  it('gives the toast host no box and leaves the phone toasts at the top', () => {
    expect(rule(shell, 'app-toast')).toMatch(/display: contents;/);
    expect(shell).not.toContain('app-toast ::ng-deep .toasts');
  });

  it('puts the phone top bar in the column and gives the top safe area to the bar', () => {
    expect(rule(shell, '.frame__topbar')).toMatch(/flex: none;/);
    expect(rule(shell, '.frame--topbar')).toMatch(/--app-top-safe-area: 0px;/);
  });

  it('gives an empty footer no box and no safe-area padding', () => {
    expect(rule(shell, '.frame__footer:empty')).toMatch(/display: none;/);
  });
});
