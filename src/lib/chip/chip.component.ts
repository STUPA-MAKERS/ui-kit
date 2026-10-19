import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/** The size of the remove button: 22px, 26px or 32px round. */
export type ChipRemoveSize = 'sm' | 'md' | 'lg';

const ICON_SIZE: Record<ChipRemoveSize, number> = { sm: 13, md: 14, lg: 16 };

/**
 * A chip that shows a thing a user picked (a linked object, a person, a label, a file) and
 * can drop it again. The content (an icon, an avatar, a text) is projected; `removable`
 * adds a round × button at the end, named by `removeLabel` ("Verknüpfung „X“ entfernen").
 * A chip is no button itself: only the × takes the focus.
 *
 * `<app-chip removable [removeLabel]="…" (remove)="unlink(link)"><app-icon …/> Text</app-chip>`
 *
 * The default look is a filled pill on surface 2, 32px high. A page sets other looks with
 * custom properties on the host: `--chip-bg`, `--chip-border`, `--chip-radius`,
 * `--chip-min-height`, `--chip-padding`, `--chip-gap`, `--chip-font-size`,
 * `--chip-font-weight` and `--chip-x-hover-bg` (the hover surface of the ×).
 */
@Component({
  selector: 'app-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
})
export class ChipComponent {
  readonly removable = input(false);
  /** The accessible name of the × button. Required with `removable`. */
  readonly removeLabel = input('');
  readonly removeSize = input<ChipRemoveSize>('md');
  readonly remove = output<void>();

  protected readonly iconSize = computed(() => ICON_SIZE[this.removeSize()]);
}
