import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Announcer } from '../announce/announcer';
import { IconComponent } from '../icon/icon.component';
import { UI_KIT_INTL, type UiKitIntl } from '../intl/intl';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { searchShortcutKeys, searchShortcutLabel } from './shortcut';

/** The count is read this long after the last change, so typing does not read each step. */
export const SEARCH_RESULTS_SETTLE_MS = 600;

/** "Keine Treffer", "1 Treffer" or "n Treffer". */
function resultText(i18n: UiKitIntl, count: number): string {
  if (count === 0) return i18n.translate('search.none');
  return count === 1 ? i18n.translate('search.resultsOne') : i18n.translate('search.results', { n: count });
}

/** `button` opens something (the command palette); `input` filters in place. */
export type SearchPillMode = 'button' | 'input';

/**
 * The round search field.
 *
 * - `input` (default): a search input that searches while the user types. There is no
 *   "Suchen" button: `value` is two-way, and the page runs the search on each change
 *   (`liveSearch` of the kit for a request). Escape clears it, and so
 *   does the × button with `clearable`. Enter submits no form; it emits `commit`, so
 *   the page can search at once. `busy` swaps the magnifier for a small spinner of the same size (no layout jump).
 * - `button`: looks the same but is a button that emits `activate`, for example to open
 *   the command palette. With `shortcut` it shows the key hint ("Strg+K", "⌘K" on a Mac)
 *   and names the shortcut for screen readers.
 *
 * The `[trail]` slot takes a control at the end of the pill, for example the filter
 * button of a list or the account button on a phone. It sits beside the field, never in
 * it, so the two stay separate controls.
 */
@Component({
  selector: 'app-search-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, UiKitTranslatePipe],
  host: {
    '[class.sp--md]': "size() === 'md'",
  },
  templateUrl: './search-pill.component.html',
  styleUrl: './search-pill.component.scss',
})
export class SearchPillComponent {
  private readonly i18n = inject(UI_KIT_INTL);

  readonly mode = input<SearchPillMode>('input');
  /** The visible text in the empty field, for example "Anträge durchsuchen". */
  readonly placeholder = input.required<string>();
  /** The accessible name. Defaults to the placeholder. */
  readonly label = input<string | null>(null);
  /** Show the shortcut hint (button mode). */
  readonly shortcut = input(false);
  /** `lg` is 52px high (the main search), `md` is 44px (a list filter). */
  readonly size = input<'lg' | 'md'>('lg');
  /** Show a × button that clears a filled field (input mode). */
  readonly clearable = input(false);
  /** A search runs (input mode): the magnifier becomes a spinner. */
  readonly busy = input(false);
  /**
   * The number of hits for the text in the field (input mode). While the field has a text
   * and no search runs, the pill reads the count out ("3 Treffer", "Keine Treffer") once
   * the typing has settled (spec 000517). `null`: no count, nothing is read.
   */
  readonly results = input<number | null>(null);

  /** The search text (input mode). */
  readonly value = model('');
  /** The button was pressed (button mode). */
  readonly activate = output<void>();
  /** Enter in the field (input mode): search now, without the debounce. */
  readonly commit = output<void>();

  protected readonly name = computed(() => this.label() ?? this.placeholder());
  protected readonly keyLabel = computed(() => searchShortcutLabel(this.i18n.lang()));
  protected readonly keys = computed(() => (this.shortcut() ? searchShortcutKeys() : null));

  private readonly announcer = inject(Announcer);
  /** The text and count that were read last, so a re-render does not read them again. */
  private spoken = '';

  constructor() {
    effect((onCleanup) => {
      const text = this.value().trim();
      const count = this.results();
      if (this.mode() !== 'input' || this.busy() || !text || count === null) return;
      const key = `${text}\u0000${count}`;
      if (key === this.spoken) return;
      const timer = setTimeout(() => {
        this.spoken = key;
        this.announcer.announce(resultText(this.i18n, count));
      }, SEARCH_RESULTS_SETTLE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.value() !== '') {
      event.preventDefault();
      event.stopPropagation();
      this.value.set('');
      return;
    }
    if (event.key === 'Enter' && !event.isComposing) {
      // The field searches by itself. Enter must not submit a form around it (a dialog
      // would save), it only asks for the search now.
      event.preventDefault();
      this.commit.emit();
    }
  }

  protected clear(input: HTMLInputElement): void {
    this.value.set('');
    input.focus();
  }
}
