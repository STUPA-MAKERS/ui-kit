import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { focusableIn, trapTab } from './focus-trap';

/**
 * The focus rules of a dialog for an element that is one only while it is rendered: a
 * popover with `role="dialog"` under an `@if` (spec 000513).
 *
 * - Open: the element renders, and right after the render the focus moves to its first
 *   control, or to the element itself when it has none (it gets `tabindex="-1"`).
 *   `appFocusDialogStart="self"` focuses the element itself, for a popover whose first
 *   control would scroll or announce too much. `"none"` leaves the open focus to the host,
 *   for a popover that has to be placed in the top layer before it can take the focus.
 * - Open: Tab and Shift+Tab stay inside (`trapTab`).
 * - Close: the element is destroyed, and the focus goes back to the element that had it
 *   before the open, if the focus is still inside or was lost to the body. A focus that
 *   the close moved on purpose (a click on another control) stays where it is.
 *
 * Escape stays with the host component, because only it knows how to close. The kit
 * dialog and the side sheet have these rules built in and do not need this directive.
 */
@Directive({
  selector: '[appFocusDialog]',
  standalone: true,
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class FocusDialogDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Where the focus goes on open: the first control (default), the element itself or nowhere. */
  readonly start = input<'first' | 'self' | 'none'>('first', { alias: 'appFocusDialogStart' });

  /** The element that had the focus before the open. */
  private readonly opener: HTMLElement | null;

  constructor() {
    const doc = this.el.ownerDocument;
    const active = doc.activeElement;
    this.opener = active instanceof HTMLElement && active !== doc.body ? active : null;
    afterNextRender(() => this.focusStart());
    inject(DestroyRef).onDestroy(() => this.restore());
  }

  /** Tab and Shift+Tab stay inside the element. */
  onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    trapTab(event, this.el, { outsideWraps: true });
  }

  private focusStart(): void {
    const doc = this.el.ownerDocument;
    if (this.start() === 'none' || this.el.contains(doc.activeElement)) return;
    const first = this.start() === 'first' ? focusableIn(this.el)[0] : undefined;
    if (first) {
      first.focus({ preventScroll: true });
      return;
    }
    if (!this.el.hasAttribute('tabindex')) this.el.setAttribute('tabindex', '-1');
    this.el.focus({ preventScroll: true });
  }

  private restore(): void {
    const doc = this.el.ownerDocument;
    const active = doc.activeElement;
    const lost = !active || active === doc.body || this.el.contains(active);
    if (lost && this.opener?.isConnected) this.opener.focus({ preventScroll: true });
  }
}
