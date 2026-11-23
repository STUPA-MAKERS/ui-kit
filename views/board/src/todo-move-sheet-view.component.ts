import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import type { Uuid } from './board.types';
import type { TodoBoardKind, TodoCardTile, TodoColumn } from './board.types';
import { UI_KIT_INTL } from '@stupa-makers/ui-kit';
import { UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import {
  ButtonComponent,
  ButtonGroupComponent,
  IconComponent,
  SegmentedComponent,
  type SegmentedOption,
  SideSheetComponent,
  SheetBodyDirective,
} from '@stupa-makers/ui-kit';

/** A column of the sheet, by its name alone: a selector shows no count (spec 000560). */
export interface MoveColumn {
  readonly id: Uuid;
  readonly name: string;
}

/** A long press on a tile asks for its sheet: the card, its board and the columns in order. */
export interface TileMenuRequest {
  readonly card: TodoCardTile;
  readonly boardId: Uuid;
  readonly boardKind: TodoBoardKind;
  readonly columns: readonly TodoColumn[];
}

/** The choice of the sheet: the column and the end of it. */
export interface MoveChoice {
  readonly columnId: Uuid;
  readonly position: 'top' | 'bottom';
}

/**
 * "Verschieben": the phone moves a card with this bottom sheet instead of a
 * drag. The card detail and a long press on a tile open the same sheet. The columns as the
 * rows of a select sheet (a row group, a check mark after the chosen column, spec 001380),
 * the place in the column as a segmented control (Oben | Unten), then "Verschieben". With
 * `canTransfer`, a row in its own group below the columns, "In anderes Board verschieben",
 * closes the sheet and emits `transfer` (the host opens the
 * transfer dialog). A close without a choice (Escape, the scrim, the close button) emits
 * `dismissed`.
 */
@Component({
  selector: 'app-todo-move-sheet-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SheetBodyDirective,
    UiKitTranslatePipe,
    ButtonComponent,
    ButtonGroupComponent,
    IconComponent,
    SegmentedComponent,
    SideSheetComponent,
  ],
  templateUrl: './todo-move-sheet-view.component.html',
  styleUrl: './todo-move-sheet-view.component.scss',
})
export class TodoMoveSheetViewComponent {
  private readonly i18n = inject(UI_KIT_INTL);

  readonly open = model(false);
  readonly columns = input<readonly MoveColumn[]>([]);
  /** The column the card is in now. */
  readonly current = input<Uuid | null>(null);
  /** Show "In anderes Board verschieben". */
  readonly canTransfer = input(false);
  readonly moved = output<MoveChoice>();
  /** "In anderes Board verschieben" was picked. */
  readonly transfer = output<void>();
  /** The sheet closed without a choice. */
  readonly dismissed = output<void>();

  readonly columnId = signal<Uuid | null>(null);
  readonly position = signal<'top' | 'bottom'>('top');

  readonly positions = computed<SegmentedOption[]>(() => [
    { value: 'top', label: this.i18n.translate('todos.move.top') },
    { value: 'bottom', label: this.i18n.translate('todos.move.bottom') },
  ]);

  constructor() {
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.columnId.set(this.current());
        this.position.set('top');
      });
    });
  }

  setPosition(value: string | null): void {
    this.position.set(value === 'bottom' ? 'bottom' : 'top');
  }

  confirm(): void {
    const columnId = this.columnId();
    if (!columnId) return;
    this.open.set(false);
    this.moved.emit({ columnId, position: this.position() });
  }

  moveOn(): void {
    this.open.set(false);
    this.transfer.emit();
  }
}
