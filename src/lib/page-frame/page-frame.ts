import { Injectable, signal } from '@angular/core';

/**
 * What the page tells the frame around it (`app-shell`).
 *
 * `fill`: the page fills the viewport and scrolls only inside its own panes (a list and a
 * detail side by side). The frame then leaves the footer out and keeps only a small gap at
 * the bottom, so the page itself does not scroll. The page sets it and must clear it when
 * it goes away; `injectListDetailPage` of `@stupa-makers/ui-kit/shell` does both.
 */
@Injectable({ providedIn: 'root' })
export class PageFrame {
  readonly fill = signal(false);
}
