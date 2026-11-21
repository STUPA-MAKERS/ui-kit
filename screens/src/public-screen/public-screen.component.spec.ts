import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastService, type Action, type LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { ScreenBodyDirective } from '../detail-screen/detail-screen.component';
import { PublicScreenComponent, type PublicCrumb } from './public-screen.component';

const CRUMBS: readonly PublicCrumb[] = [
  { label: 'Start', link: { commands: ['/'] } },
  { label: 'Öffentliche Protokolle' },
];
const ACTIONS: readonly Action[] = [
  { key: 'decisions', label: 'Beschlüsse', icon: 'vote', route: { commands: ['/decisions'] } },
  { key: 'print', label: 'Drucken', kind: 'main' },
];
const HOME: Action = { key: 'home', label: 'Zur Startseite', route: { commands: ['/'] } };

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [PublicScreenComponent, ScreenBodyDirective],
  template: `
    <div [style.width.px]="width()">
      <app-public-screen
        [head]="{ title: 'Öffentliche Protokolle' }"
        lede="Finalisierte Protokolle der öffentlichen Gremien."
        [crumbs]="crumbs"
        [actions]="actions"
        [state]="state()"
        [width]="column()"
        [skeletonRows]="4"
        [emptyAction]="home"
        (action)="onAction($event)"
      >
        <ng-template screenBody><p>Sitzung des AStA</p></ng-template>
      </app-public-screen>
    </div>
  `,
})
class Host {
  readonly width = input(1200);
  readonly column = input<'narrow' | 'wide'>('wide');
  readonly crumbs = CRUMBS;
  readonly actions = ACTIONS;
  readonly home = HOME;
  readonly state = signal<LoadState<unknown>>({ state: 'ready', data: null });
  onAction = jest.fn();
}

async function setup(inputs: Partial<{ width: number; column: 'narrow' | 'wide' }> = {}) {
  const view = await render(Host, { inputs, providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('PublicScreenComponent', () => {
  it('shows the crumbs, the title, the lede and the body', async () => {
    await setup();
    const crumbs = screen.getByRole('navigation', { name: 'Pfad' });
    expect(crumbs.querySelector('a')?.getAttribute('href')).toBe('/');
    expect(
      screen.getByText('Öffentliche Protokolle', { selector: 'span' }).getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByRole('heading', { level: 1, name: 'Öffentliche Protokolle' })).toBeTruthy();
    expect(screen.getByText('Finalisierte Protokolle der öffentlichen Gremien.')).toBeTruthy();
    expect(screen.getByText('Sitzung des AStA')).toBeTruthy();
  });

  it('shows a route as a link and reports a button with its key', async () => {
    const { host } = await setup();
    expect(screen.getByRole('link', { name: /Beschlüsse/ }).getAttribute('href')).toBe(
      '/decisions',
    );
    await userEvent.click(screen.getByRole('button', { name: /Drucken/ }));
    expect(host.onAction).toHaveBeenCalledWith({ key: 'print' });
  });

  it('marks the wide column on the host', async () => {
    const { view } = await setup({ column: 'wide' });
    expect(view.container.querySelector('app-public-screen')?.classList).toContain('pub--wide');
  });

  it('shows the skeleton rows while it loads', async () => {
    const { view, host } = await setup();
    host.state.set({ state: 'loading' });
    view.detectChanges();
    expect(screen.queryByText('Sitzung des AStA')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Wird geladen');
  });

  it('shows the empty state with its button', async () => {
    const { view, host } = await setup();
    host.state.set({ state: 'empty', heading: 'Noch keine öffentlichen Protokolle', icon: 'file' });
    view.detectChanges();
    expect(screen.getByText('Noch keine öffentlichen Protokolle')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Zur Startseite/ }).getAttribute('href')).toBe('/');
    expect(screen.queryByText('Sitzung des AStA')).toBeNull();
  });

  it('shows a load error as a toast with Erneut versuchen', async () => {
    const { view, host } = await setup();
    const toast = jest.spyOn(TestBed.inject(ToastService), 'showAction');
    const retry = jest.fn();
    host.state.set({ state: 'error', message: 'Konnte nicht geladen werden.', retry });
    view.detectChanges();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Konnte nicht geladen werden.',
        action: 'Erneut versuchen',
      }),
    );
    toast.mock.calls[0][0].closed('action');
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it.each([360, 700, 1200])('has no axe violations at %ipx', async (width) => {
    const { view } = await setup({ width });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
