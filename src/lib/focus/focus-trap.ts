/**
 * The elements that take the focus with the Tab key. A control with `tabindex="-1"` (an
 * option of a roving list, for example) is not a Tab stop, so it is not in the cycle: a
 * trap that counts it as the last element lets the Tab from the real last stop leave.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(',');

/** The elements in `root` that take the focus with the Tab key, in document order. */
export function focusableIn(root: ParentNode, selector = FOCUSABLE_SELECTOR): readonly HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

export interface TrapTabOptions {
  /** The elements in the cycle. Default: `focusableIn(root)`. */
  readonly items?: readonly HTMLElement[];
  /**
   * A Tab from an element outside `items` (the root itself after the open, for example)
   * wraps like one from an edge. Default: only the root counts, and only for Shift+Tab.
   */
  readonly outsideWraps?: boolean;
  /** With no element in the cycle, the root takes the focus. Default true. */
  readonly focusRootWhenEmpty?: boolean;
}

/**
 * Keep the Tab key inside `root` (a dialog, a sheet): Tab on the last element goes to the
 * first one, Shift+Tab on the first one goes to the last one. Call it from the keydown
 * handler of the root; it ignores every other key.
 */
export function trapTab(event: KeyboardEvent, root: HTMLElement, options: TrapTabOptions = {}): void {
  if (event.key !== 'Tab') return;
  const items = options.items ?? focusableIn(root);
  if (items.length === 0) {
    event.preventDefault();
    if (options.focusRootWhenEmpty ?? true) root.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = root.ownerDocument.activeElement as HTMLElement | null;
  const outside = options.outsideWraps === true && (!active || !items.includes(active));
  if (event.shiftKey && (outside || active === first || active === root)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (outside || active === last)) {
    event.preventDefault();
    first.focus();
  }
}

/** The open locks of a document and the overflow of its root before the first of them. */
const locks = new WeakMap<Document, { count: number; before: string }>();

/**
 * Stop the page behind an overlay from scrolling: `overflow: hidden` on the root element. The
 * returned function releases this lock; a second call does nothing.
 *
 * The locks of a document are counted. The first lock keeps the old value of the root, and
 * only the release of the last lock gives it back, in whatever order the overlays close. A
 * lock that restored its own old value broke the scroll of the whole page: a sheet that
 * closed after the dialog it opened gave the root back the `hidden` of the dialog, and
 * nothing released it again until a reload.
 *
 * The lock sits on the root and not on the body, because the root always passes its overflow
 * to the viewport. The phone sets `overflow-x: clip` on the root, and then the root no longer
 * passes the value of the body on: `hidden` on the body makes the body a scroll container, a
 * sticky page head sticks to the body, which does not scroll, and the head leaves the screen
 * while a sheet is open (spec 000531).
 */
export function lockBodyScroll(doc: Document = document): () => void {
  const root = doc.documentElement;
  const held = locks.get(doc) ?? { count: 0, before: root.style.overflow };
  held.count += 1;
  locks.set(doc, held);
  root.style.overflow = 'hidden';
  let locked = true;
  return () => {
    if (!locked) return;
    locked = false;
    held.count -= 1;
    if (held.count > 0) return;
    locks.delete(doc);
    root.style.overflow = held.before;
  };
}
