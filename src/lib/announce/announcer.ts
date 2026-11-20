import { DOCUMENT, Injectable, inject } from '@angular/core';

/** `polite` waits for a pause of the screen reader; `assertive` interrupts it (a fault). */
export type AnnouncePoliteness = 'polite' | 'assertive';

/**
 * The pause between emptying a region and writing the message. A screen reader reads a
 * change of the text; the same text twice in a row is no change without the pause.
 */
export const ANNOUNCE_DELAY_MS = 100;

/**
 * Tell a screen reader about a change that it would not see: a toast, a save result, a
 * count of search results, a vote that opened over the WebSocket (spec 000517, 000518).
 *
 * Two live regions (`polite`, `assertive`) sit in the body from the first use on and stay
 * there. A screen reader only follows a region that was in the page before its text
 * changed, so a region that renders together with its message (a toast in a popover that
 * opens) is often not read. The regions are visually hidden and never take the focus.
 */
@Injectable({ providedIn: 'root' })
export class Announcer {
  private readonly doc = inject(DOCUMENT);
  private readonly regions = {
    polite: new LiveRegion(this.doc, 'polite'),
    assertive: new LiveRegion(this.doc, 'assertive'),
  } as const;

  constructor() {
    // Both regions go in at the first inject (the toast hub at the start of the app), so
    // they are in the page long before their first message.
    this.regions.polite.element();
    this.regions.assertive.element();
  }

  /** Read `message` out. An empty message does nothing. */
  announce(message: string, politeness: AnnouncePoliteness = 'polite'): void {
    const text = message.trim();
    if (text) this.regions[politeness].say(text);
  }

  /** Empty both regions, so a screen reader that browses the page does not find old text. */
  clear(): void {
    this.regions.polite.clear();
    this.regions.assertive.clear();
  }
}

/**
 * One live region and its pending message. A page that removed the element gets a new one
 * at the next message. A document without a body (a test or a server render) gets none.
 */
class LiveRegion {
  private el: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly doc: Document,
    private readonly politeness: AnnouncePoliteness,
  ) {}

  element(): HTMLElement | null {
    if (this.el?.isConnected) return this.el;
    if (!this.doc.body) return null;
    const el = this.doc.createElement('div');
    el.setAttribute('class', 'sr-only');
    el.setAttribute('aria-live', this.politeness);
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('data-announcer', this.politeness);
    this.doc.body.append(el);
    this.el = el;
    return el;
  }

  say(text: string): void {
    const el = this.element();
    if (!el) return;
    clearTimeout(this.timer);
    el.replaceChildren();
    this.timer = setTimeout(() => el.replaceChildren(text), ANNOUNCE_DELAY_MS);
  }

  clear(): void {
    clearTimeout(this.timer);
    this.el?.replaceChildren();
  }
}
