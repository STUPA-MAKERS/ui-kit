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
    expect(rule(shell, '.frame--fill .frame__body')).toMatch(/height: 100dvh;/);
    expect(rule(shell, '.main--fill')).toMatch(/flex: 1 1 0;[^}]*min-height: 0;/);
    expect(rule(shell, '.frame--rail .main.main--fill')).toMatch(
      /--main-pad-bottom: var\(--pane-foot-gap\);/,
    );
    expect(rule(shell, '.frame--phone .main.main--fill')).toMatch(
      /--main-pad-bottom: var\(--space-3\);/,
    );
  });

  it('puts the toasts above the bottom bar on a phone, and follows the inset of the bar', () => {
    expect(rule(shell, 'app-toast')).toMatch(/display: contents;/);
    expect(rule(shell, '.frame--phone app-toast ::ng-deep .toasts')).toMatch(
      /inset-block-end: calc\(var\(--app-bottom-inset\) \+ var\(--space-3\)\);/,
    );
  });

  it('gives an empty footer no box and no safe-area padding', () => {
    expect(rule(shell, '.frame__footer:empty')).toMatch(/display: none;/);
  });
});
