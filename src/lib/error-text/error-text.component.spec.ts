import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { ErrorTextComponent } from './error-text.component';

const STYLE = readFileSync(join(__dirname, 'error-text.component.scss'), 'utf8');

describe('ErrorTextComponent', () => {
  it('announces its text as an alert (001963)', async () => {
    const { container } = await render(`<app-error-text>Der Antrag wurde geändert.</app-error-text>`, {
      imports: [ErrorTextComponent],
    });
    const host = container.querySelector('app-error-text')!;
    expect(host.getAttribute('role')).toBe('alert');
    expect(host.classList).toContain('err-text');
    expect(host.classList).not.toContain('err-text--inset');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('indents like the text of a field when inset', async () => {
    const { container } = await render(`<app-error-text [inset]="true">Zu kurz.</app-error-text>`, {
      imports: [ErrorTextComponent],
    });
    expect(container.querySelector('app-error-text')!.classList).toContain('err-text--inset');
    expect(STYLE).toMatch(/\.err-text--inset \{\s*padding-inline: var\(--space-4\);/);
  });

  it('is small and in the danger colour', () => {
    expect(STYLE).toMatch(/\.err-text \{[^}]*color: var\(--color-danger\);[^}]*font-size: var\(--fs-small\);/);
  });
});
