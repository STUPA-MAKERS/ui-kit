import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CellDirective } from './cell.directive';
import { type ColumnDef, DataTableComponent } from './data-table.component';
import { FootCellDirective } from './foot-cell.directive';
import { RowDetailDirective } from './row-detail.directive';

interface Row {
  id: number;
  name: string;
  status: string;
}

const COLS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', align: 'end', width: '8rem' },
];

const ROWS: Row[] = [
  { id: 1, name: 'Alpha', status: 'open' },
  { id: 2, name: 'Beta', status: 'done' },
];

describe('DataTableComponent', () => {
  it('renders a header row from the column defs', async () => {
    await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS },
    });
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    const statusHead = screen.getByRole('columnheader', { name: 'Status' });
    expect(statusHead).toHaveStyle({ textAlign: 'end' });
    expect(statusHead).toHaveStyle({ width: '8rem' });
  });

  it('defaults column alignment to start and omits width when unset', async () => {
    await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS },
    });
    const nameHead = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHead).toHaveStyle({ textAlign: 'start' });
    expect(nameHead.style.width).toBe('');
  });

  it('renders the raw cell text when no cell template is given', async () => {
    await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS },
    });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
  });

  it('shows the empty state (no table, no box) when there are no rows', async () => {
    const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" emptyText="Nichts da" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: [] as Row[] },
    });
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('Nichts da')).toBeInTheDocument();
    expect(container.querySelector('.dt--boxed')).toBeNull();
  });

  it('applies the boxed class only when boxed and rows present', async () => {
    const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" [boxed]="true" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS },
    });
    expect(container.querySelector('.dt--boxed')).not.toBeNull();
  });

  it('omits the boxed class when boxed is false', async () => {
    const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" [boxed]="false" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS },
    });
    expect(container.querySelector('.dt--boxed')).toBeNull();
  });

  it('renders a custom cell template via appCell with the row context', async () => {
    @Component({
      standalone: true,
      imports: [DataTableComponent, CellDirective],
      template: `<app-data-table [columns]="cols" [rows]="rows">
        <ng-template appCell="status" let-row let-i="index">
          <span class="chip">{{ row.status }}#{{ i }}</span>
        </ng-template>
      </app-data-table>`,
    })
    class Host {
      cols = COLS;
      rows = ROWS;
    }
    await render(Host);
    expect(screen.getByText('open#0')).toBeInTheDocument();
    expect(screen.getByText('done#1')).toBeInTheDocument();
  });

  it('is not clickable by default: no rowClick, no tabindex', async () => {
    const onRowClick = jest.fn();
    await render(`<app-data-table [columns]="cols" [rows]="rows" (rowClick)="onRowClick($event)" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS, onRowClick },
    });
    const firstRow = screen.getByText('Alpha').closest('tr') as HTMLElement;
    expect(firstRow.getAttribute('tabindex')).toBeNull();
    await userEvent.click(firstRow);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('emits rowClick on click and Enter when clickable', async () => {
    const onRowClick = jest.fn();
    await render(`<app-data-table [columns]="cols" [rows]="rows" [clickable]="true" (rowClick)="onRowClick($event)" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS, onRowClick },
    });
    const firstRow = screen.getByText('Alpha').closest('tr') as HTMLElement;
    expect(firstRow).toHaveClass('dt__row--clickable');
    expect(firstRow.getAttribute('tabindex')).toBe('0');
    await userEvent.click(firstRow);
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);

    firstRow.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('uses a custom rowKey for tracking', async () => {
    const rowKey = jest.fn((row: unknown) => (row as Row).id);
    await render(`<app-data-table [columns]="cols" [rows]="rows" [rowKey]="rowKey" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: COLS, rows: ROWS, rowKey },
    });
    expect(rowKey).toHaveBeenCalled();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders an expandable detail row only for expanded rows', async () => {
    @Component({
      standalone: true,
      imports: [DataTableComponent, RowDetailDirective],
      template: `<app-data-table [columns]="cols" [rows]="rows" [isExpanded]="isExpanded">
        <ng-template appRowDetail let-row>
          <div class="detail">Details für {{ row.name }}</div>
        </ng-template>
      </app-data-table>`,
    })
    class Host {
      cols = COLS;
      rows = ROWS;
      isExpanded = (row: unknown): boolean => (row as Row).id === 1;
    }
    const { container } = await render(Host);
    expect(screen.getByText('Details für Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Details für Beta')).toBeNull();
    const detailCell = container.querySelector('.dt__detail-row td') as HTMLElement;
    expect(detailCell.getAttribute('colspan')).toBe(String(COLS.length));
  });

  it('does not render detail rows when no isExpanded predicate is provided', async () => {
    @Component({
      standalone: true,
      imports: [DataTableComponent, RowDetailDirective],
      template: `<app-data-table [columns]="cols" [rows]="rows">
        <ng-template appRowDetail let-row>
          <div>Detail {{ row.name }}</div>
        </ng-template>
      </app-data-table>`,
    })
    class Host {
      cols = COLS;
      rows = ROWS;
    }
    const { container } = await render(Host);
    expect(container.querySelector('.dt__detail-row')).toBeNull();
  });

  it('rebuilds the cell map when projected cell templates change', async () => {
    @Component({
      standalone: true,
      imports: [DataTableComponent, CellDirective],
      template: `<app-data-table [columns]="cols" [rows]="rows">
        @if (showCell()) {
          <ng-template appCell="name" let-row>
            <b class="tpl">{{ row.name }}!</b>
          </ng-template>
        }
      </app-data-table>`,
    })
    class Host {
      cols = COLS;
      rows = ROWS;
      readonly showCell = signal(false);
    }
    const view = await render(Host);
    // Initially the raw text is shown (no template registered).
    expect(view.container.querySelector('.tpl')).toBeNull();
    // Add the projected template → ContentChildren.changes fires → cellMap rebuilds.
    view.fixture.componentInstance.showCell.set(true);
    view.fixture.detectChanges();
    expect(screen.getByText('Alpha!')).toBeInTheDocument();
  });
  describe('loading', () => {
    it('keeps the header and draws skeleton rows instead of collapsing', async () => {
      // The whole point: a table that is merely refreshing must not read as "no
      // results". The header and the box stay; the body becomes placeholders.
      await render(`<app-data-table [columns]="cols" [rows]="[]" [loading]="true" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS },
      });
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      expect(screen.queryByText('—')).not.toBeInTheDocument();
    });

    it('draws the requested number of skeleton rows', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="[]" [loading]="true" [skeletonRowCount]="3" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS } },
      );
      expect(container.querySelectorAll('.dt__skeleton-row')).toHaveLength(3);
    });

    it('announces the loading state, because the skeleton is aria-hidden', async () => {
      await render(
        `<app-data-table [columns]="cols" [rows]="[]" [loading]="true" loadingText="Wird geladen" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS } },
      );
      expect(screen.getByRole('status')).toHaveTextContent('Wird geladen');
    });

    it('shows the real rows again once loading ends', async () => {
      const view = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [loading]="busy()" />`,
        {
          imports: [DataTableComponent],
          componentProperties: { cols: COLS, rows: ROWS, busy: signal(true) },
        },
      );
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      (view.fixture.componentInstance as { busy: ReturnType<typeof signal<boolean>> }).busy.set(
        false,
      );
      view.fixture.detectChanges();
      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });

    it('still shows the empty state when there is genuinely nothing', async () => {
      await render(`<app-data-table [columns]="cols" [rows]="[]" emptyText="Nichts da" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS },
      });
      expect(screen.getByText('Nichts da')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    const SORTABLE: ColumnDef[] = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'status', label: 'Status' },
    ];

    it('renders a sortable header as a button and a plain one as text', async () => {
      await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: SORTABLE, rows: ROWS },
      });
      expect(screen.getByRole('button', { name: /Name/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Status/ })).not.toBeInTheDocument();
    });

    it('starts a column at its own initialSort when it has one', async () => {
      // A date or an amount usually wants the newest or largest first, so those columns
      // opt out of the ascending default rather than every caller re-implementing it.
      const sortChange = jest.fn();
      const cols: ColumnDef[] = [
        { key: 'created', label: 'Created', sortable: true, initialSort: 'desc' },
      ];
      await render(`<app-data-table [columns]="cols" [rows]="rows" (sortChange)="onSort($event)" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols, rows: ROWS, onSort: sortChange },
      });
      await userEvent.click(screen.getByRole('button', { name: /Created/ }));
      expect(sortChange).toHaveBeenCalledWith({ key: 'created', direction: 'desc' });
    });

    it('starts a new column ascending', async () => {
      const sortChange = jest.fn();
      await render(`<app-data-table [columns]="cols" [rows]="rows" (sortChange)="onSort($event)" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: SORTABLE, rows: ROWS, onSort: sortChange },
      });
      await userEvent.click(screen.getByRole('button', { name: /Name/ }));
      expect(sortChange).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
    });

    it('flips the direction on the column that is already sorted', async () => {
      const sortChange = jest.fn();
      await render(
        `<app-data-table [columns]="cols" [rows]="rows" [sort]="sort" (sortChange)="onSort($event)" />`,
        {
          imports: [DataTableComponent],
          componentProperties: {
            cols: SORTABLE,
            rows: ROWS,
            sort: { key: 'name', direction: 'asc' },
            onSort: sortChange,
          },
        },
      );
      await userEvent.click(screen.getByRole('button', { name: /Name/ }));
      expect(sortChange).toHaveBeenCalledWith({ key: 'name', direction: 'desc' });
    });

    it('exposes the sort to assistive technology, not only to the eye', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [sort]="sort" />`,
        {
          imports: [DataTableComponent],
          componentProperties: {
            cols: SORTABLE,
            rows: ROWS,
            sort: { key: 'name', direction: 'desc' },
          },
        },
      );
      const [sorted, plain] = Array.from(container.querySelectorAll('th'));
      expect(sorted.getAttribute('aria-sort')).toBe('descending');
      // A non-sortable column carries no aria-sort at all.
      expect(plain.getAttribute('aria-sort')).toBeNull();
    });
  });

  describe('sticky column', () => {
    const STICKY: ColumnDef[] = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Aktionen', align: 'end', sticky: 'end' },
    ];

    it('pins the marked column in the header, the body and the skeleton', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" />`,
        { imports: [DataTableComponent], componentProperties: { cols: STICKY, rows: ROWS } },
      );
      const [plainHead, stickyHead] = Array.from(container.querySelectorAll('th'));
      expect(stickyHead).toHaveClass('dt__cell--sticky');
      expect(plainHead).not.toHaveClass('dt__cell--sticky');
      // Every body row pins the same column, or the strip would break mid-table.
      for (const row of Array.from(container.querySelectorAll('tbody tr'))) {
        const cells = Array.from(row.querySelectorAll('td'));
        expect(cells[1]).toHaveClass('dt__cell--sticky');
        expect(cells[0]).not.toHaveClass('dt__cell--sticky');
      }
    });

    it('pins the skeleton cells too, so the strip does not appear on load', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [loading]="true" />`,
        { imports: [DataTableComponent], componentProperties: { cols: STICKY, rows: [] } },
      );
      const cells = Array.from(container.querySelectorAll('.dt__skeleton-row td'));
      expect(cells[1]).toHaveClass('dt__cell--sticky');
    });

    it('pins nothing when no column asks for it', async () => {
      const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS },
      });
      expect(container.querySelector('.dt__cell--sticky')).toBeNull();
    });
  });

  describe('selection', () => {
    const setup = async (selected: Set<unknown> = new Set(), onChange = jest.fn()) =>
      render(
        `<app-data-table
           [columns]="cols" [rows]="rows" [rowKey]="rowKey"
           [selectable]="true" [selected]="selected" (selectedChange)="onChange($event)" />`,
        {
          imports: [DataTableComponent],
          componentProperties: {
            cols: COLS,
            rows: ROWS,
            rowKey: (r: unknown) => (r as Row).id,
            selected,
            onChange,
          },
        },
      );

    it('adds no checkbox column unless asked', async () => {
      const plain = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS },
      });
      expect(plain.container.querySelectorAll('input[type=checkbox]').length).toBe(0);
    });

    it('adds one checkbox per row plus the select-all', async () => {
      const { container } = await setup();
      expect(container.querySelectorAll('input[type=checkbox]').length).toBe(ROWS.length + 1);
    });

    it('emits the row key, not the row index, so a re-sort cannot move the selection', async () => {
      const onChange = jest.fn();
      const { container } = await setup(new Set(), onChange);
      const boxes = container.querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]');
      boxes[1].click();
      expect(onChange).toHaveBeenCalledWith(new Set([ROWS[1].id]));
    });

    it('never mutates the set it was given', async () => {
      const selected = new Set<unknown>([ROWS[0].id]);
      const onChange = jest.fn();
      const { container } = await setup(selected, onChange);
      container.querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]')[1].click();
      expect(selected).toEqual(new Set([ROWS[0].id]));
    });

    it('select-all covers the rows on screen', async () => {
      const onChange = jest.fn();
      const { container } = await setup(new Set(), onChange);
      container.querySelector<HTMLInputElement>('thead input[type=checkbox]')!.click();
      expect(onChange).toHaveBeenCalledWith(new Set(ROWS.map((r) => r.id)));
    });

    it('select-all clears the selection once everything is selected', async () => {
      const onChange = jest.fn();
      const { container } = await setup(new Set(ROWS.map((r) => r.id)), onChange);
      container.querySelector<HTMLInputElement>('thead input[type=checkbox]')!.click();
      expect(onChange).toHaveBeenCalledWith(new Set());
    });

    it('shows the header as indeterminate for a partial selection', async () => {
      const { container } = await setup(new Set([ROWS[0].id]));
      const head = container.querySelector<HTMLInputElement>('thead input[type=checkbox]')!;
      expect(head.checked).toBe(false);
      expect(head.indeterminate).toBe(true);
    });

    it('is not "all selected" when there are no rows at all', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [selectable]="true" [loading]="true" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS, rows: [] } },
      );
      const head = container.querySelector<HTMLInputElement>('thead input[type=checkbox]')!;
      expect(head.checked).toBe(false);
    });

    it('does not open the row when the checkbox is clicked', async () => {
      // A selectable table is often clickable too, and a checkbox that also opened the
      // row would make the two impossible to tell apart.
      const rowClick = jest.fn();
      const { container } = await render(
        `<app-data-table
           [columns]="cols" [rows]="rows" [selectable]="true" [clickable]="true"
           (rowClick)="onRow($event)" />`,
        {
          imports: [DataTableComponent],
          componentProperties: { cols: COLS, rows: ROWS, onRow: rowClick },
        },
      );
      container.querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]')[0].click();
      expect(rowClick).not.toHaveBeenCalled();
    });
  });

  describe('child rows', () => {
    it('repeats the parent columns for each child, with the caller\'s own cells', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [childrenOf]="childrenOf">
           <ng-template appCell="name" let-row let-child="child">
             <span class="cell">{{ child ? 'child' : 'parent' }}:{{ row.name }}</span>
           </ng-template>
         </app-data-table>`,
        {
          imports: [DataTableComponent, CellDirective],
          componentProperties: {
            cols: COLS,
            rows: [ROWS[0]],
            childrenOf: (r: unknown) =>
              (r as Row).id === 1 ? [{ id: 11, name: 'Sub', status: 'open' }] : [],
          },
        },
      );
      const cells = [...container.querySelectorAll('.cell')].map((e) => e.textContent);
      expect(cells).toEqual(['parent:Alpha', 'child:Sub']);
      // A child is a row of its own with the same column count, not a colspan panel.
      const child = container.querySelector('.dt__childRow')!;
      expect(child.querySelectorAll('td').length).toBe(COLS.length);
    });

    it('renders no child rows when the caller supplies none', async () => {
      const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS },
      });
      expect(container.querySelector('.dt__childRow')).toBeNull();
    });
  });

  describe('footer', () => {
    it('renders a totals row under the column it belongs to', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows">
           <ng-template appFootCell="status">42</ng-template>
         </app-data-table>`,
        {
          imports: [DataTableComponent, FootCellDirective],
          componentProperties: { cols: COLS, rows: ROWS },
        },
      );
      const foot = container.querySelector('tfoot')!;
      const cells = [...foot.querySelectorAll('td')].map((c) => c.textContent?.trim());
      // One cell per column, and only the named one carries content.
      expect(cells.length).toBe(COLS.length);
      expect(cells[1]).toBe('42');
      expect(cells[0]).toBe('');
    });

    it('has no footer at all when no column contributes one', async () => {
      const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS },
      });
      expect(container.querySelector('tfoot')).toBeNull();
    });

    it('hides the totals while loading, when there is nothing to total', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [loading]="true">
           <ng-template appFootCell="status">42</ng-template>
         </app-data-table>`,
        {
          imports: [DataTableComponent, FootCellDirective],
          componentProperties: { cols: COLS, rows: [] },
        },
      );
      expect(container.querySelector('tfoot')).toBeNull();
    });
  });

  describe('row class', () => {
    it('puts the caller\'s class on the row and says whether it is a child', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [rowClass]="rowClass" [childrenOf]="childrenOf" />`,
        {
          imports: [DataTableComponent],
          componentProperties: {
            cols: COLS,
            rows: [ROWS[0]],
            rowClass: (_r: unknown, child: boolean) => (child ? 'is-child' : 'is-parent'),
            childrenOf: () => [{ id: 11, name: 'Sub', status: 'open' }],
          },
        },
      );
      expect(container.querySelector('tbody tr')).toHaveClass('is-parent');
      expect(container.querySelector('.dt__childRow')).toHaveClass('is-child');
    });
  });

  describe('column span', () => {
    it('counts the selection column, so a detail row is not one cell short', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" [selectable]="true"
                         [isExpanded]="always">
           <ng-template appRowDetail>detail</ng-template>
         </app-data-table>`,
        {
          imports: [DataTableComponent, RowDetailDirective],
          componentProperties: { cols: COLS, rows: [ROWS[0]], always: () => true },
        },
      );
      const cell = container.querySelector('.dt__detail-row td')!;
      expect(cell.getAttribute('colspan')).toBe(String(COLS.length + 1));
    });
  });
  it('holds a declared column width instead of letting the browser shrink it', async () => {
    // `width` alone is a suggestion under `table-layout: auto`. A name column asked for
    // Under `table-layout: auto` a `width` is a suggestion and a 22rem column can be
    // squeezed to 107px and wrap. `min-width` is the floor that makes it stick.
    const { container } = await render(
      `<app-data-table [columns]="cols" [rows]="rows" />`,
      {
        imports: [DataTableComponent],
        componentProperties: {
          cols: [{ key: 'a', label: 'A', width: '22rem' }, { key: 'b', label: 'B' }],
          rows: [{ a: '1', b: '2' }],
        },
      },
    );
    const th = container.querySelector('thead th') as HTMLElement;
    expect(th.style.width).toBe('22rem');
    expect(th.style.minWidth).toBe('22rem');
  });

  it('constrains nothing for a column that declares no width', async () => {
    const { container } = await render(
      `<app-data-table [columns]="cols" [rows]="rows" />`,
      {
        imports: [DataTableComponent],
        componentProperties: { cols: [{ key: 'a', label: 'A' }], rows: [{ a: '1' }] },
      },
    );
    const th = container.querySelector('thead th') as HTMLElement;
    expect(th.style.width).toBe('');
    expect(th.style.minWidth).toBe('');
  });
});
