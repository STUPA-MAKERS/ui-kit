import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastService, type Action, type ListGroup, type ListRow, type LoadState } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { LIST_FILTERS, LIST_GROUPS, LIST_ROWS } from '../../../testing/screens';
import { ListDetailScreenComponent } from './list-detail-screen.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<h1>Detail</h1>',
})
class StubDetail {}

const SEND: Action = { key: 'send', label: 'Nachricht senden', icon: 'mail' };

type Rows = LoadState<readonly ListRow[] | readonly ListGroup[]>;

async function setUp(
  rows: Rows,
  extra: { actions?: readonly Action[]; search?: boolean; selection?: boolean } = {},
) {
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
      selection: extra.selection ? { actions: [SEND] } : null,
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

  it('shows the face with the error text and the retry in the toast (002405)', async () => {
    const { view } = await setUp({ state: 'loading' });
    const toast = jest.spyOn(TestBed.inject(ToastService), 'show');
    const retry = jest.fn();
    view.fixture.componentRef.setInput('rows', { state: 'error', message: 'Konnte nicht geladen werden.', retry });
    view.fixture.detectChanges();
    expect(view.container.querySelector('app-empty-state')?.textContent).toContain('Konnte nicht geladen werden.');
    expect(screen.queryByRole('button', { name: 'Erneut versuchen' })).toBeNull();
    const opts = toast.mock.calls[0][0] as { action?: { label: string }; closed?: (how: string) => void };
    expect(opts.action?.label).toBe('Erneut versuchen');
    opts.closed?.('action');
    expect(retry).toHaveBeenCalledTimes(1);
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

  it('starts the selection from the head toggle and emits the action with the ids', async () => {
    const { action } = await setUp({ state: 'ready', data: LIST_ROWS }, { selection: true });
    await userEvent.click(screen.getByRole('button', { name: 'Mehrere auswählen' }));
    expect(screen.getByRole('toolbar', { name: 'Auswahl' })).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Nachricht senden' });
    expect(send.closest('button')).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Zuschuss Sommerfest auswählen' }));
    await userEvent.click(send);
    expect(action).toHaveBeenCalledWith({ key: 'send', ids: ['1'] });
  });

  it('selects every row and ends the selection', async () => {
    const { action } = await setUp({ state: 'ready', data: LIST_ROWS }, { selection: true });
    await userEvent.click(screen.getByRole('button', { name: 'Mehrere auswählen' }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Alle wählen/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Nachricht senden' }));
    expect(action).toHaveBeenCalledWith({ key: 'send', ids: LIST_ROWS.map((r) => r.id) });
    await userEvent.click(screen.getByRole('button', { name: 'Auswahl beenden' }));
    expect(screen.queryByRole('toolbar', { name: 'Auswahl' })).toBeNull();
  });

  it('starts the selection with a long press on a row', async () => {
    const { view } = await setUp({ state: 'ready', data: LIST_ROWS }, { selection: true });
    const row = screen.getByText('Zuschuss Sommerfest').closest('app-list-item')!;
    row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    // The test fixture has no automatic change detection; ngModel writes the box a tick later.
    view.fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    view.fixture.detectChanges();
    expect(screen.getByRole('checkbox', { name: 'Zuschuss Sommerfest auswählen' })).toBeChecked();
  });

  it('shows no selection toggle without a selection', async () => {
    await setUp({ state: 'ready', data: LIST_ROWS });
    expect(screen.queryByRole('button', { name: 'Mehrere auswählen' })).toBeNull();
  });

  // §NF/accessibility/conformance/000493
  it('has no axe violations in the selection', async () => {
    const { view } = await setUp({ state: 'ready', data: LIST_GROUPS }, { selection: true });
    await userEvent.click(screen.getByRole('button', { name: 'Mehrere auswählen' }));
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
