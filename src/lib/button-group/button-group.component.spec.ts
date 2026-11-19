import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { ButtonComponent } from '../button/button.component';
import { ButtonGroupComponent } from './button-group.component';

const STYLE = readFileSync(join(__dirname, '../../styles/button-group.scss'), 'utf8');

describe('ButtonGroupComponent', () => {
  it('is a named group with the group class', async () => {
    await render(
      `<app-button-group label="Antrag"><app-button>Kommentare</app-button><app-button>Mehr</app-button></app-button-group>`,
      { imports: [ButtonGroupComponent, ButtonComponent] },
    );
    const group = screen.getByRole('group', { name: 'Antrag' });
    expect(group.classList).toContain('btn-grp');
    expect(group.querySelectorAll('button')).toHaveLength(2);
    expect(await runAxe(group)).toHaveNoViolations();
  });

  it('rounds the outer ends to half the height and the inner corners to 8px (001350)', () => {
    expect(STYLE).toMatch(/--btn-grp-in: 8px;/);
    expect(STYLE).toMatch(/--btn-grp-out: calc\(var\(--btn-grp-h\) \/ 2\);/);
    // A large number would make the browser scale the 8px corners down to nothing.
    expect(STYLE).not.toMatch(/999px/);
    expect(STYLE).toMatch(/gap: 2px;/);
  });

  it('fills a selected button with the accent and rounds it fully (001351)', () => {
    expect(STYLE).toMatch(
      /\.btn\[aria-expanded='true'\][^{]*\{\s*border-radius: var\(--btn-grp-out\);\s*background-color: var\(--color-accent\);/,
    );
  });

  it('keeps the accent fill of the main button in a confirm row (001353)', async () => {
    await render(`<app-button-group [main]="true"><app-button variant="fill">OK</app-button></app-button-group>`, {
      imports: [ButtonGroupComponent, ButtonComponent],
    });
    expect(screen.getByRole('group').classList).toContain('btn-grp--main');
    expect(STYLE).toMatch(
      /\.btn-grp--main\.btn-grp--main \.btn--fill:not\(:disabled\) \{\s*background-color: var\(--color-accent\);/,
    );
  });
});
