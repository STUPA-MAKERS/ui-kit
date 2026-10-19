import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The filled box of a multi-line field with the label inside, around a native
 * `<textarea>` of the page. The page keeps its own textarea, so `ngModel`, `required`
 * and directives on it (an image upload, for example) work as before; the box gives it
 * the look of the kit fields and the label.
 *
 * ```html
 * <app-textarea [label]="'Notiz'">
 *   <textarea name="note" rows="3" [(ngModel)]="note"></textarea>
 * </app-textarea>
 * ```
 *
 * The box is a `<label>`, so a click anywhere in it focuses the textarea, and the label
 * names it. `invalid` draws the error edge; give the textarea `aria-invalid` too.
 * `grow` lets the textarea grow with its text instead of a resize handle.
 *
 * Custom properties: `--textarea-min-height` (default 3.75rem) and
 * `--textarea-font-size` (default `--fs-md`).
 */
@Component({
  selector: 'app-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent {
  readonly label = input.required<string>();
  readonly invalid = input(false);
  readonly grow = input(false);
}
