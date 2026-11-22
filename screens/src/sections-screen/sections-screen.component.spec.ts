import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { Action, ListRow, LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { RecordSectionComponent } from '../record-section/record-section.component';
import { SectionsScreenComponent } from './sections-screen.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SectionsScreenComponent, RecordSectionComponent],
  template: `
    <div [style.width.px]="width()">
      <app-sections-screen [head]="{ title: 'Gruppen-Zuordnung' }" [actions]="actions()" (action)="onAction($event)">
        <p role="note">Hinweis</p>
        <app-record-section heading="Globale Rollen" [rows]="rows()" />
        <app-record-section heading="Gremien-Mitgliedschaft" [rows]="{ state: 'empty', heading: 'Leer', icon: 'users' }" />
      </app-sections-screen>
    </div>
  `,
})
class Host {
  readonly width = input(1200);
  readonly rows = signal<LoadState<readonly ListRow[]>>({ state: 'ready', data: [{ id: 'a', title: 'AStA' }] });
  readonly actions = signal<readonly Action[]>([]);
  onAction = jest.fn();
}

async function setup(inputs: Partial<{ width: number }> = {}) {
  const view = await render(Host, { inputs, providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('SectionsScreenComponent', () => {
  it('shows the head and the projected sections in order', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Gruppen-Zuordnung' })).toBeTruthy();
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim());
    expect(h2).toEqual(['Globale Rollen', 'Gremien-Mitgliedschaft']);
    expect(screen.getByRole('note').textContent).toBe('Hinweis');
  });

  it('places a head action and a FAB, and emits or navigates', async () => {
    const { view, host } = await setup();
    const router = view.fixture.debugElement.injector.get(Router);
    const nav = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    host.actions.set([
      { key: 'help', label: 'Hilfe', priority: 'head', route: { commands: ['/help'] } },
      { key: 'add', label: 'Anlegen', priority: 'fab' },
    ]);
    view.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Hilfe' }));
    expect(nav).toHaveBeenCalledWith(['/help'], { queryParams: undefined });
    await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
    expect(host.onAction).toHaveBeenCalledWith({ key: 'add' });
  });

  it.each([390, 700, 1200])('has no axe violations at %ipx', async (width) => {
    const { view } = await setup({ width });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
