/** The elements that take the focus with the Tab key. */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** The elements in `root` that take the focus with the Tab key, in document order. */
export function focusableIn(root: ParentNode, selector = FOCUSABLE_SELECTOR): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

export interface TrapTabOptions {
  /** The elements in the cycle. Default: `focusableIn(root)`. */
  items?: HTMLElement[];
  /**
   * A Tab from an element outside `items` (the root itself after the open, for example)
   * wraps like one from an edge. Default: only the root counts, and only for Shift+Tab.
   */
  outsideWraps?: boolean;
  /** With no element in the cycle, the root takes the focus. Default true. */
  focusRootWhenEmpty?: boolean;
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

/**
 * Stop the page behind an overlay from scrolling: `overflow: hidden` on the body. The
 * returned function gives the body its old value back; a second call does nothing.
 */
export function lockBodyScroll(doc: Document = document): () => void {
  const body = doc.body;
  const before = body.style.overflow;
  body.style.overflow = 'hidden';
  let locked = true;
  return () => {
    if (!locked) return;
    locked = false;
    body.style.overflow = before;
  };
}
