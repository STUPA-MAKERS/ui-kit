import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { highlight } from './highlight';

/**
 * A text with every match of the query marked, without regard to case ("Lastenrad" for
 * "rad"). It renders inline, so it sits in a title, a link or a list row.
 *
 * `<app-highlight [text]="row.title" [query]="query()" />`
 *
 * The look of a match comes from custom properties on the host or an ancestor:
 * `--highlight-bg` (default `var(--color-selected)`), `--highlight-color` (inherit),
 * `--highlight-weight` (inherit), `--highlight-radius` (3px) and `--highlight-padding`
 * (0 1px). Use {@link highlight} for the parts as data.
 */
@Component({
  selector: 'app-highlight',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './highlight.component.html',
  styleUrl: './highlight.component.scss',
})
export class HighlightComponent {
  readonly text = input('');
  readonly query = input('');

  protected readonly parts = computed(() => highlight(this.text(), this.query()));
}
