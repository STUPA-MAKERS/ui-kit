import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * A bar that never scrolls away: the search field of a list page and its filter chips.
 *
 * The bar is `position: sticky` at the top of the viewport, below the shell header and
 * the safe area (`--layout-header-height`, `env(safe-area-inset-top)`). It has the page
 * background, so the rows that scroll under it do not show through. While rows are under
 * it (the bar is "stuck"), a short fade below the bar shows that the list continues. On a
 * phone the bar is frosted glass from edge to edge instead, which fades out below it.
 *
 * The scroll container gets `--stb-bottom`, the offset of the lower edge of the stuck bar,
 * so the head of a group of rows (`app-list-group`) sticks right below the bar, and
 * `--stb-height`, the height of the bar, so the glass of that head can reach up behind the
 * bar and be one surface with it.
 *
 * Put the bar as a direct child of the element that holds the list, not into a small
 * wrapper: a sticky element stays inside its parent, so a parent as high as the bar holds
 * it in place and it scrolls away.
 *
 * In a list/detail column whose rows scroll by themselves (side by side, `.ld-pane`), the
 * bar never sticks: the column keeps the search above its scrolling rows. The bar then
 * makes the head of the column one glass surface over the rows: it marks the column
 * `.ld-pane--glass` and the rows `.ld-pane__rows`, sets `--ld-pane-head` (the height of the
 * head with the gap below it), `--ld-pane-lift` (the gap from the column to the top edge
 * of the screen) and `.ld-pane--scrolled` while rows are under the head
 * (`styles/list-detail.scss`).
 *
 * Scroll container: the bar sticks in the nearest ancestor that scrolls (`overflow-y`
 * auto or scroll), else in the window. In the admin sheet, whose body scrolls inside its
 * round corners, the bar so sticks to the top of the body and reads the body scroll.
 *
 * Keyboard focus: while the bar exists, its scroll container (the document, or the
 * scrolling ancestor) gets a `scroll-padding-top` of the height of the bar. A row that
 * gets the focus by Tab then scrolls to a position below the bar, not under it.
 *
 * `sticky` set to false turns the bar off (`display: contents`): the content stays in the
 * flow as if the bar were not there. A page so keeps one template for a header that sticks
 * only on some widths.
 *
 * Layers: the bar sits below the floating action button, the phone bottom bar, menus and
 * dialogs. While a control in the bar has an open popup (`aria-expanded="true"`, for
 * example the filter panel of the kit, which is a bottom sheet on a phone), the bar goes
 * up to the dialog layer, so that the popup is not under the bottom bar.
 */
