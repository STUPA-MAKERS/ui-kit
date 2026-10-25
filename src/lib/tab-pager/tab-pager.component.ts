import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { motionReduced } from '../gesture/gesture';
import { TabsComponent, type TabItem } from '../tabs/tabs.component';
import { TabPageDirective } from './tab-page.directive';

/** The pager counts as at a page within this share of a page (a fractional screen width). */
const ARRIVED = 0.05;

/**
 * Tabs with their pages: the one way a page with tabs looks and moves on a phone.
 *
 * `paged` (a phone): the tab bar and, under it, one page per tab side by side in a
 * horizontal scroller with CSS scroll snap, so a swipe moves to the next tab and the
 * next page is already there beside the one that leaves. A tab scrolls the pager to its
 * page. The ink under the tabs moves with the scroll, between two tabs while the pager is
 * between two pages, and the active tab changes at the half way. A tab bar wider than the
 * screen scrolls its active tab into view.
 *
 * Without `paged` (a desktop): the tab bar and the page of the active tab; the other
 * pages stay in the DOM, hidden, so their state and scroll survive a tab change.
 *
 * The pages are templates: `<ng-template appTabPage="files">`, or one
 * `<ng-template appTabPage let-id>` for every tab (the columns of a board). Each page is
 * a `role="tabpanel"` with the ids the tabs point to.
 *
 * `fill`: the pager takes the height its host gives it, and each page scrolls down by
 * itself (a board column, a chat log). Without it, the pager is as high as the active
 * page, and the page scrolls with the document. Paged, the pager also takes the free
 * height below it in a flex column, so a swipe works on the empty space under a short page.
 *
 * The host sets `--tab-pager-bleed` to the page gutter (`--space-4` on a phone): the tab
 * bar, its line and the pager then run over the gutter to the screen edges, so a tab or a
 * page leaves at the edge of the screen, and each page keeps the gutter inside.
 */
@Component({
  selector: 'app-tab-pager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TabsComponent],
  templateUrl: './tab-pager.component.html',
  styleUrl: './tab-pager.component.scss',
  host: {
    '[class.tp--paged]': 'paged()',
    '[class.tp--fill]': 'fill()',
  },
})
export class TabPagerComponent {
  private readonly zone = inject(NgZone);
  private readonly injector = inject(Injector);

  readonly tabs = input<readonly TabItem[]>([]);
  readonly active = model<string | null>(null);
  readonly ariaLabel = input('');
  readonly idPrefix = input('tp');
  /** One page per tab side by side, moved by a swipe (a phone). */
  readonly paged = input(false);
  /** The pager fills its host and each page scrolls by itself. */
  readonly fill = input(false);

  private readonly pages = contentChildren(TabPageDirective);
  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');
  private readonly ink = viewChild<ElementRef<HTMLElement>>('ink');
  private readonly pager = viewChild<ElementRef<HTMLElement>>('pager');
  private readonly tabBar = viewChild(TabsComponent);

  /** The active tab; with no valid `active` the first enabled tab. */
  readonly current = computed(() => {
    const tabs = this.tabs();
    const hit = tabs.find((t) => t.id === this.active() && !t.disabled);
    return (hit ?? tabs.find((t) => !t.disabled))?.id ?? null;
  });
  readonly index = computed(() => Math.max(0, this.tabs().findIndex((t) => t.id === this.current())));

