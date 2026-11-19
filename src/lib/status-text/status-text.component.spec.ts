import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { StatusTextComponent } from './status-text.component';

describe('StatusTextComponent', () => {
  it('shows the label as plain text', async () => {
    await render(`<app-status-text kind="warn">In Prüfung</app-status-text>`, {
      imports: [StatusTextComponent],
    });
    expect(screen.getByText('In Prüfung')).toBeInTheDocument();
  });

  it.each(['accent', 'warn', 'error', 'neutral', 'muted'])(
    'carries the class of the %s kind',
    async (kind) => {
      const { container } = await render(
        `<app-status-text [kind]="kind">Status</app-status-text>`,
        { imports: [StatusTextComponent], componentProperties: { kind } },
      );
      const host = container.querySelector('app-status-text') as HTMLElement;
      expect(host.classList.contains('st')).toBe(true);
      expect(host.classList.contains(`st--${kind}`)).toBe(true);
    },
  );

  it('is neutral without a kind', async () => {
    const { container } = await render(`<app-status-text>Eingereicht</app-status-text>`, {
      imports: [StatusTextComponent],
    });
    expect(container.querySelector('app-status-text')?.className).toBe('st st--neutral');
  });

  it('adds no role, so a screen reader reads it as part of the line', async () => {
    const { container } = await render(
      `<p>Antrag · <app-status-text kind="accent">Bewilligt</app-status-text></p>`,
      { imports: [StatusTextComponent] },
    );
    expect(container.querySelector('[role]')).toBeNull();
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('is a chip in a head', async () => {
    const { container } = await render(
      `<app-status-text kind="warn" chip>Protokoll-Entwurf</app-status-text>`,
      { imports: [StatusTextComponent] },
    );
    const host = container.querySelector('app-status-text') as HTMLElement;
    expect(host.classList.contains('st--chip')).toBe(true);
    expect(host.classList.contains('st--warn')).toBe(true);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('is no chip by default', async () => {
    const { container } = await render(`<app-status-text>Eingereicht</app-status-text>`, {
      imports: [StatusTextComponent],
    });
    expect(container.querySelector('app-status-text')?.classList.contains('st--chip')).toBe(false);
  });
});
