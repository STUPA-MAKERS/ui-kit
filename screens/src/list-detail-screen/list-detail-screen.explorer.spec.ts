import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { ListGroup, ListRow, LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { ScreenBodyDirective } from '../detail-screen/detail-screen.component';
import { ScreenFiltersDirective } from '../records-screen/records-screen.component';
import { ListDetailScreenComponent, ScreenToolsDirective } from './list-detail-screen.component';

@Component({ changeDetection: ChangeDetectionStrategy.Eager, standalone: true, template: '' })
class Blank {}

const ROWS: readonly ListGroup[] = [
  {
    key: 'none',
    label: 'Ohne Spec',
    tone: 'warn',
    rows: [{ id: '0', title: 'F/x/y/000001', meta: ['a.ts:3'], code: 'title', link: { commands: ['/0'] } }],
  },
  {
    key: 'ok',
    label: 'Mit Spec',
    rows: [
      { id: '1', title: 'Regel', meta: ['000002 · F/x/y'], code: 'meta' },
      { id: '2', title: 'Datei', href: 'https://example.org/a.ts' },
    ],
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [
    ListDetailScreenComponent,
    ScreenFiltersDirective,
    ScreenToolsDirective,
    ScreenBodyDirective,
  ],
  template: `
    <app-list-detail-screen
      [head]="{ title: 'Specs' }"
      [rows]="rows"
      [search]="{ placeholder: 'Suchen' }"
      [filters]="[{ key: 'status', label: 'Status', kind: 'single', value: null, options: [{ value: 'draft', label: 'Entwurf' }] }]"
      filtersLabel="Filter"
      [none]="{ heading: 'Keine Spec gewählt', icon: 'file' }"
      [config]="{ reset: true, listWidth: 'fill' }"
      [scope]="{ label: 'Quelle', chips: [{ key: 'repo', label: 'Repo', icon: 'package', value: 'a', options: [{ value: 'a', label: 'Repo A' }, { value: 'b', label: 'Repo B' }] }] }"
      (scopeChange)="scoped.push($event)"
      (query)="queries.push($event)"
    >
      <ng-template screenFilters><button type="button">Ansicht</button></ng-template>
      <ng-template screenTools><button type="button">Diagramm</button></ng-template>
      @if (drawing()) {
        <ng-template screenBody><p>Zeichnung</p></ng-template>
      }
    </app-list-detail-screen>
  `,
})
class Host {
  readonly rows: LoadState<readonly ListRow[] | readonly ListGroup[]> = { state: 'ready', data: ROWS };
  readonly drawing = signal(false);
  readonly queries: unknown[] = [];
  readonly scoped: unknown[] = [];
}

async function setUp() {
  const view = await render(Host, {
    providers: [provideRouter([{ path: '**', component: Blank }])],
  });
  return view;
}

// §S/framework/screens/002792 §S/framework/screens/002793 §S/framework/screens/002794
// §S/framework/screens/002795 §S/framework/screens/002796
describe('ListDetailScreenComponent for the spec explorer', () => {
  it('places the scope above the search and the chips and the tools in the filter line', async () => {
    const view = await setUp();
    const scope = screen.getByRole('group', { name: 'Quelle' });
    expect(scope.textContent).toContain('Repo A');
    const filters = screen.getByRole('group', { name: 'Filter' });
    expect(filters.textContent).toContain('Ansicht');
    expect(filters.querySelector('.lds__tools')?.textContent).toContain('Diagramm');
    expect(view.container.querySelector('.lds--fill')).not.toBeNull();
    expect(
      scope.compareDocumentPosition(view.container.querySelector('app-search-pill')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('emits scopeChange when a chip of the scope gets a new value', async () => {
    const view = await setUp();
    await userEvent.click(screen.getByRole('button', { name: /Repo/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Repo B' }));
    expect(view.fixture.componentInstance.scoped).toEqual([{ key: 'repo', value: 'b' }]);
  });

  it('shows the body in place of the rows', async () => {
    const view = await setUp();
    expect(screen.getByText('Regel')).toBeInTheDocument();
    view.fixture.componentInstance.drawing.set(true);
    view.fixture.detectChanges();
    expect(screen.getByText('Zeichnung')).toBeInTheDocument();
    expect(screen.queryByText('Regel')).toBeNull();
  });

  it('shows code in the monospace font, the warning group and a row to another site', async () => {
    const view = await setUp();
    const items = view.container.querySelectorAll('app-list-item .li');
    expect(items[0]!.classList).toContain('li--codeTitle');
    expect(items[1]!.classList).toContain('li--codeSub');
    expect(view.container.querySelector('app-list-group')?.textContent).toContain('Ohne Spec');
    const link = screen.getByRole('link', { name: 'Datei' });
    expect(link.getAttribute('href')).toBe('https://example.org/a.ts');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(items[2]!.querySelector('app-icon')).not.toBeNull();
  });

  it('shows Zurücksetzen only with a set filter and clears search and filters', async () => {
    const view = await setUp();
    expect(screen.queryByRole('button', { name: 'Zurücksetzen' })).toBeNull();
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { q: 'x', status: 'draft' } });
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    await userEvent.click(await screen.findByRole('button', { name: 'Zurücksetzen' }));
    await view.fixture.whenStable();
    expect(router.url).toBe('/');
  });

  it('has no axe violations', async () => {
    const view = await setUp();
    await runAxe(view.container);
  });
});
