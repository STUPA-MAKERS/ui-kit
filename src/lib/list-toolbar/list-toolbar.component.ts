import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchPillComponent } from '../search-pill/search-pill.component';

/**
 * The toolbar above a list: the search field, and under it the filter chips that the page
 * projects, with the count of the list at the end of their row.
 *
 * ```html
 * <app-list-toolbar placeholder="Protokolle durchsuchen" [value]="text()" [results]="total()"
 *   [count]="countText()" (valueChange)="search($event)" (commit)="searchNow()">
 *   <app-filter-select … />
 * </app-list-toolbar>
 * ```
 *
 * `results` is the number of hits that the field shows while it holds a text; `count` is the
 * text at the end of the chips row, and `null` hides it (while the list loads).
 */
@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchPillComponent],
  templateUrl: './list-toolbar.component.html',
  styleUrl: './list-toolbar.component.scss',
})
export class ListToolbarComponent {
  readonly placeholder = input.required<string>();
  readonly value = input('');
  readonly results = input<number | null>(null);
  readonly count = input<string | null>(null);
  readonly valueChange = output<string>();
  readonly commit = output<void>();
}
