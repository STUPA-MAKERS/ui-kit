import { DomPortalOutlet, TemplatePortal } from '@angular/cdk/portal';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  Injector,
  type TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { IconComponent } from '../icon/icon.component';
import type { IconName } from '../icon/icon.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { isApplePlatform } from '../search-pill/shortcut';

/** One hit of a search window. */
export interface SearchWindowRow {
  /** Unique in the list: the key and the DOM id of the row. */
  readonly id: string;
  readonly icon: IconName;
  readonly title: string;
  readonly subtitle?: string | null;
}

/**
 * A search window with the look of the global search (002760): a floating panel with the
 * search pill and the hits as rows. The consumer owns the search: it reads `query`, runs
 * its source and gives `rows`, `loading` and `error` back. The window owns the panel, the
 * field, the keyboard and the empty line.
 *
 * The field is a combobox: the focus stays in it, the arrow keys move the active row,
 * Enter picks it and Escape closes the window. The key "Esc" in the field is the close
 * button, on a phone a ×. Each opening starts with an empty field, and a close gives the
 * focus back to where it was. The panel is rendered at the end of `<body>`, because a
 * dialog or a sheet around the window clips and transforms its content.
 */
@Component({
  selector: 'app-search-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, IconComponent, UiKitTranslatePipe],
  templateUrl: './search-window.component.html',
  styleUrl: './search-window.component.scss',
})
export class SearchWindowComponent {
  readonly open = model(false);
  /** The text of the field. The window clears it on each opening. */
  readonly query = model('');
  /** The accessible name of the window and the placeholder of the field. */
  readonly label = input.required<string>();
  /** The hits. The keyboard walks them in this order. */
  readonly rows = input<readonly SearchWindowRow[]>([]);
  /** A search runs: the field shows a spinner and the window no empty line. */
  readonly loading = input(false);
  /** The search failed: the window shows this text in place of the hits. */
  readonly error = input<string | null>(null);
  /** The heading of the empty state, while the search has no hit. */
  readonly empty = input<string | null>(null);

  /** A row was picked with a click or with Enter. The window stays open. */
  readonly picked = output<SearchWindowRow>();

  /** `⎋` is the key's own symbol on Apple keyboards; elsewhere the word is clearer. */
  protected readonly escLabel = isApplePlatform() ? '⎋' : 'Esc';
  /** Index of the highlighted row. */
  readonly active = signal(0);
  readonly activeId = computed(() => {
    const row = this.rows()[this.active()];
    return row ? this.optionId(row) : null;
  });
  readonly showEmpty = computed(
    () => !this.loading() && !this.error() && !this.rows().length && !!this.empty(),
  );

  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly panel = viewChild<TemplateRef<unknown>>('panel');
  private outlet: DomPortalOutlet | null = null;
  private host: HTMLElement | null = null;
  /** Where the focus was before the window opened; it goes back there on close. */
  private returnFocus: HTMLElement | null = null;

  /**
   * An `open` that is true before the first render waits for the template, because the
   * query of the template runs the effect again.
   */
  constructor() {
    effect(() => {
      const panel = this.panel();
      const open = this.open();
      untracked(() => {
        if (!open) this.detach();
        else if (panel) this.attach(panel);
      });
    });
    /** New rows start at the first one. */
    effect(() => {
      this.rows();
      this.active.set(0);
    });
    inject(DestroyRef).onDestroy(() => this.dispose());
  }

  private attach(panel: TemplateRef<unknown>): void {
    if (this.outlet) return;
    this.returnFocus = this.document.activeElement as HTMLElement | null;
    this.query.set('');
    this.active.set(0);
    this.host = this.document.createElement('div');
    this.host.setAttribute('class', 'sw-layer');
    this.document.body.appendChild(this.host);
    this.outlet = new DomPortalOutlet(this.host, this.appRef, this.injector);
    this.outlet.attach(new TemplatePortal(panel, this.viewContainer));
    queueMicrotask(() => this.field()?.focus());
  }

  private detach(): void {
    if (!this.outlet) return;
    const target = this.returnFocus;
    this.returnFocus = null;
    this.dispose();
    if (target?.isConnected) target.focus();
  }

  private dispose(): void {
    this.outlet?.dispose();
    this.outlet = null;
    this.host?.remove();
    this.host = null;
  }

  private field(): HTMLInputElement | null {
    return this.host?.querySelector<HTMLInputElement>('.sw__input') ?? null;
  }

  close(): void {
    this.open.set(false);
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  pick(row: SearchWindowRow): void {
    this.picked.emit(row);
  }

  /** A stable DOM id for a row. */
  optionId(row: SearchWindowRow): string {
    return `search-window-option-${row.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  }

  /**
   * Escape closes the window and Tab stays in it. Both stop here, so a dialog under the
   * window neither closes nor pulls the focus back. The row keys belong to the field: on
   * the close button Enter presses the button.
   */
  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    const field = this.field();
    if (event.key === 'Tab') {
      event.stopPropagation();
      const close = this.host?.querySelector<HTMLElement>('.sw__close');
      const next = this.document.activeElement === field ? close : field;
      event.preventDefault();
      next?.focus();
      return;
    }
    const rows = this.rows();
    if (event.target !== field || !rows.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveTo(rows, (this.active() + 1) % rows.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveTo(rows, (this.active() - 1 + rows.length) % rows.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.pick(rows[Math.min(this.active(), rows.length - 1)]);
    }
  }

  /** Make a row the active one and scroll it into the visible part of the list. */
  private moveTo(rows: readonly SearchWindowRow[], index: number): void {
    this.active.set(index);
    const id = this.optionId(rows[index]);
    queueMicrotask(() => this.document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' }));
  }
}
