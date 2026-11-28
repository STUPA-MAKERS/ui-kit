import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

/**
 * The edit button in the head of a detail sheet (app spec 001350). On a phone it is a tonal
 * button with its text; elsewhere it is an icon button whose name is also the tooltip.
 *
 * `<app-edit-button [phone]="phone()" [label]="'invoices.edit' | t" [text]="'action.edit' | t" (pressed)="edit()" />`
 *
 * The host carries `btn-grp__seg`, so the button joins the shape of the button group of the
 * head like a button that stands there directly.
 */
@Component({
  selector: 'app-edit-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  host: { class: 'btn-grp__seg' },
  templateUrl: './edit-button.component.html',
  styleUrl: './edit-button.component.scss',
})
export class EditButtonComponent {
  /** A phone: the button shows its text. */
  readonly phone = input(false);
  /** The name and tooltip of the icon button. */
  readonly label = input.required<string>();
  /** The text of the button on a phone. */
  readonly text = input.required<string>();
  readonly pressed = output();
}
