import { Directive, ElementRef, effect, inject, input, output } from '@angular/core';

/**
 * The sentinel at the end of a list that loads the next page: when the element comes
 * near the visible area, `scrolledToEnd` fires.
 *
 * `<div appInfiniteScroll (scrolledToEnd)="loadMore()" aria-hidden="true"></div>`
 *
 * `scrollRoot` is the box that scrolls, when the list scrolls inside its own box; null
 * (the default) is the viewport. `scrollMargin` loads ahead of the end (default 400px).
 * Without `IntersectionObserver` (a test, an old browser) nothing fires, so keep a
 * "Mehr laden" button beside the sentinel. The observer follows a change of the root and
 * stops with the element.
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective {
  readonly scrollRoot = input<Element | null>(null);
  readonly scrollMargin = input('400px');
  readonly scrolledToEnd = output<void>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    effect((onCleanup) => {
      const root = this.scrollRoot();
      const rootMargin = this.scrollMargin();
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.scrolledToEnd.emit();
        },
        { root, rootMargin },
      );
      observer.observe(el);
      onCleanup(() => observer.disconnect());
    });
  }
}
