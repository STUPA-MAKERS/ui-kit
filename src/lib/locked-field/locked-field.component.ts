import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * A value that the form shows but does not let the person change ("Fest": the fiscal
 * year of a booking). It has the box of a labelled field with a dashed edge and a lock
 * in front of the label. The value is the content; a long value wraps.
 *
 * `<app-locked-field [label]="'Haushaltsjahr'">2026</app-locked-field>`
 *
 * The label and the value are plain text, not a form control, so a screen reader reads
 * them in order and the Tab key passes over them.
 */
@Component({
  selector: 'app-locked-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './locked-field.component.html',
  styleUrl: './locked-field.component.scss',
})
export class LockedFieldComponent {
  readonly label = input.required<string>();
}
