import { DestroyRef, inject } from '@angular/core';

/** What {@link watchAnchoredPopover} needs to know about one popover. */
export interface AnchoredPopoverWatch {
  /** The popover is open (on a wide screen: the phone sheet has its own scrim). */
  isOpen: () => boolean;
  /**
   * The elements where a press does not close the popover: the host that holds anchor
   * and popover, or the popover and its anchor.
   */
  inside: () => readonly (Element | null | undefined)[];
  /** The scroll box of the popover itself: a scroll in it does not move the anchor. */
  ownScroll?: () => Element | null | undefined;
  /** A press outside. */
  close: () => void;
  /** The page scrolled or resized: place the popover at its anchor again. */
  follow: () => void;
}

function contains(root: Element | null | undefined, target: EventTarget | null): boolean {
  return !!root && target instanceof Node && root.contains(target);
}

/**
 * The listeners of a popover at an anchor: a press outside closes it, and a scroll (of
 * any box, in the capture phase) or a resize places it again. Call it in an injection
 * context; the listeners go away with the caller.
 */
export function watchAnchoredPopover(watch: AnchoredPopoverWatch): void {
  const onPointer = (e: Event): void => {
    if (!watch.isOpen()) return;
    if (watch.inside().some((el) => contains(el, e.target))) return;
    watch.close();
  };
  const onViewport = (e: Event): void => {
    if (!watch.isOpen()) return;
    if (watch.ownScroll && contains(watch.ownScroll(), e.target)) return;
    watch.follow();
  };
  document.addEventListener('pointerdown', onPointer, true);
  window.addEventListener('scroll', onViewport, true);
  window.addEventListener('resize', onViewport);
  inject(DestroyRef).onDestroy(() => {
    document.removeEventListener('pointerdown', onPointer, true);
    window.removeEventListener('scroll', onViewport, true);
    window.removeEventListener('resize', onViewport);
  });
}

/**
 * Put a popover element (`popover="manual"`) into the top layer, so no dialog, sheet or
 * scroll box clips it. It does nothing without the popover API, and for an element that
 * is open already (a second `showPopover` throws).
 */
export function showInTopLayer(el: HTMLElement | null | undefined): void {
  const pop = el as (HTMLElement & { showPopover?: () => void }) | null | undefined;
  if (!pop || typeof pop.showPopover !== 'function') return;
  try {
    if (pop.matches(':popover-open')) return;
  } catch {
    // The engine does not know the selector (jsdom, old browsers).
  }
  pop.showPopover();
}

/** The anchor has left the viewport above or below: its popover closes. */
export function anchorOutOfView(anchor: DOMRect): boolean {
  return anchor.bottom < 0 || anchor.top > window.innerHeight;
}

/** The place of a fixed popover, in viewport pixels. */
export interface PopoverPlace {
  top: number;
  left: number;
}

export interface PlaceBelowOptions {
  /** Space between the anchor and the popover. */
  gap: number;
  /** Least space between the popover and the viewport edge. Default 8. */
  edge?: number;
  /** Align the popover with the start (default) or the end edge of the anchor. */
  align?: 'start' | 'end';
}

/**
 * Under the anchor, inside the viewport: moved in from the right edge, and above the
 * anchor when it does not fit below and fits above. `box` is the rendered size of the
 * popover; give 0 by 0 for the first place before it renders.
 */
export function placeBelow(
  anchor: DOMRect,
  box: { width: number; height: number },
  options: PlaceBelowOptions,
): PopoverPlace {
  const { gap } = options;
  const edge = options.edge ?? 8;
  const start = options.align === 'end' ? anchor.right - box.width : anchor.left;
  const left = Math.min(Math.max(edge, start), Math.max(edge, window.innerWidth - edge - box.width));
  let top = anchor.bottom + gap;
  const above = anchor.top - gap - box.height;
  if (top + box.height > window.innerHeight - edge && above >= edge) top = above;
  return { top, left };
}
