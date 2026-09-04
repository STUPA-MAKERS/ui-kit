import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UI_KIT_INTL, uiKitIntlFromLang } from '../intl/intl';
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
    const { container } = await render(
      `<app-data-table [columns]="cols" [rows]="rows" emptyText="Nichts da" />`,
      {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: [] as Row[] },
      },
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('Nichts da')).toBeInTheDocument();
    expect(container.querySelector('.dt--boxed')).toBeNull();
  });

  it('applies the boxed class only when boxed and rows present', async () => {
    const { container } = await render(
      `<app-data-table [columns]="cols" [rows]="rows" [boxed]="true" />`,
      {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS },
      },
    );
    expect(container.querySelector('.dt--boxed')).not.toBeNull();
  });

  it('omits the boxed class when boxed is false', async () => {
    const { container } = await render(
      `<app-data-table [columns]="cols" [rows]="rows" [boxed]="false" />`,
      {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS },
      },
    );
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
    await render(
      `<app-data-table [columns]="cols" [rows]="rows" (rowClick)="onRowClick($event)" />`,
      {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS, onRowClick },
      },
    );
    const firstRow = screen.getByText('Alpha').closest('tr') as HTMLElement;
    expect(firstRow.getAttribute('tabindex')).toBeNull();
    await userEvent.click(firstRow);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('emits rowClick on click and Enter when clickable', async () => {
    const onRowClick = jest.fn();
    await render(
      `<app-data-table [columns]="cols" [rows]="rows" [clickable]="true" (rowClick)="onRowClick($event)" />`,
      {
        imports: [DataTableComponent],
        componentProperties: { cols: COLS, rows: ROWS, onRowClick },
      },
    );
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
  describe('card roles', () => {
    /**
     * A card is not a table row turned on its side. Stacking every column gives one
     * label/value line per column: the checkbox on a line of its own, a placeholder
     * dash on a line of its own, and no heading to scan. `ColumnDef.card` says what a
     * column becomes, and the stylesheet reads it off `data-card`.
     */
    const cardCols: ColumnDef[] = [
      { key: 'name', label: 'Name', card: 'title' },
      { key: 'status', label: 'Status', card: 'hidden' },
      { key: 'id', label: 'Id' },
    ];

    async function setup(cols: ColumnDef[] = cardCols) {
      return render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols, rows: ROWS },
      });
    }

    it('marks each cell with the role its column declared', async () => {
      const { container } = await setup();
      const cells = [...container.querySelectorAll('tbody tr:first-child td')];
      expect(cells.map((c) => c.getAttribute('data-card'))).toEqual(['title', 'hidden', null]);
    });

    it('leaves the attribute off when a column declares nothing', async () => {
      // Absent rather than empty: the stylesheet selects on the value, and a table that
      // declares no roles has to keep the layout it had.
      const { container } = await setup(COLS);
      const cells = [...container.querySelectorAll('tbody tr:first-child td')];
      expect(cells.every((c) => !c.hasAttribute('data-card'))).toBe(true);
    });

    it('carries the role through skeleton rows, so the card does not reflow on load', async () => {
      const { container } = await render(
        `<app-data-table [columns]="cols" [rows]="[]" [loading]="true" />`,
        { imports: [DataTableComponent], componentProperties: { cols: cardCols } },
      );
      const cells = [...container.querySelectorAll('tbody tr:first-child td')];
      expect(cells.map((c) => c.getAttribute('data-card'))).toEqual(['title', 'hidden', null]);
    });
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
      await render(
        `<app-data-table [columns]="cols" [rows]="rows" (sortChange)="onSort($event)" />`,
        {
          imports: [DataTableComponent],
          componentProperties: { cols, rows: ROWS, onSort: sortChange },
        },
      );
      await userEvent.click(screen.getByRole('button', { name: /Created/ }));
      expect(sortChange).toHaveBeenCalledWith({ key: 'created', direction: 'desc' });
    });

    it('starts a new column ascending', async () => {
      const sortChange = jest.fn();
      await render(
        `<app-data-table [columns]="cols" [rows]="rows" (sortChange)="onSort($event)" />`,
        {
          imports: [DataTableComponent],
          componentProperties: { cols: SORTABLE, rows: ROWS, onSort: sortChange },
        },
      );
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
      const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: STICKY, rows: ROWS },
      });
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
    it("repeats the parent columns for each child, with the caller's own cells", async () => {
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
    it("puts the caller's class on the row and says whether it is a child", async () => {
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
    const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
      imports: [DataTableComponent],
      componentProperties: {
        cols: [
          { key: 'a', label: 'A', width: '22rem' },
          { key: 'b', label: 'B' },
        ],
        rows: [{ a: '1', b: '2' }],
      },
    });
    const th = container.querySelector('thead th') as HTMLElement;
    expect(th.style.width).toBe('22rem');
    expect(th.style.minWidth).toBe('22rem');
  });

  it('constrains nothing for a column that declares no width', async () => {
    const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
      imports: [DataTableComponent],
      componentProperties: { cols: [{ key: 'a', label: 'A' }], rows: [{ a: '1' }] },
    });
    const th = container.querySelector('thead th') as HTMLElement;
    expect(th.style.width).toBe('');
    expect(th.style.minWidth).toBe('');
  });

  /**
   * The tongues and the cut are pure geometry, and jsdom lays nothing out: every box,
   * every scroll offset and the scrollbar gutter are stated by hand here. The numbers
   * are the ones measured on the running app at an 820px viewport.
   */
  describe('sideways scroll cues', () => {
    const CUE_COLS: ColumnDef[] = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'actions', label: 'Aktionen', sticky: 'end' },
    ];
    const PLAIN_COLS: ColumnDef[] = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
    ];

    const withBox = (el: Element, left: number, right: number, top = 0, bottom = 115): void => {
      (el as HTMLElement).getBoundingClientRect = () =>
        ({
          left,
          right,
          top,
          bottom,
          width: right - left,
          height: bottom - top,
          x: left,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect;
    };

    const fix = (el: Element, prop: string, value: number): void => {
      Object.defineProperty(el, prop, { value, configurable: true });
    };

    interface Cues {
      box: HTMLElement;
      scroll: HTMLElement;
      startTongue: HTMLButtonElement;
      endTongue: HTMLButtonElement;
      resync: () => void;
    }

    /**
     * Renders the table and gives it a layout.
     *
     * `heads` are the boxes of the header cells, the pinned one last. `scrollBox` is the
     * scroller, 115px tall against a 100px client height — a 15px scrollbar gutter.
     */
    const layout = async (opts: {
      cols?: ColumnDef[];
      heads: [number, number][];
      scrollBox?: [number, number, number, number];
      offsetHeight?: number;
      clientHeight?: number;
    }): Promise<Cues> => {
      const { container, fixture } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" />`,
        {
          imports: [DataTableComponent],
          componentProperties: { cols: opts.cols ?? CUE_COLS, rows: ROWS },
          providers: [
            { provide: UI_KIT_INTL, useValue: uiKitIntlFromLang(signal('de' as const)) },
          ],
        },
      );
      const scroll = container.querySelector('.dt__scroll') as HTMLElement;
      const [l, r, t, b] = opts.scrollBox ?? [0, 820, 0, 115];
      withBox(scroll, l, r, t, b);
      fix(scroll, 'offsetHeight', opts.offsetHeight ?? 115);
      fix(scroll, 'clientHeight', opts.clientHeight ?? 100);
      scroll.scrollBy = jest.fn();

      const heads = Array.from(container.querySelectorAll('thead th'));
      opts.heads.forEach(([hl, hr], i) => withBox(heads[i], hl, hr));

      const resync = (): void => {
        scroll.dispatchEvent(new Event('scroll'));
        fixture.detectChanges();
      };
      resync();
      return {
        box: container.querySelector('.dt') as HTMLElement,
        scroll,
        startTongue: container.querySelector('.dt__tongue--start') as HTMLButtonElement,
        endTongue: container.querySelector('.dt__tongue--end') as HTMLButtonElement,
        resync,
      };
    };

    /** A left mouse press. jsdom has no PointerEvent, and only the type name matters. */
    const press = (el: Element): void => {
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    };

    it('drops the end tongue at full scroll, where the old arithmetic overshot', async () => {
      // Measured live at an 820px viewport: the gutter is 15px, the browser clamps
      // scrollLeft at 597, and `scrollWidth - clientWidth` claims 612. Asserting against
      // the real clamped offset is the point — the formula says there is 15px to go.
      const cues = await layout({
        heads: [
          [-612, 108],
          [108, 720],
          [720, 820],
        ],
      });
      fix(cues.scroll, 'scrollWidth', 1432);
      fix(cues.scroll, 'clientWidth', 820);
      fix(cues.scroll, 'scrollLeft', 597);
      cues.resync();

      expect(cues.scroll.scrollWidth - cues.scroll.clientWidth).toBe(612);
      expect(cues.scroll.scrollLeft).toBe(597); // the browser will go no further
      expect(cues.box).not.toHaveClass('dt--cut-end');
      expect(cues.endTongue).toBeDisabled();
    });

    it('shows the end tongue while a column still sticks out past the cut', async () => {
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
      });
      expect(cues.box).toHaveClass('dt--cut-end');
      expect(cues.endTongue).toBeEnabled();
      expect(cues.endTongue).toHaveAccessibleName('Tabelle nach rechts scrollen');
    });

    it('hides the start tongue at the start and shows it once scrolled away', async () => {
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
      });
      expect(cues.box).not.toHaveClass('dt--cut-start');
      expect(cues.startTongue).toBeDisabled();

      withBox(cues.scroll.querySelectorAll('thead th')[0], -300, 420);
      cues.resync();

      expect(cues.box).toHaveClass('dt--cut-start');
      expect(cues.startTongue).toBeEnabled();
      expect(cues.startTongue).toHaveAccessibleName('Tabelle nach links scrollen');
    });

    it('scrolls one step per press, each tongue its own way', async () => {
      const cues = await layout({
        heads: [
          [-300, 420],
          [420, 1032],
          [720, 820],
        ],
      });
      press(cues.endTongue);
      expect(cues.scroll.scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
      press(cues.startTongue);
      expect(cues.scroll.scrollBy).toHaveBeenCalledWith({ left: -240, behavior: 'smooth' });
    });

    it('keeps scrolling while a tongue is held, and stops on release', async () => {
      jest.useFakeTimers();
      try {
        const cues = await layout({
          heads: [
            [0, 720],
            [720, 1332],
            [720, 820],
          ],
        });
        press(cues.endTongue);
        expect(cues.scroll.scrollBy).toHaveBeenCalledTimes(1);

        // Nothing repeats before the hold delay, or a plain click would scroll twice.
        jest.advanceTimersByTime(299);
        expect(cues.scroll.scrollBy).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1 + 90 * 3);
        expect(cues.scroll.scrollBy).toHaveBeenCalledTimes(4);

        cues.endTongue.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
        jest.advanceTimersByTime(90 * 5);
        expect(cues.scroll.scrollBy).toHaveBeenCalledTimes(4);
      } finally {
        jest.useRealTimers();
      }
    });

    it('steps once on Enter and on Space, without the hold', async () => {
      jest.useFakeTimers();
      try {
        const cues = await layout({
          heads: [
            [0, 720],
            [720, 1332],
            [720, 820],
          ],
        });
        cues.endTongue.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        cues.endTongue.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        jest.advanceTimersByTime(2000);
        expect(cues.scroll.scrollBy).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it('ignores a press that is not the primary button', async () => {
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
      });
      cues.endTongue.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 2 }));
      expect(cues.scroll.scrollBy).not.toHaveBeenCalled();
    });

    it('anchors the end cue at the width of the pinned column', async () => {
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
      });
      expect(cues.box.style.getPropertyValue('--cue-right')).toBe('100px');
    });

    it('anchors the end cue at the edge when no column is pinned', async () => {
      const cues = await layout({
        cols: PLAIN_COLS,
        heads: [
          [0, 720],
          [720, 1332],
        ],
      });
      expect(cues.box.style.getPropertyValue('--cue-right')).toBe('0px');
    });

    it('draws the cut where a pinned column does the occluding', async () => {
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
      });
      expect(cues.box.querySelector('.dt__cutline')).not.toBeNull();
    });

    it('draws no cut without a pinned column, where the box border is the boundary', async () => {
      // A rule at the table's own edge would only be a second line beside the border.
      const cues = await layout({
        cols: PLAIN_COLS,
        heads: [
          [0, 720],
          [720, 1332],
        ],
      });
      expect(cues.box.querySelector('.dt__cutline')).toBeNull();
    });

    it('lights the cut from the end tongue only, never from the start tongue', async () => {
      const cues = await layout({
        heads: [
          [-300, 420],
          [420, 1032],
          [720, 820],
        ],
      });
      // The start edge has no rule of its own. A shared flag lit the far edge instead —
      // the opposite one from where the reader was pointing.
      cues.startTongue.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      cues.startTongue.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
      cues.resync();
      expect(cues.box).not.toHaveClass('dt--cut-hot');

      cues.endTongue.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      cues.resync();
      expect(cues.box).toHaveClass('dt--cut-hot');

      cues.endTongue.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
      cues.resync();
      expect(cues.box).not.toHaveClass('dt--cut-hot');
    });

    it('keeps the cut and the tongue clear of the scrollbar gutter', async () => {
      // The table hangs off the top of the viewport, so its visible slice is the last
      // few pixels — right where the scrollbar is. Unclamped, the centring puts the
      // tongue at 97.5px of a 100px row area and half of it lands on the scrollbar.
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
        scrollBox: [0, 820, -95, 20],
      });
      expect(cues.box.style.getPropertyValue('--cut-bottom')).toBe('15px');

      const top = Number.parseInt(cues.box.style.getPropertyValue('--cue-top'), 10);
      expect(top).toBe(72);
      // 54px tall and centred on `top`: its lower edge stays inside the 100px row area.
      expect(top + 27).toBeLessThanOrEqual(100);
    });

    it('centres on the visible slice, not on the middle of the box', async () => {
      const cues = await layout({
        heads: [
          [0, 720],
          [720, 1332],
          [720, 820],
        ],
        // A 300px row area whose first 100px are above the viewport. The middle of the
        // box is at 150; the middle of what can actually be seen is at 200.
        scrollBox: [0, 820, -100, 215],
        offsetHeight: 315,
        clientHeight: 300,
      });
      expect(cues.box.style.getPropertyValue('--cue-top')).toBe('200px');
    });

    it('shows no cue at all for a table that fits', async () => {
      const cues = await layout({
        cols: PLAIN_COLS,
        heads: [
          [0, 400],
          [400, 820],
        ],
        offsetHeight: 100,
        clientHeight: 100,
      });
      expect(cues.box).not.toHaveClass('dt--cut-start');
      expect(cues.box).not.toHaveClass('dt--cut-end');
      expect(cues.box.style.getPropertyValue('--cut-bottom')).toBe('0px');
    });

    it('measures nothing and shows nothing on the empty state', async () => {
      const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: CUE_COLS, rows: [] as Row[] },
      });
      const box = container.querySelector('.dt') as HTMLElement;
      expect(box).not.toHaveClass('dt--cut-end');
      expect(box).not.toHaveClass('dt--cut-start');
    });

    it('scrolls without animation where the reader asked for less motion', async () => {
      const matchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({ ...matchMedia(query), matches: true }),
      });
      try {
        const cues = await layout({
          heads: [
            [0, 720],
            [720, 1332],
            [720, 820],
          ],
        });
        press(cues.endTongue);
        expect(cues.scroll.scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'auto' });
      } finally {
        Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMedia });
      }
    });

    it.each([
      ['de' as const, 'Tabelle nach links scrollen', 'Tabelle nach rechts scrollen'],
      ['en' as const, 'Scroll the table left', 'Scroll the table right'],
    ])('names both tongues from the kit catalogue in %s', async (lang, left, right) => {
      const { container } = await render(`<app-data-table [columns]="cols" [rows]="rows" />`, {
        imports: [DataTableComponent],
        componentProperties: { cols: CUE_COLS, rows: ROWS },
        providers: [{ provide: UI_KIT_INTL, useValue: uiKitIntlFromLang(signal(lang)) }],
      });
      const [start, end] = Array.from(container.querySelectorAll('.dt__tongue'));
      expect(start).toHaveAttribute('aria-label', left);
      expect(end).toHaveAttribute('aria-label', right);
    });
  });
  describe('keeping the sideways position across a redraw', () => {
    const fixProp = (el: Element, prop: string, value: number): void => {
      Object.defineProperty(el, prop, { value, configurable: true });
    };

    const flushFrame = (): void => {
      const queued = frames.splice(0, frames.length);
      for (const cb of queued) cb(0);
    };
    let frames: FrameRequestCallback[] = [];
    let realRaf: typeof requestAnimationFrame;

    beforeEach(() => {
      frames = [];
      realRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      }) as typeof requestAnimationFrame;
    });

    afterEach(() => {
      window.requestAnimationFrame = realRaf;
    });

    interface Harness {
      scroll: HTMLElement;
      setRows: (rows: readonly unknown[]) => Promise<void>;
      wide: () => void;
      collapsed: () => void;
    }

    const harness = async (): Promise<Harness> => {
      const { container, fixture, rerender } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS, rows: ROWS } },
      );
      const scroll = container.querySelector('.dt__scroll') as HTMLElement;
      const wide = (): void => {
        fixProp(scroll, 'scrollWidth', 1200);
        fixProp(scroll, 'clientWidth', 600);
      };
      const collapsed = (): void => {
        fixProp(scroll, 'scrollWidth', 600);
        fixProp(scroll, 'clientWidth', 600);
        scroll.scrollLeft = 0;
      };
      const setRows = async (rows: readonly unknown[]): Promise<void> => {
        await rerender({ componentProperties: { cols: COLS, rows } });
        fixture.detectChanges();
      };
      return { scroll, setRows, wide, collapsed };
    };

    it('puts the reader back where they were when the rows return', async () => {
      const h = await harness();
      h.wide();
      h.scroll.scrollLeft = 300;
      h.scroll.dispatchEvent(new Event('scroll'));

      await h.setRows([]);
      h.collapsed();
      expect(h.scroll.scrollLeft).toBe(0);

      await h.setRows(ROWS);
      h.wide();
      flushFrame();

      expect(h.scroll.scrollLeft).toBe(300);
    });

    it('does not overwrite the kept position with the clamp that empties the box', async () => {
      const h = await harness();
      h.wide();
      h.scroll.scrollLeft = 300;
      h.scroll.dispatchEvent(new Event('scroll'));

      h.collapsed();
      h.scroll.dispatchEvent(new Event('scroll'));

      await h.setRows([]);
      await h.setRows(ROWS);
      h.wide();
      flushFrame();

      expect(h.scroll.scrollLeft).toBe(300);
    });

    it('leaves a reader alone who has scrolled somewhere themselves', async () => {
      const h = await harness();
      h.wide();
      h.scroll.scrollLeft = 300;
      h.scroll.dispatchEvent(new Event('scroll'));

      await h.setRows([]);
      await h.setRows(ROWS);
      h.wide();
      h.scroll.scrollLeft = 120;
      flushFrame();

      expect(h.scroll.scrollLeft).toBe(120);
    });

    it('caps the restored position at what there is to scroll', async () => {
      const h = await harness();
      h.wide();
      h.scroll.scrollLeft = 500;
      h.scroll.dispatchEvent(new Event('scroll'));

      await h.setRows([]);
      // jsdom does not clamp scrollLeft; spell the clamp out.
      h.collapsed();
      await h.setRows(ROWS);
      // Fewer columns came back, so there is less to scroll than before.
      fixProp(h.scroll, 'scrollWidth', 800);
      fixProp(h.scroll, 'clientWidth', 600);
      flushFrame();

      expect(h.scroll.scrollLeft).toBe(200);
    });
  });
  describe('anchoring the sideways position to a column', () => {
    const fixProp = (el: Element, prop: string, value: number): void => {
      Object.defineProperty(el, prop, { value, configurable: true });
    };
    let frames: FrameRequestCallback[] = [];
    let realRaf: typeof requestAnimationFrame;

    beforeEach(() => {
      frames = [];
      realRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      }) as typeof requestAnimationFrame;
    });
    afterEach(() => {
      window.requestAnimationFrame = realRaf;
    });
    const flushFrame = (): void => {
      const queued = frames.splice(0, frames.length);
      for (const cb of queued) cb(0);
    };

    const place = (scroll: HTMLElement, heads: [number, number][]): void => {
      (scroll as HTMLElement).getBoundingClientRect = () =>
        ({ left: 0, right: 600, top: 0, bottom: 115, width: 600, height: 115, x: 0, y: 0 }) as DOMRect;
      const cells = Array.from(scroll.querySelectorAll('thead th'));
      heads.forEach(([l, r], i) => {
        if (!cells[i]) return;
        (cells[i] as HTMLElement).getBoundingClientRect = () =>
          ({ left: l, right: r, top: 0, bottom: 40, width: r - l, height: 40, x: l, y: 0 }) as DOMRect;
      });
    };

    it('follows the anchored column when the widths change under it', async () => {
      const { container, fixture, rerender } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS, rows: ROWS } },
      );
      const scroll = container.querySelector('.dt__scroll') as HTMLElement;
      fixProp(scroll, 'scrollWidth', 1400);
      fixProp(scroll, 'clientWidth', 600);
      scroll.scrollLeft = 300;

      // Column 1 is cut by 100.
      place(scroll, [
        [-400, -100],
        [-100, 500],
        [500, 900],
      ]);
      scroll.dispatchEvent(new Event('scroll'));

      await rerender({ componentProperties: { cols: COLS, rows: [ROWS[0]] } });
      fixture.detectChanges();

      // Narrower content: every column moved right by 60.
      place(scroll, [
        [-340, -40],
        [-40, 560],
        [560, 960],
      ]);
      flushFrame();

      expect(scroll.scrollLeft).toBe(360);
    });

    it('leaves the position alone when nothing shifted', async () => {
      const { container, fixture, rerender } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS, rows: ROWS } },
      );
      const scroll = container.querySelector('.dt__scroll') as HTMLElement;
      fixProp(scroll, 'scrollWidth', 1400);
      fixProp(scroll, 'clientWidth', 600);
      scroll.scrollLeft = 300;
      place(scroll, [
        [-400, -100],
        [-100, 500],
        [500, 900],
      ]);
      scroll.dispatchEvent(new Event('scroll'));

      await rerender({ componentProperties: { cols: COLS, rows: [ROWS[0]] } });
      fixture.detectChanges();
      flushFrame();

      expect(scroll.scrollLeft).toBe(300);
    });

    it('does not drag a reader who is at the start back to where they were', async () => {
      const { container, fixture, rerender } = await render(
        `<app-data-table [columns]="cols" [rows]="rows" />`,
        { imports: [DataTableComponent], componentProperties: { cols: COLS, rows: ROWS } },
      );
      const scroll = container.querySelector('.dt__scroll') as HTMLElement;
      fixProp(scroll, 'scrollWidth', 1400);
      fixProp(scroll, 'clientWidth', 600);

      scroll.scrollLeft = 300;
      scroll.dispatchEvent(new Event('scroll'));
      scroll.scrollLeft = 0;
      scroll.dispatchEvent(new Event('scroll'));

      await rerender({ componentProperties: { cols: COLS, rows: [ROWS[0]] } });
      fixture.detectChanges();
      flushFrame();

      expect(scroll.scrollLeft).toBe(0);
    });
  });
});
