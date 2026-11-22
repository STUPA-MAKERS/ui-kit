import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastService, type Action, type ListRow, type LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { ScreenListFootDirective, ScreenRecordDirective } from '../records-screen/records-screen.component';
import { RecordSectionComponent } from './record-section.component';

const ROWS: readonly ListRow[] = [
  { id: 'g1', title: 'STUPA.Vorstand', meta: ['Verwaltung'], link: { commands: ['/admin', 'g1'] } },
  { id: 'g2', title: 'AStA', meta: ['AStA'] },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [RecordSectionComponent],
  template: `
    <app-record-section heading="Globale Rollen" [rows]="rows()" [actions]="actions()" (action)="onAction($event)" />
  `,
})
class Host {
  readonly rows = signal<LoadState<readonly ListRow[]>>({ state: 'ready', data: ROWS });
  readonly actions = signal<readonly Action[]>([{ key: 'add', label: 'Zuordnung anlegen', icon: 'plus' }]);
  onAction = jest.fn();
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [RecordSectionComponent, ScreenRecordDirective, ScreenListFootDirective],
  template: `
    <app-record-section heading="Versionen" [rows]="rows()" [ordered]="true" variant="records" listLabel="Alle Versionen" [keepOnError]="keep()">
      <ng-template screenRecord let-row
        ><li><strong>{{ row.title }}</strong> eigene Zeile</li></ng-template
      >
      <ng-template screenListFoot><p>Ende</p></ng-template>
    </app-record-section>
  `,
})
class RecordHost {
  readonly rows = signal<LoadState<readonly ListRow[]>>({ state: 'ready', data: ROWS });
  readonly keep = signal(true);
}

const picked = jest.fn();

async function setup() {
  const view = await render(Host, { providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('RecordSectionComponent', () => {
  it('shows the heading, its action with the heading as suffix, and one row per record', async () => {
    const { host } = await setup();
    expect(screen.getByRole('heading', { level: 2, name: 'Globale Rollen' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Globale Rollen' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /STUPA.Vorstand/ }).getAttribute('href')).toBe('/admin/g1');
    await userEvent.click(screen.getByRole('button', { name: /^Zuordnung anlegen\s*: Globale Rollen$/ }));
    expect(host.onAction).toHaveBeenCalledWith({ key: 'add' });
  });

  it('shows grey rows on the first load and the small empty face', async () => {
    const { view, host } = await setup();
    host.rows.set({ state: 'loading' });
    view.detectChanges();
    expect(document.querySelector('app-skeleton')).toBeTruthy();
    host.rows.set({ state: 'empty', heading: 'Keine Zuordnungen', icon: 'users' });
    view.detectChanges();
    const face = document.querySelector('app-empty-state');
    expect(face?.textContent).toContain('Keine Zuordnungen');
    expect(face?.classList.contains('es-host--fill')).toBe(false);
  });

  it('shows a load error without rows as the face and a toast with Erneut versuchen (002405)', async () => {
    const { view, host } = await setup();
    const toasts = view.fixture.debugElement.injector.get(ToastService);
    const show = jest.spyOn(toasts, 'show');
    const retry = jest.fn();
    host.rows.set({ state: 'empty', heading: 'Keine Zuordnungen', icon: 'users' });
    view.detectChanges();
    host.rows.set({ state: 'error', message: 'Laden fehlgeschlagen', retry });
    view.detectChanges();
    expect(document.querySelector('app-empty-state')?.textContent).toContain('Laden fehlgeschlagen');
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'Laden fehlgeschlagen', kind: 'error' }));
  });

  it('navigates for an action with a route', async () => {
    const { view, host } = await setup();
    const nav = jest.spyOn(view.fixture.debugElement.injector.get(Router), 'navigate').mockResolvedValue(true);
    host.actions.set([{ key: 'go', label: 'Öffnen', route: { commands: ['/admin'] } }]);
    view.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: /^Öffnen\s*: Globale Rollen$/ }));
    expect(nav).toHaveBeenCalledWith(['/admin'], { queryParams: undefined });
    expect(host.onAction).not.toHaveBeenCalled();
  });

  it('draws records from the slot in an ordered list, keeps them on an error, and shows the foot', async () => {
    const view = await render(RecordHost, { providers: [provideRouter([])] });
    const host = view.fixture.componentInstance;
    const list = screen.getByRole('list', { name: 'Alle Versionen' });
    expect(list.tagName).toBe('OL');
    expect(list.classList.contains('rowgroup--records')).toBe(true);
    expect(screen.getAllByText('eigene Zeile', { exact: false })).toHaveLength(2);
    expect(screen.getByText('Ende')).toBeTruthy();
    host.rows.set({ state: 'error', message: 'Fehler', retry: jest.fn() });
    view.detectChanges();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    host.keep.set(false);
    view.detectChanges();
    expect(screen.queryByRole('list')).toBeNull();
    expect(document.querySelector('app-empty-state')?.textContent).toContain('Fehler');
  });

  it('shows the status of a default row and its actions as a row menu', async () => {
    const view = await render(
      `<app-record-section heading="Backups" [rows]="rows" (rowAction)="picked($event)" />`,
      {
        imports: [RecordSectionComponent],
        componentProperties: {
          picked,
          rows: {
            state: 'ready',
            data: [
              {
                id: 'b1',
                title: '22.11.2026, 02:00',
                meta: ['Automatisch', '46 MB'],
                status: { label: 'Fertig', kind: 'success' },
                actions: [
                  { key: 'download', label: 'Herunterladen', icon: 'download' },
                  { key: 'delete', label: 'Löschen', kind: 'danger', disabled: true, disabledReason: 'Angeheftet' },
                ],
              },
            ],
          },
        },
        providers: [provideRouter([])],
      },
    );
    expect(screen.getByText('Fertig')).toBeTruthy();
    expect(screen.getByText('Automatisch · 46 MB')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Weitere Aktionen: 22.11.2026, 02:00' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Herunterladen' }));
    expect(picked).toHaveBeenCalledWith({ id: 'b1', key: 'download' });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });

  it('has no axe violations', async () => {
    const { view } = await setup();
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
