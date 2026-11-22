import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import type { TodoBoard, TodoCardTile, TodoColumn, TodoLabel, Uuid } from './board.types';
import {
  EmptyStateComponent,
  IconComponent,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import {
  dueInfo,
  linkLine,
  sortedColumns,
  type DueInfo,
} from './board.util';
import { personName, type Translate } from './board-format';
import { TodoLabelViewComponent } from './todo-label-view.component';
import { TodoDueViewComponent } from './todo-due-view.component';
import { TodoAssigneesViewComponent } from './todo-assignees-view.component';

/** A set with `id` added, or taken out when it holds it. */
function toggled<T>(set: ReadonlySet<T>, id: T): ReadonlySet<T> {
  return set.has(id) ? new Set([...set].filter((x) => x !== id)) : new Set([...set, id]);
}

export type DueSort = 'none' | 'asc' | 'desc';

interface ListRow {
  readonly card: TodoCardTile;
  readonly link: string | null;
  readonly labels: readonly TodoLabel[];
  readonly due: DueInfo | null;
  readonly names: readonly string[];
  readonly ids: readonly (Uuid | null)[];
}

interface ListGroup {
  readonly column: TodoColumn;
  readonly rows: readonly ListRow[];
}

/**
 * "Liste": the cards of the board as a table, one group per column, with
 * Titel, Verknüpft, Label, Fällig and Wer. "Fällig" sorts (up, down, board order). The
 * done group starts folded. The circle before a title moves the card into the done
 * column, or back into the first column.
 */
@Component({
  selector: 'app-todo-list-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoAssigneesViewComponent, TodoDueViewComponent, TodoLabelViewComponent, UiKitTranslatePipe, IconComponent, EmptyStateComponent],
  templateUrl: './todo-list-view.component.html',
  styleUrl: './todo-list-view.component.scss',
})
export class TodoListViewComponent {
  private readonly i18n = inject(UI_KIT_INTL);
  private readonly t: Translate = (key, params) => this.i18n.translate(key, params);

  readonly board = input.required<TodoBoard>();
  readonly cards = input.required<ReadonlyMap<Uuid, readonly TodoCardTile[]>>();
  readonly labels = input<ReadonlyMap<Uuid, TodoLabel>>(new Map());
  readonly today = input.required<string>();

  readonly openCard = output<Uuid>();
  readonly toggleDone = output<TodoCardTile>();

  readonly sort = signal<DueSort>('none');
  /** Open groups among the done columns (they start folded). */
  readonly openDone = signal<ReadonlySet<Uuid>>(new Set());

  readonly groups = computed<readonly ListGroup[]>(() => {
    const locale = this.i18n.formatLocale();
    const today = this.today();
    return sortedColumns(this.board().columns).map((column) => {
      const rows = (this.cards().get(column.id) ?? []).map<ListRow>((card) => ({
        card,
        link: card.primaryLink ? linkLine(card.primaryLink, today, locale, this.t) : null,
        labels: card.labelIds.map((id) => this.labels().get(id)).filter((l): l is TodoLabel => !!l),
        due: card.dueDate ? dueInfo(card.dueDate, today, locale, this.t, column.isDone) : null,
        names: card.assignees.map((a) => personName(a, this.t)),
        ids: card.assignees.map((a) => a.principalId),
      }));
      return { column, rows: this.sorted(rows) };
    });
  });

  private sorted(rows: readonly ListRow[]): readonly ListRow[] {
    const dir = this.sort();
    if (dir === 'none') return rows;
    return [...rows].sort((a, b) => {
      const x = a.card.dueDate;
      const y = b.card.dueDate;
      if (!x && !y) return 0;
      if (!x) return 1;
      if (!y) return -1;
      return dir === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
    });
  }

  nextSort(): void {
    this.sort.update((s) => (s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none'));
  }

  ariaSort(): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    return s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none';
  }

  folded(group: ListGroup): boolean {
    return group.column.isDone && !this.openDone().has(group.column.id);
  }

  toggleGroup(group: ListGroup): void {
    this.openDone.update((set) => toggled(set, group.column.id));
  }
}
