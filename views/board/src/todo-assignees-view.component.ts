import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import {
  AvatarStackComponent,
  IconComponent,
} from '@stupa-makers/ui-kit';

/**
 * The people of a to-do card: up to three small avatars, or an empty circle with a person
 * icon that is named "Niemand zuständig". The host has no box.
 *
 * ```html
 * <app-todo-assignees-view [names]="row.names" [ids]="row.ids" />
 * ```
 */
@Component({
  selector: 'app-todo-assignees-view',
  standalone: true,
  imports: [AvatarStackComponent, IconComponent, UiKitTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-assignees-view.component.html',
  styleUrl: './todo-assignees-view.component.scss',
})
export class TodoAssigneesViewComponent {
  /** The names of the people, in order. */
  readonly names = input.required<readonly string[]>();
  /** The principal ids of the people, in the order of `names`. */
  readonly ids = input.required<readonly (string | null)[]>();
}