  /** A tapped tab: the page the pager scrolls to. The tabs keep it until the scroll arrives. */
  private target: number | null = null;
  /** The page of a tab that a swipe or a tap made active: the pager is on its way there. */
  private headed: number | null = null;
  private frame = 0;
  private placed = false;
  private readonly resize =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          this.placeInk();
          this.fitHeight();
        })
      : null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.frame);
      this.resize?.disconnect();
    });
    // A web font that loads after the first frame changes the width of the tabs.
    void (typeof document !== 'undefined' ? document.fonts?.ready : undefined)?.then(() => this.placeInk());

    // The ink follows new tabs, new counts and a new size of the bar; the strip of tabs
    // scrolls by hand too.
    effect((onCleanup) => {
      this.tabs();
      this.index();
      const bar = this.bar()?.nativeElement;
      if (!bar) return;
      const place = (): void => this.placeInk();
      let strip: HTMLElement | null = null;
      this.resize?.observe(bar);
      const ref = afterNextRender(
        () => {
          strip = bar.querySelector<HTMLElement>('[role="tablist"]');
          this.zone.runOutsideAngular(() => strip?.addEventListener('scroll', place, { passive: true }));
          this.placeInk();
        },
        { injector: this.injector },
      );
      onCleanup(() => {
        ref.destroy();
        strip?.removeEventListener('scroll', place);
        this.resize?.unobserve(bar);
      });
    });

    // A new active tab: the pager goes to its page (at once on the first render), the
    // strip shows the tab, the pager takes the page's height. A tab that a swipe made
    // active needs no scroll, because a scroll here would pull the page from the finger.
    // A tab from outside (the URL, the page) needs one.
    effect((onCleanup) => {
      const i = this.index();
      if (!this.paged()) return;
      const ref = afterNextRender(
        () => {
          if (this.headed !== i) this.goTo(i, this.placed);
          this.headed = null;
          this.placed = true;
          this.revealTab();
          this.fitHeight();
        },
        { injector: this.injector },
      );
      onCleanup(() => ref.destroy());
    });

    // The height of the pager follows the active page while its content grows or shrinks.
    effect((onCleanup) => {
      this.tabs();
      const pager = this.pager()?.nativeElement;
      if (!pager || this.fill()) return;
      const ref = afterNextRender(
        () => pager.querySelectorAll<HTMLElement>('.tp__page').forEach((p) => this.resize?.observe(p)),
        { injector: this.injector },
      );
      onCleanup(() => {
        ref.destroy();
        pager.querySelectorAll<HTMLElement>('.tp__page').forEach((p) => this.resize?.unobserve(p));
      });
    });
  }

  /** The template of a tab: its own, else the one for every tab. */
  templateFor(id: string): TabPageDirective['template'] | null {
    const pages = this.pages();
    return (pages.find((p) => p.id() === id) ?? pages.find((p) => !p.id()))?.template ?? null;
  }

  tabId(id: string): string {
    return this.tabBar()?.tabId(id) ?? `${this.idPrefix()}-tab-${id}`;
  }

  panelId(id: string): string {
    return this.tabBar()?.panelId(id) ?? `${this.idPrefix()}-panel-${id}`;
  }

  /** A tab: make it active and, paged, scroll the pager to its page. */
  select(id: string | null): void {
    const i = this.tabs().findIndex((t) => t.id === id);
    if (i < 0 || id === null) return;
    if (this.paged()) {
      this.goTo(i, true);
      this.headed = i;
    }
    this.active.set(id);
  }

  /** The pager moved: the ink follows in the next frame, the tab at the half way. */
  onScroll(): void {
    this.syncPage();
    cancelAnimationFrame(this.frame);
    this.zone.runOutsideAngular(() => {
      this.frame = requestAnimationFrame(() => {
        this.placeInk();
        this.fitHeight();
      });
    });
  }

  /** A finger on the pager ends the scroll to a tapped tab: the tabs follow the swipe. */
  onTouch(): void {
    this.target = null;
  }

  /** The scroll came to rest: whatever page it rests on is the active tab. */
  onRest(): void {
    this.target = null;
    this.syncPage();
  }

  private goTo(i: number, smooth: boolean): void {
    const el = this.pager()?.nativeElement;
    if (!el?.clientWidth) return;
    // A scroll to the page that is already there fires no scroll event to end the hold.
    if (Math.abs(Math.abs(el.scrollLeft) / el.clientWidth - i) < ARRIVED) return;
    // `scrollLeft` is negative in a right-to-left page; the sign follows the direction.
    const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    this.target = smooth ? i : null;
    el.scrollTo({ left: sign * i * el.clientWidth, behavior: smooth && !motionReduced() ? 'smooth' : 'auto' });
  }

  /**
   * The active tab is the page that fills most of the pager. During the scroll to a
   * tapped tab, the tapped tab stays active, so the tabs between do not light up.
   */
  private syncPage(): void {
    const pos = this.pagerPos();
    if (pos === null) return;
    if (this.target !== null) {
      if (Math.abs(pos - this.target) > ARRIVED) return;
      this.target = null;
    }
    const tabs = this.tabs();
    const tab = tabs[Math.max(0, Math.min(Math.round(pos), tabs.length - 1))];
    if (!tab || tab.disabled || tab.id === this.current()) return;
    this.headed = tabs.indexOf(tab);
    this.zone.run(() => this.active.set(tab.id));
  }

  /**
   * The ink under the tabs: at a page, under its tab; between two pages, between their
   * tabs, with the width blended. The rectangles come from the tabs themselves, so a long
   * label, a scrolled tab bar and a right-to-left page need nothing extra.
   */
  private placeInk(): void {
    const bar = this.bar()?.nativeElement;
    const ink = this.ink()?.nativeElement;
    if (!bar || !ink) return;
    const tabs = bar.querySelectorAll<HTMLElement>('[role="tab"]');
    if (!tabs.length) return;
    const last = tabs.length - 1;
    const pos = Math.max(0, Math.min(this.pagerPos() ?? this.index(), last));
    const i = Math.floor(pos);
    const f = pos - i;
    const from = tabs[i].getBoundingClientRect();
    const to = tabs[Math.min(i + 1, last)].getBoundingClientRect();
    const left = from.left + (to.left - from.left) * f - bar.getBoundingClientRect().left;
    ink.style.width = `${from.width + (to.width - from.width) * f}px`;
    ink.style.transform = `translateX(${left}px)`;
  }

  /** The tab bar scrolls sideways when the tabs are wider than the screen: show the active tab. */
  private revealTab(): void {
    const strip = this.bar()?.nativeElement.querySelector<HTMLElement>('[role="tablist"]');
    const tab = strip?.querySelectorAll<HTMLElement>('[role="tab"]')[this.index()];
    if (!strip || !tab) return;
    // The strip runs to the screen edges; a tab counts as shown inside the gutter.
    const pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
    const s = strip.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const start = s.left + pad;
    const end = s.right - pad;
    const by = t.left < start ? t.left - start : t.right > end ? t.right - end : 0;
    if (by) strip.scrollBy?.({ left: by, behavior: motionReduced() ? 'auto' : 'smooth' });
  }

  /**
   * Without `fill` the pager is as high as the page on screen: between two pages, the
   * higher one, so the page that comes in is not cut while it moves.
   */
  private fitHeight(): void {
    const el = this.pager()?.nativeElement;
    if (!el || this.fill() || !this.paged()) return;
    const pages = el.querySelectorAll<HTMLElement>('.tp__page');
    const pos = this.pagerPos() ?? this.index();
    const a = pages[Math.floor(pos)];
    const b = pages[Math.ceil(pos)];
    const h = Math.max(a?.offsetHeight ?? 0, b?.offsetHeight ?? 0);
    if (h) el.style.height = `${h}px`;
  }

  /** The pager position in pages: 1.5 is half way from the second page to the third. */
  private pagerPos(): number | null {
    const el = this.pager()?.nativeElement;
    return el?.clientWidth ? Math.abs(el.scrollLeft) / el.clientWidth : null;
  }
}