@Component({
  selector: 'app-sticky-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.stb--stuck]': 'sticky() && stuck()',
    '[class.stb--off]': '!sticky()',
  },
  template: '<ng-content />',
  styleUrl: './sticky-bar.component.scss',
})
export class StickyBarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** False turns the bar off: no sticky position, no background, no fade. */
  readonly sticky = input(true);

  /** Rows scroll under the bar: it is at its sticky offset, above its place in the flow. */
  protected readonly stuck = signal(false);
  /** This bar set the scroll padding of its scroll container, so it removes it again. */
  private ownsPadding: HTMLElement | null = null;
  /** The scrolling ancestor, or null for the window (see {@link scrollParent}). */
  private scroller: HTMLElement | null = null;
  /** The rows of the list column that scroll by themselves (see {@link paneRows}). */
  private rows: HTMLElement | null = null;
  private onRowsScroll: (() => void) | null = null;

  constructor() {
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        this.measure();
      });
    };
    let observer: ResizeObserver | null = null;

    this.onRowsScroll = schedule;
    afterNextRender(() => {
      this.scroller = scrollParent(this.host.nativeElement);
      this.scroller?.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      observer = new ResizeObserver(schedule);
      observer.observe(this.host.nativeElement);
      this.measure();
    });
    // A bar that turns on or off changes the room that the focus scroll must keep clear.
    effect(() => {
      this.sticky();
      schedule();
    });

    inject(DestroyRef).onDestroy(() => {
      if (frame) cancelAnimationFrame(frame);
      this.scroller?.removeEventListener('scroll', schedule);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      this.setPadding(null);
      this.setRows(null);
    });
  }

  /** Read the position of the bar; set the stuck state and the scroll padding. */
  protected measure(): void {
    const el = this.host.nativeElement;
    this.measureRows();
    if (!this.sticky()) {
      this.stuck.set(false);
      this.setPadding(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(el).top) || 0;
    // A sub-pixel layout leaves a fraction of a pixel between the bar and its offset.
    const slack = 1;
    const scroller = this.scroller;
    const scrolled = scroller ? scroller.scrollTop > 0 : window.scrollY > 0;
    // In a scrolling box the bar sticks below the top padding of the box.
    const inset = scroller ? parseFloat(getComputedStyle(scroller).paddingTop) || 0 : 0;
    const edge = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop + inset : 0;
    this.stuck.set(scrolled && rect.height > 0 && rect.top <= edge + top + slack);
    // A hidden bar (height 0) keeps nothing clear.
    // The scroll padding counts from the edge of the scroll port, so it includes the top
    // padding of a scrolling box.
    this.setPadding(
      rect.height > 0 ? Math.ceil(inset + top + rect.height) : null,
      Math.ceil(top + rect.height),
      Math.ceil(rect.height),
    );
  }

  /**
   * The glass head of a list column whose rows scroll by themselves: mark the column and
   * the rows, and set the height of the head and the scrolled state.
   */
  private measureRows(): void {
    const el = this.host.nativeElement;
    const rows = paneRows(el);
    this.setRows(rows);
    const pane = el.parentElement;
    if (!rows || !pane) return;
    // The place of the rows in the flow, without the pull under the head: it includes the
    // gap of the column and the negative margin of this bar (`--stb-pad`).
    // Counted from the top padding of the column, which is the lift below: the column
    // adds the two (`--ld-pane-top`).
    const pulled = parseFloat(getComputedStyle(rows).marginTop) || 0;
    const padding = parseFloat(getComputedStyle(pane).paddingTop) || 0;
    const head = rows.offsetTop - pulled - padding;
    pane.style.setProperty('--ld-pane-head', `${Math.round(head)}px`);
    // The column reaches up to the top edge of the screen, so the glass and the rows under
    // it do too: the lift is the gap between the box that holds the column and that edge.
    const lift = Math.max(0, pane.parentElement?.getBoundingClientRect().top ?? 0);
    pane.style.setProperty('--ld-pane-lift', `${Math.round(lift)}px`);
    pane.classList.toggle('ld-pane--scrolled', rows.scrollTop > 0);
  }

  /** Attach to the rows `rows` (null: none), and undo the marks of the rows before. */
  private setRows(rows: HTMLElement | null): void {
    if (rows === this.rows) return;
    const old = this.rows;
    if (old && this.onRowsScroll) {
      old.removeEventListener('scroll', this.onRowsScroll);
      old.classList.remove('ld-pane__rows');
      const pane = old.parentElement;
      pane?.classList.remove('ld-pane--glass', 'ld-pane--scrolled');
      pane?.style.removeProperty('--ld-pane-head');
      pane?.style.removeProperty('--ld-pane-lift');
    }
    this.rows = rows;
    if (rows && this.onRowsScroll) {
      rows.addEventListener('scroll', this.onRowsScroll, { passive: true });
      rows.classList.add('ld-pane__rows');
      rows.parentElement?.classList.add('ld-pane--glass');
    }
  }

  /**
   * Set the scroll padding of the scroll container (the document, or the scrolling
   * ancestor) and `--stb-bottom` and `--stb-height` for the group heads, or remove them
   * (`null`) if this bar set them.
   */
  private setPadding(px: number | null, bottom = 0, height = 0): void {
    const target = this.scroller ?? document.documentElement;
    if (px !== null) {
      target.style.setProperty('scroll-padding-top', `${px}px`);
      // A sticky offset counts from the edge of the scroll port, without its padding.
      target.style.setProperty('--stb-bottom', `${bottom}px`);
      target.style.setProperty('--stb-height', `${height}px`);
      this.ownsPadding = target;
    } else if (this.ownsPadding) {
      this.ownsPadding.style.removeProperty('scroll-padding-top');
      this.ownsPadding.style.removeProperty('--stb-bottom');
      this.ownsPadding.style.removeProperty('--stb-height');
      this.ownsPadding = null;
    }
  }
}

/**
 * The rows of the list column of `bar` that scroll by themselves: the first scroll
 * container after the bar among its siblings, when the bar is the search bar of a list
 * column (`.ld-pane > .ld-pane__filters`). Null when the bar is somewhere else or the
 * page scrolls (one pane at a time).
 */
export function paneRows(bar: HTMLElement): HTMLElement | null {
  if (!bar.classList.contains('ld-pane__filters')) return null;
  if (!bar.parentElement?.classList.contains('ld-pane')) return null;
  for (let n = bar.nextElementSibling; n; n = n.nextElementSibling) {
    if (!(n instanceof HTMLElement)) continue;
    // Our own mark sets no overflow, so a former scroll container is read afresh.
    const y = getComputedStyle(n).overflowY;
    if (y === 'auto' || y === 'scroll') return n;
  }
  return null;
}

/** The nearest ancestor that scrolls vertically, or null when the window scrolls. */
export function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const y = getComputedStyle(p).overflowY;
    if (y === 'auto' || y === 'scroll') return p;
  }
  return null;
}
