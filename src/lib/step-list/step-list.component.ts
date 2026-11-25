import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A numbered list of rows that an admin edits in place, such as the steps of a Haushaltsplan
 * or the statuses of a list: per row the number, the main field, the actions (move, delete)
 * and, under the main field, more fields in columns.
 *
 * ```html
 * <app-step-list>
 *   <app-step-row [number]="1" [columns]="2">
 *     <app-input stepMain label="Name" />
 *     <span stepActions><app-move-buttons /> …</span>
 *     <app-select stepField label="Phase" />
 *     <app-select stepField label="Farbe" />
 *   </app-step-row>
 *   <app-note>…</app-note>
 *   <app-button-group><app-button>+ Status</app-button></app-button-group>
 * </app-step-list>
 * ```
 *
 * The rows form one list; content that is not a row (notes, the add button) follows the
 * list. The fields of a row stack into one column when the list is narrower than 34rem, the
 * width at which the fields of a form stack.
 */
@Component({
  selector: 'app-step-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="steplist__rows" role="list"><ng-content select="app-step-row" /></div>
    <ng-content />`,
  styleUrl: './step-list.component.scss',
})
export class StepListComponent {}

/** One row of an {@link StepListComponent}. */
@Component({
  selector: 'app-step-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem' },
  templateUrl: './step-row.component.html',
  styleUrl: './step-row.component.scss',
})
export class StepRowComponent {
  /** The number in front of the row, from 1. */
  readonly number = input.required<number>();
  /** The columns of the fields under the main field. */
  readonly columns = input(1);
}
