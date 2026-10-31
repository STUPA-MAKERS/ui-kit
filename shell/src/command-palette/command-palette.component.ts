import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  EmptyStateComponent,
  HighlightComponent,
  IconComponent,
  type IconName,
  StatusTextComponent,
  TruncatedDirective,
  UiKitTranslatePipe,
  isApplePlatform,
} from '@stupa-makers/ui-kit';
import { CommandPalette } from './command-palette.service';

/** One row of the palette. */
export interface PaletteRow {
  /** Unique over all groups: the DOM id and the key of the row. */
  readonly id: string;
  readonly icon: IconName;
  readonly title: string;
  readonly subtitle?: string | null;
  /** The URL to open on a pick. `navigateByUrl` parses it, so it may carry a query string. */
  readonly link?: string | null;
  /** The subtitle is a state: it shows as neutral status text. */
  readonly status?: boolean;
  /** The row marks the record as archived, so it is not read as current. */
  readonly archived?: boolean;
}

/** One group of rows under a heading, for example "Pages" or "Applications". */
export interface PaletteGroup {
  readonly label: string;
  readonly rows: readonly PaletteRow[];
}

/**
 * Global search, as a command palette: a dialog with one field and the matching rows in
 * groups. The app owns the search: it reads `query`, runs its sources and gives the
 * `groups`, `loading` and `truncated` back. The palette owns the dialog, the field, the
 * keyboard and the empty and "more results" lines.
 *
 * The field is a combobox: the focus stays in it, the arrow keys move the active row
 * (`aria-activedescendant`), Enter opens it and Escape closes the palette. Tab stays inside
 * the dialog: it goes round between the field and the close button. The
 * {@link CommandPalette} service opens it from anywhere; Ctrl+K (⌘K) toggles it. Each
 * opening starts with an empty field, and a close gives the focus back to where it was.
 *
 * A pick emits `pick` and opens the `link` of the row, if it has one.
 */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    HighlightComponent,
    TruncatedDirective,
    UiKitTranslatePipe,
    IconComponent,
    StatusTextComponent,
  ],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);
  private readonly palette = inject(CommandPalette);

  /** The rows, in groups. The keyboard walks them in this order. */
  readonly groups = input<readonly PaletteGroup[]>([]);
  /** The text of the field. The palette clears it on each opening. */
  readonly query = model('');
  /** A search runs: the field shows a spinner and no "nothing found" line. */
  readonly loading = input(false);
  /** A source had more than it returned: a line at the foot asks to narrow the query. */
  readonly truncated = input(false);
  /** The placeholder of the field. Default: "Suchen …" of `UI_KIT_INTL`. */
  readonly placeholder = input<string | null>(null);
  /** Below this many characters the palette shows no "nothing found" line. */
  readonly minQuery = input(2);

  /** A row was picked with a click or Enter. */
  readonly pick = output<PaletteRow>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  /** `⎋` is the key's own symbol on Apple keyboards; elsewhere the word is clearer. */
  protected readonly escLabel = isApplePlatform() ? '⎋' : 'Esc';

  readonly open = this.palette.isOpen;
  /** Index of the highlighted row, over the flattened list. */
  readonly active = signal(0);

  /** Where the focus was before the palette opened; it goes back there on close. */
  private returnFocus: HTMLElement | null = null;

  /** The rows of every group in one list, for the keyboard. */
  readonly rows = computed<PaletteRow[]>(() => this.groups().flatMap((g) => g.rows));

  /** The id of the active row, for `aria-activedescendant`. */
  readonly activeId = computed(() => {
    const row = this.rows()[this.active()];
    return row ? this.optionId(row) : null;
  });

  readonly showEmpty = computed(
    () => !this.loading() && this.query().trim().length >= this.minQuery() && !this.rows().length,
  );
  readonly showTruncated = computed(() => this.truncated() && this.rows().length > 0);

  constructor() {
    this.palette.opened$.pipe(takeUntilDestroyed()).subscribe(() => this.reset());

    effect(() => {
      if (this.open()) queueMicrotask(() => this.field()?.nativeElement.focus());
    });

    /** New rows start at the first one. */
    effect(() => {
      this.groups();
      this.active.set(0);
    });
  }

  show(): void {
    this.palette.open();
  }

  close(): void {
    if (!this.open()) return;
    this.palette.close();
    const target = this.returnFocus;
    this.returnFocus = null;
    if (target?.isConnected) target.focus();
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  /**
   * The row keys belong to the field, but on the close button Enter must press the button.
   * The rows can shrink under a kept index, so the last row is then the nearest.
   */
  @HostListener('document:keydown', ['$event'])
  onDocumentKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.open()) this.close();
      else this.show();
      return;
    }
    if (!this.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapTab(event);
      return;
    }
    if (event.target !== this.field()?.nativeElement) return;
    const rows = this.rows();
    if (!rows.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveTo(rows, (this.active() + 1) % rows.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveTo(rows, (this.active() - 1 + rows.length) % rows.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.go(rows[Math.min(this.active(), rows.length - 1)]);
    }
  }

  /** Close the palette, emit the row and open its link. The focus goes to the new page. */
  go(row: PaletteRow): void {
    this.returnFocus = null;
    this.close();
    this.pick.emit(row);
    if (row.link) void this.router.navigateByUrl(row.link);
  }

  /** Flat index of a row, so the template can mark the active one across groups. */
  indexOf(row: PaletteRow): number {
    return this.rows().findIndex((r) => r.id === row.id);
  }

  /** A stable DOM id for a row. */
  optionId(row: PaletteRow): string {
    return `palette-option-${row.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  }

  private reset(): void {
    this.returnFocus = document.activeElement as HTMLElement | null;
    this.query.set('');
    this.active.set(0);
  }

  /**
   * Keep the focus in the dialog (`aria-modal`). The rows are not tab stops (the arrow
   * keys move between them), so Tab goes round between the field and the close button.
   */
  private trapTab(event: KeyboardEvent): void {
    const first = this.field()?.nativeElement;
    const last = this.closeButton()?.nativeElement;
    if (!first || !last) return;
    const current = document.activeElement;
    let next: HTMLElement | null = null;
    if (current !== first && current !== last) next = first;
    else if (event.shiftKey && current === first) next = last;
    else if (!event.shiftKey && current === last) next = first;
    if (next) {
      event.preventDefault();
      next.focus();
    }
  }

  /** Make a row the active one and scroll it into the visible part of the list. */
  private moveTo(rows: PaletteRow[], index: number): void {
    this.active.set(index);
    const id = this.optionId(rows[index]);
    queueMicrotask(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }));
  }
}
