import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { type IconName } from '../icon/icons';

/**
 * A row that adds one more entry to a list of rows: a dashed edge in the shape of a row of
 * the list, a plus in the column of the leading icon of the rows, and the projected text.
 *
 * `<app-add-row (add)="addPosition()">Position hinzufügen</app-add-row>`
 *
 * `icon` replaces the plus. `inset` is the space before the icon, so the icon and the text
 * line up with the columns of the rows above (default 6px, the inset of a summary row).
 * The row is one button: the Enter and the Space key add as a click does.
 */
@Component({
  selector: 'app-add-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './add-row.component.html',
  styleUrl: './add-row.component.scss',
})
export class AddRowComponent {
  readonly icon = input<IconName>('plus');
  readonly inset = input('6px');
  readonly add = output<void>();
}
