import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

let nextId = 0;

/**
 * A search field with its hits in a list below it (a combobox), in the filled box of the
 * kit fields with the label inside. The page searches: it gets the text from
 * `queryChange`, and gives the hits as `options` and the open state as `open`.
 *
 * ```html
 * <app-autocomplete inputId="booking-app" [label]="…" [query]="q()" [options]="hits()"
 *   [open]="hits().length > 0" [picked]="chosen() ? q() : null" [clearLabel]="…"
 *   (queryChange)="search($event)" (choose)="pick($event)" (cleared)="clear()" />
 * ```
 *
 * A row shows `optionLabel(option)`, or the `ng-template` in the content
 * (`<ng-template let-o>…</ng-template>`). After a choice, `picked` is the text of the
 * choice: the field shows it with an × button that unlinks it.
 *
 * Keyboard: ArrowDown and ArrowUp move through the hits, Enter takes the active hit,
 * Escape closes the list until the next input. A row is also a button for a click.
 *
 * `--autocomplete-picked-wrap: anywhere` lets the chosen text wrap; by default it ends
 * with an ellipsis and shows the full text as a tooltip. Use it for a name or an e-mail.
 */
@Component({
  selector: 'app-autocomplete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
})
export class AutocompleteComponent<T> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly name = input('');
  readonly placeholder = input('');
  /** The text in the field. */
  readonly query = input('');
  readonly options = input<readonly T[]>([]);
  /** The page has hits to show. */
  readonly open = input(false);
  /** The text of the choice, or null while nothing is chosen. */
  readonly picked = input<string | null>(null);
  /** The name of the × button after a choice ("Verknüpfung lösen"). */
  readonly clearLabel = input('');
  /** The chosen text wraps instead of ending with an ellipsis (a name, an e-mail). */
  readonly wrapPicked = input(false);
  readonly optionLabel = input<(option: T) => string>((option) => String(option));

  readonly queryChange = output<string>();
  readonly choose = output<T>();
  readonly cleared = output<void>();

  protected readonly optionTemplate = contentChild(TemplateRef<{ $implicit: T }>);

  protected readonly listId = `app-ac-${nextId++}`;
  protected readonly active = signal(-1);
  private readonly dismissed = signal(false);
  protected readonly shown = computed(
    () => this.open() && !this.dismissed() && this.options().length > 0,
  );

  constructor() {
    // New hits: no active row until the arrow keys pick one.
    effect(() => {
      this.options();
      untracked(() => this.active.set(-1));
    });
  }

  protected optionId(index: number): string {
    return `${this.listId}-${index}`;
  }

  protected onInput(event: Event): void {
    this.dismissed.set(false);
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.options().length;
    if (event.key === 'Escape') {
      if (!this.shown()) return;
      event.preventDefault();
      event.stopPropagation();
      this.dismissed.set(true);
      this.active.set(-1);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (count === 0) return;
      event.preventDefault();
      this.dismissed.set(false);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const now = this.active();
      this.active.set(now < 0 ? (step > 0 ? 0 : count - 1) : (now + step + count) % count);
      this.reveal();
      return;
    }
    if (event.key === 'Enter' && this.shown() && this.active() >= 0) {
      event.preventDefault();
      this.pick(this.options()[this.active()]);
    }
  }

  protected pick(option: T): void {
    this.active.set(-1);
    this.choose.emit(option);
  }

  private reveal(): void {
    const el = document.getElementById(this.optionId(this.active()));
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }
}
