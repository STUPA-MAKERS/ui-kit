import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Several floating buttons of one page side by side, for example "Reset" and "Save" of an
 * editor. The group takes the place of a single `app-fab`: fixed at the bottom end of the
 * window, and on a phone above the bottom bar (`.frame--phone`, `--app-bottom-inset`). It
 * comes in with a short rise. The fabs in it have no position of their own.
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
  host: { role: 'group' },
  template: '<ng-content />',
  styleUrl: './fab-group.component.scss',
})
export class FabGroupComponent {}
