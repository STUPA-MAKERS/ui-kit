/** The space between a revealed control and the bar that covered it, in px. */
export const FOCUS_REVEAL_GAP = 8;

/**
 * Keeps the keyboard focus out from under the sticky and fixed bars (WCAG 2.4.11): the
 * header, the bottom bar, a FAB, the sticky head of a list or a sheet.
 *
 * The browser scrolls a focused control into its scroll area, but it does not know which
 * bars stand over that area, and the bars differ from page to page. So after each keyboard
 * focus (`:focus-visible`) this looks at the top and the bottom edge of the control. Where
 * an element with `position: fixed` or `sticky` that does not hold the control covers an
 * edge, it scrolls the nearest scroll area of the control by the covered height and
 * {@link FOCUS_REVEAL_GAP}. Like this the scroll padding of every scroll area is the
 * height of the bars that stand over it, without a value per page.
 *
 * A focus from a pointer is left alone: the person pointed at a control they see.
 *
 * Returns the function that stops it.
 */
export function watchFocusReveal(doc: Document): () => void {
  const onFocus = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const view = doc.defaultView;
    // The browser scrolls the control into view first; look after that.
    view?.requestAnimationFrame(() => revealFocus(doc, target));
  };
  doc.addEventListener('focusin', onFocus);
  return () => doc.removeEventListener('focusin', onFocus);
}

/** Scrolls `target` out from under a bar, if it has the keyboard focus. Exported for tests. */
export function revealFocus(doc: Document, target: HTMLElement): void {
  if (doc.activeElement !== target || !matchesFocusVisible(target)) return;
  const view = doc.defaultView;
  if (!view) return;
  const rect = target.getBoundingClientRect();
  if (rect.height === 0 || rect.bottom < 0 || rect.top > view.innerHeight) return;
  const x = Math.min(Math.max(rect.left + rect.width / 2, 0), view.innerWidth - 1);
  const bars = [rect.top + 1, rect.bottom - 1].flatMap((y) => coveringBar(doc, target, x, y) ?? []);
  const delta = bars.reduce((sum, bar) => sum || shift(bar, rect, view.innerHeight), 0);
  if (delta !== 0) scrollAreaOf(target, view).scrollBy({ top: delta });
}

/**
 * How far the scroll area moves so that `bar` no longer covers `rect`: a bar in the upper
 * half of the window stands at the top, a bar in the lower half at the bottom.
 */
function shift(bar: HTMLElement, rect: DOMRect, height: number): number {
  const box = bar.getBoundingClientRect();
  if (box.top + box.height / 2 < height / 2) {
    const covered = box.bottom - rect.top;
    return covered > 0 ? -(covered + FOCUS_REVEAL_GAP) : 0;
  }
  const covered = rect.bottom - box.top;
  return covered > 0 ? covered + FOCUS_REVEAL_GAP : 0;
}

function matchesFocusVisible(el: HTMLElement): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** The fixed or sticky element at the point that stands over `target`, or null. */
function coveringBar(doc: Document, target: HTMLElement, x: number, y: number): HTMLElement | null {
  const hit = doc.elementFromPoint(x, y);
  if (!(hit instanceof HTMLElement) || target.contains(hit) || hit.contains(target)) return null;
  const bar = pinnedAncestor(hit);
  return bar && !bar.contains(target) ? bar : null;
}

/** The element itself or its nearest ancestor with `position: fixed` or `sticky`. */
function pinnedAncestor(el: HTMLElement | null): HTMLElement | null {
  if (!el || el === el.ownerDocument.body) return null;
  const position = getComputedStyle(el).position;
  return position === 'fixed' || position === 'sticky' ? el : pinnedAncestor(el.parentElement);
}

/** The nearest ancestor that scrolls vertically, else the window. */
function scrollAreaOf(el: HTMLElement, view: Window): Pick<Window, 'scrollBy'> {
  const parent = el.parentElement;
  if (!parent || parent === el.ownerDocument.body) return view;
  const overflow = getComputedStyle(parent).overflowY;
  const scrolls =
    (overflow === 'auto' || overflow === 'scroll') && parent.scrollHeight > parent.clientHeight;
  return scrolls ? parent : scrollAreaOf(parent, view);
}
