import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TodoLabel } from './board.types';

/**
 * A label of a to-do card: a dot in the label colour, then the name. The host has no box,
 * so the page sets the type size and the colour of the name on it.
 *
 * ```html
 * <app-todo-label-view class="lv__label" [label]="label" />
 * ```
 */
@Component({
  selector: 'app-todo-label-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-label-view.component.html',
  styleUrl: './todo-label-view.component.scss',
})
export class TodoLabelViewComponent {
  /** The label. */
  readonly label = input.required<TodoLabel>();
}
