import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastService, type ListRow, type LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import {
  RecordsScreenComponent,
  ScreenFiltersDirective,
  ScreenHeadToolsDirective,
  ScreenIntroDirective,
  ScreenListFootDirective,
  ScreenRecordDirective,
  ScreenSearchDirective,
} from './records-screen.component';

const ROWS: readonly ListRow[] = [
  {
    id: 'a1',
    title: 'Druckkosten Erstiwoche',
    meta: ['02.11.2026', 'Eingereicht → Genehmigt', 'Eilbedarf'],
    link: { commands: ['/applications', 'a1'] },
  },
  { id: 'a2', title: 'Fahrtkosten', meta: ['20.10.2026', 'Kein Status → Entwurf'] },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [RecordsScreenComponent, ScreenFiltersDirective],
  template: `
    <div [style.width.px]="width()">
      <app-records-screen
        [head]="{ title: 'Erzwungene Statuswechsel' }"
        [rows]="rows()"
        [actions]="actions()"
        filtersLabel="Filter"
        (action)="onAction($event)"
        (more)="onMore()"
      >
        <ng-template screenFilters><button type="button">Grund</button></ng-template>
      </app-records-screen>
    </div>
  `,
})
class Host {
  readonly width = input(1200);
  readonly rows = signal<LoadState<readonly ListRow[]>>({ state: 'ready', data: ROWS });
  readonly actions = signal<readonly { key: string; label: string; icon: 'plus'; priority: 'fab' }[]>([]);
  onAction = jest.fn();
  onMore = jest.fn();
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [
    RecordsScreenComponent,
    ScreenRecordDirective,
    ScreenListFootDirective,
    ScreenIntroDirective,
    ScreenHeadToolsDirective,
    ScreenSearchDirective,
  ],
  template: `
    <app-records-screen
      [head]="{ title: 'Agent-Zugänge' }"
      [rows]="rows()"
      variant="records"
      listLabel="Alle Zugänge"
      [keepOnError]="true"
    >
      <ng-template screenRecord let-row
        ><li><strong>{{ row.title }}</strong> eigene Zeile</li></ng-template
      >
      <ng-template screenIntro><p role="status">Kette geprüft</p></ng-template>
      <ng-template screenHeadTools><button type="button">DE</button></ng-template>
      <ng-template screenSearch><div role="search">Suche</div></ng-template>
      <ng-template screenListFoot><nav aria-label="Seiten">1–2 von 2</nav></ng-template>
    </app-records-screen>
  `,
})
class RecordHost {
  readonly rows = signal<LoadState<readonly ListRow[]>>({ state: 'ready', data: ROWS });
}

async function setup(inputs: Partial<{ width: number }> = {}) {
  const view = await render(Host, { inputs, providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('RecordsScreenComponent', () => {
  it('shows the title, the filter slot in a named group and one row per record', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Erzwungene Statuswechsel' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Filter' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Erzwungene Statuswechsel' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/Eingereicht → Genehmigt · Eilbedarf/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Druckkosten/ }).getAttribute('href')).toBe('/applications/a1');
  });

  it('shows grey rows on the first load, and the previous rows while it reloads', async () => {
    const { view, host } = await setup();
    host.rows.set({ state: 'loading' });
    view.detectChanges();
    expect(document.querySelector('app-skeleton')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    host.rows.set({ state: 'loading', previous: ROWS });
    view.detectChanges();
    expect(document.querySelector('app-skeleton')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelector('app-empty-state')).toBeNull();
  });

  it('shows the face with the error text when a load fails without rows (002405)', async () => {
    const { view, host } = await setup();
    host.rows.set({ state: 'empty', heading: 'Keine Einträge', icon: 'key' });
    view.detectChanges();
    host.rows.set({ state: 'error', message: 'Konnte nicht geladen werden.', retry: () => undefined });
    view.detectChanges();
    expect(document.querySelectorAll('app-empty-state')).toHaveLength(1);
    expect(document.querySelector('app-empty-state')).toHaveClass('es-host--fill');
    expect(screen.getByText('Konnte nicht geladen werden.')).toBeTruthy();
    expect(screen.queryByText('Keine Einträge')).toBeNull();
  });

  it('shows the empty state of the rows', async () => {
    const { view, host } = await setup();
    host.rows.set({ state: 'empty', heading: 'Keine Treffer für diese Filter', icon: 'searchOff' });
    view.detectChanges();
    expect(screen.getByText('Keine Treffer für diese Filter')).toBeTruthy();
    expect(document.querySelector('app-empty-state')).toHaveClass('es-host--fill');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows a load error as a toast with Erneut versuchen', async () => {
    const { view, host } = await setup();
    const toast = jest.spyOn(TestBed.inject(ToastService), 'show');
    const retry = jest.fn();
    host.rows.set({ state: 'error', message: 'Konnte nicht geladen werden.', retry });
    view.detectChanges();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Konnte nicht geladen werden.',
        action: expect.objectContaining({ label: 'Erneut versuchen' }),
      }),
    );
    (toast.mock.calls[0][0] as { closed?: (how: string) => void }).closed?.('action');
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('offers Mehr laden and a FAB action', async () => {
    const { view, host } = await setup();
    host.rows.set({ state: 'ready', data: ROWS, more: true });
    host.actions.set([{ key: 'new', label: 'Neu', icon: 'plus', priority: 'fab' }]);
    view.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Mehr laden' }));
    expect(host.onMore).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Neu' }));
    expect(host.onAction).toHaveBeenCalledWith({ key: 'new' });
  });

  it('draws each record as a list item from the slot, the records group and the foot', async () => {
    await render(RecordHost, { providers: [provideRouter([])] });
    expect(screen.getAllByText('eigene Zeile', { exact: false })).toHaveLength(2);
    const list = screen.getByRole('list', { name: 'Alle Zugänge' });
    expect(list.tagName).toBe('UL');
    expect(list.classList).toContain('rowgroup--records');
    expect(list.querySelectorAll(':scope > li')).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Seiten' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Kette geprüft');
    expect(document.querySelector('.ph__actions .rcs__headTools')?.textContent).toContain('DE');
    expect(document.querySelector('app-sticky-bar [role=search]')?.textContent).toBe('Suche');
  });

  it('keeps the rows of the last load on an error with keepOnError', async () => {
    const view = await render(RecordHost, { providers: [provideRouter([])] });
    view.fixture.componentInstance.rows.set({ state: 'error', message: 'Fehler', retry: () => undefined });
    view.detectChanges();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows no rows on an error without keepOnError', async () => {
    const { view, host } = await setup();
    host.rows.set({ state: 'error', message: 'Fehler', retry: () => undefined });
    view.detectChanges();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it.each([360, 700, 1200])('has no axe violations at %ipx', async (width) => {
    const { view } = await setup({ width });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
