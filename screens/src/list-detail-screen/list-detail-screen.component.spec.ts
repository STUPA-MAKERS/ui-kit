import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { Action, ListGroup, ListRow, LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { LIST_FILTERS, LIST_GROUPS, LIST_ROWS } from '../../../testing/screens';
import { ListDetailScreenComponent } from './list-detail-screen.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<h1>Detail</h1>',
})
class StubDetail {}

type Rows = LoadState<readonly ListRow[] | readonly ListGroup[]>;

async function setUp(rows: Rows, extra: { actions?: readonly Action[]; search?: boolean } = {}) {
  const action = jest.fn();
  const query = jest.fn();
  const more = jest.fn();
  const view = await render(ListDetailScreenComponent, {
    inputs: {
      head: { title: 'Anträge' },
      rows,
      none: { heading: 'Kein Antrag geöffnet', icon: 'file' },
      search: extra.search === false ? null : { placeholder: 'Anträge durchsuchen' },
      filters: LIST_FILTERS,
      actions: extra.actions ?? [],
    },
    on: { action, query, more },
    providers: [provideRouter([{ path: ':id', component: StubDetail }])],
  });
  return { view, action, query, more };
}

// §S/framework/screens/002240 §S/framework/screens/002218
describe('ListDetailScreenComponent', () => {
  it('shows the rows with their meta, status and trailing value', async () => {
    await setUp({ state: 'ready', data: LIST_ROWS });
    expect(screen.getByText('Zuschuss Sommerfest')).toBeInTheDocument();
    expect(screen.getByText('Fachschaft Informatik')).toBeInTheDocument();
    expect(screen.getByText('Rückfrage')).toBeInTheDocument();
    expect(screen.getByText('890,00 €')).toBeInTheDocument();
  });

  it('shows the groups with their labels', async () => {
    await setUp({ state: 'ready', data: LIST_GROUPS });
    expect(screen.getByText('Offen', { selector: '*:not(option)' })).toBeInTheDocument();
    expect(screen.getByText('Erledigt', { selector: '*:not(option)' })).toBeInTheDocument();
  });

  it('shows the skeleton while loading and the empty state when empty', async () => {
    const { view } = await setUp({ state: 'loading' });
    expect(view.container.querySelector('app-skeleton')).not.toBeNull();
    view.fixture.componentRef.setInput('rows', {
      state: 'empty',
      heading: 'Keine Anträge',
      icon: 'file',
    });
    view.fixture.detectChanges();
    expect(screen.getByText('Keine Anträge')).toBeInTheDocument();
  });

  it('keeps the search in the URL and emits the query', async () => {
    const { query } = await setUp({ state: 'ready', data: LIST_ROWS });
    await userEvent.type(screen.getByRole('searchbox'), 'Beamer');
    await new Promise((r) => setTimeout(r, 0));
    expect(TestBed.inject(Router).url).toContain('q=Beamer');
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Beamer' }));
  });

  it('emits a head action by its key and offers "load more"', async () => {
    const { action, more, view } = await setUp(
      { state: 'ready', data: LIST_ROWS, more: true },
      {
        actions: [
          {
            key: 'export',
            label: 'Exportieren',
            icon: 'download',
            priority: 'head',
          },
        ],
      },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Exportieren' }));
    expect(action).toHaveBeenCalledWith({ key: 'export' });
    await userEvent.click(screen.getByRole('button', { name: 'Mehr laden' }));
    expect(more).toHaveBeenCalled();
    expect(view.container).toBeTruthy();
  });

  // §NF/accessibility/conformance/000493
  it('has no axe violations', async () => {
    const { view } = await setUp({ state: 'ready', data: LIST_GROUPS });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });

  it('emits the query of the URL once at the start', async () => {
    const { query } = await setUp({ state: 'ready', data: LIST_ROWS });
    expect(query).toHaveBeenCalledWith({ search: '', filters: { state: null }, sort: null });
  });
});
