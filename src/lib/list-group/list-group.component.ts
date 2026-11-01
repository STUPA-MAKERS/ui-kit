import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/**
 * A group of rows in a list pane with its head, for example the month "September 2026"
 * above the applications of that month, or "Saved" above the presets.
 *
 * The head is the name of the group and nothing else. It shows no count of the rows: the
 * rows themselves show how many there are. The caller projects the rows:
 *
 * ```html
 * <app-list-group [label]="group.label">
 *   <div class="apps__rows" [class.rowgroup]="!split()" role="list">…</div>
 * </app-list-group>
 * ```
 *
 * With a `label`, the group is a region that its head names. Without one (`null` or an
 * empty text), the group has no head and no role. `skeleton` shows a placeholder bar of
 * that width in place of the head, while the list loads.
 *
 * The head sits closer to the top in the first group of the list, and the inline padding
 * follows the rows: `space-4` beside the cards of a split pane, `space-1` above a row
 * group on a phone.
 */
@Component({
  selector: 'app-list-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "label() && !skeleton() ? 'region' : null",
    '[attr.aria-labelledby]': 'label() && !skeleton() ? headId : null',
  },
  templateUrl: './list-group.component.html',
  styleUrl: './list-group.component.scss',
})
export class ListGroupComponent {
  /** The name of the group. `null` or empty: no head. */
  readonly label = input<string | null>(null);
  /** The colour of the head: `accent`, or `warn` for a group that waits for somebody. */
  readonly tone = input<'accent' | 'warn'>('accent');
  /** A CSS width such as `7rem`: a placeholder bar in place of the head. */
  readonly skeleton = input<string | null>(null);

  protected readonly headId = `list-group-${nextId++}`;
}
