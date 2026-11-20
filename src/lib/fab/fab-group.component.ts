import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Several floating buttons of one page side by side, for example "Reset" and "Save" of an
 * editor, or "Antrag stellen" beside "Antrag erfassen" of a list. The group takes the place
 * of a single `app-fab`: fixed at the end edge of the content column, and on a phone above
 * the bottom bar (`.frame--phone`, `--app-bottom-inset`). `contained` puts it at the bottom
 * end of the nearest positioned ancestor, like a `contained` fab in a list pane. It comes in
 * with a short rise. The fabs in it have no position of their own.
 *
 * ```html
 * <app-fab-group>
 *   <app-fab icon="undo" label="Reset" iconOnly tone="neutral" (activate)="reset()" />
 *   <app-fab icon="check" label="Save" iconOnly [loading]="saving()" (activate)="save()" />
 * </app-fab-group>
 * ```
 */
@Component({
  selector: 'app-fab-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[class.fab-group--contained]': 'contained()' },
  template: '<ng-content />',
  styleUrl: './fab-group.component.scss',
})
export class FabGroupComponent {
  /** Absolute in the nearest positioned ancestor instead of fixed in the window. */
  readonly contained = input(false);
}
