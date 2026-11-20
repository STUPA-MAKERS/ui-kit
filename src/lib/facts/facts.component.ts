import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * A list of facts: a label and a value each (app spec 001965). Put it on the `<dl>`; each
 * fact is a `<div>` with a `<dt>` and a `<dd>` (or a `<dt>` and a `<dd>` straight in the list).
 *
 * - `grid` (default): the label small and muted above the value, the facts in columns that
 *   fill the width. `--facts-cols` sets the columns (default: as many of 9.5rem as fit).
 *   `card` puts the grid on a surface-2 card.
 * - `rows`: the label in a column left of the value, one fact per line; the labels of all
 *   rows share one column.
 *
 * A fact with the class `facts__wide` takes a whole line of the grid. A value wraps anywhere,
 * so an id or an address is never cut.
 *
 * ```html
 * <dl appFacts [card]="true">
 *   <div><dt>Betrag</dt><dd class="mono">120,00 €</dd></div>
 *   <div class="facts__wide"><dt>Verwendungszweck</dt><dd>{{ purpose }}</dd></div>
 * </dl>
 * ```
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dl[appFacts]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'facts',
    '[class.facts--rows]': "layout() === 'rows'",
    '[class.facts--card]': 'card()',
  },
  template: '<ng-content />',
  styleUrl: './facts.component.scss',
})
export class FactsComponent {
  /** `grid`: label above value in columns; `rows`: label left of value, one fact per line. */
  readonly layout = input<'grid' | 'rows'>('grid');
  /** Put the list on a surface-2 card. */
  readonly card = input(false);
}
