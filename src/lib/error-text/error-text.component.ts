import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * An error text in a dialog, a sheet or a form (app spec 001963): a refusal of the server,
 * a conflict, or a rule that the input breaks. The text is small and in the danger colour,
 * and a screen reader announces it when it appears (`role="alert"`), so put it behind the
 * `@if` of its error.
 *
 * `inset` indents the text like the text inside a field (16px), for an error under a field
 * or a field group. An icon as the first child stands on the line of the text.
 *
 * ```html
 * @if (refusal(); as text) {
 *   <app-error-text>{{ text }}</app-error-text>
 * }
 * ```
 *
 * An error of one field belongs to the `error` input of the field. A box with an icon that
 * stays on the page is `app-note kind="error"`.
 */
@Component({
  selector: 'app-error-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'err-text', role: 'alert', '[class.err-text--inset]': 'inset()' },
  template: '<ng-content />',
  styleUrl: './error-text.component.scss',
})
export class ErrorTextComponent {
  /** Indent the text like the text inside a field. */
  readonly inset = input(false);
}
