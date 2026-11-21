import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { Action } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { StatusScreenComponent, type StatusKind } from './status-screen.component';

const ACTIONS: readonly Action[] = [
  { key: 'retry', label: 'Erneut versuchen' },
  { key: 'home', label: 'Zur Startseite', route: { commands: ['/'] } },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [StatusScreenComponent],
  template: `
    <div [style.width.px]="width()">
      <app-status-screen
        [kind]="kind()"
        heading="Kein Zugriff"
        body="Für diesen Bereich fehlt dir die erforderliche Berechtigung."
        [actions]="actions"
        (action)="onAction($event)"
      />
    </div>
  `,
})
class Host {
  readonly width = input(1200);
  readonly kind = input<StatusKind>('forbidden');
  readonly actions = ACTIONS;
  onAction = jest.fn();
}

async function setup(inputs: Partial<{ width: number; kind: StatusKind }> = {}) {
  const view = await render(Host, { inputs, providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('StatusScreenComponent', () => {
  it('shows the code, the heading and the text', async () => {
    await setup();
    expect(screen.getByText('403').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('heading', { level: 1, name: 'Kein Zugriff' })).toBeTruthy();
    expect(screen.getByText(/fehlt dir die erforderliche Berechtigung/)).toBeTruthy();
  });

  it.each([
    ['not-found', '404'],
    ['error', '500'],
  ] as const)('shows the code of %s', async (kind, code) => {
    await setup({ kind });
    expect(screen.getByText(code)).toBeTruthy();
  });

  it('shows no code while offline', async () => {
    const { view } = await setup({ kind: 'offline' });
    expect(view.container.querySelector('.err__code')).toBeNull();
  });

  it('shows a route as a link and reports a button with its key', async () => {
    const { host } = await setup();
    expect(screen.getByRole('link', { name: 'Zur Startseite' }).getAttribute('href')).toBe('/');
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(host.onAction).toHaveBeenCalledWith({ key: 'retry' });
  });

  it.each([360, 700, 1200])('has no axe violations at %ipx', async (width) => {
    const { view } = await setup({ width });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
