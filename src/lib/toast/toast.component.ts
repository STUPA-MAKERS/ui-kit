import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import type { IconName } from '../icon/icons';
import { type Toast, ToastService } from './toast.service';

/** How far up (px) a swipe must move a phone toast before the toast closes. */
export const TOAST_SWIPE_CLOSE_PX = 40;

/** The icon of the tile of a toast by its variant, when the toast brings no icon. */
const TILE_ICON: Record<Toast['variant'], IconName> = {
  info: 'info',
  success: 'check',
  warning: 'alert',
  danger: 'alert',
};

/**
 * Toast-Container — einmal im Shell-Layout platziert.
 *
 * The stack is no live region: `ToastService` reads each toast out once through the
 * `Announcer` (spec 000517). A new toast closes and opens the stack popover to raise it,
 * and a screen reader can drop a message of a region that leaves the page and comes back.
 *
 * A dialog opens in the top layer, so the stack is in the top layer too, from the first
 * render on. A new toast raises the stack
 * above a dialog that opened after it, so a toast about a dialog shows above that dialog.
 * An empty stack has no size and takes no press.
 *
 * Every width shows a toast as a tinted glass card with a round tile, a centred message and
 * round icon buttons (specs 000565, 000566, 000568). A wide screen keeps the stack at the
 * bottom end with a close button. On a phone the stack sits at the top and shows only the
 * newest toast, which has no close button: a swipe up or its time closes it (specs 000562,
 * 000563, 000564).
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe, IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  private readonly stack = viewChild<ElementRef<HTMLElement>>('stack');

  /** The swipe in progress: the toast, the pointer and where it started. */
  private swipe: { readonly id: number; readonly pointer: number; readonly y: number } | null =
    null;

  /** The icon of the tile: the start icon of the toast, else the icon of its variant. */
  protected tileIcon(toast: Toast): IconName {
    return toast.icon && toast.iconPosition !== 'end' ? toast.icon : TILE_ICON[toast.variant];
  }

  /** A press on a phone toast starts a swipe. */
  protected swipeStart(event: PointerEvent, id: number): void {
    if (!this.toastService.phone()) return;
    this.swipe = { id, pointer: event.pointerId, y: event.clientY };
  }

  /** The toast follows the pointer upwards, never down. */
  protected swipeMove(event: PointerEvent, id: number): void {
    const swipe = this.swipe;
    if (!swipe || swipe.id !== id || swipe.pointer !== event.pointerId) return;
    const dy = Math.min(0, event.clientY - swipe.y);
    const el = event.currentTarget as HTMLElement;
    if (dy === 0) {
      this.reset(el);
      return;
    }
    el.style.setProperty('transform', `translateY(${dy}px)`);
    el.style.setProperty('opacity', String(Math.max(0.2, 1 + dy / 120)));
  }

  /** A swipe far enough up closes the toast; a shorter one lets it go back. */
  protected swipeEnd(event: PointerEvent, id: number): void {
    const swipe = this.swipe;
    if (!swipe || swipe.id !== id || swipe.pointer !== event.pointerId) return;
    this.swipe = null;
    if (swipe.y - event.clientY >= TOAST_SWIPE_CLOSE_PX) {
      this.toastService.dismiss(id);
      return;
    }
    this.reset(event.currentTarget as HTMLElement);
  }

  /** The browser took the pointer (a scroll, a system gesture): the toast goes back. */
  protected swipeCancel(event: PointerEvent): void {
    this.swipe = null;
    this.reset(event.currentTarget as HTMLElement);
  }

  private reset(el: HTMLElement): void {
    el.style.removeProperty('transform');
    el.style.removeProperty('opacity');
  }

  constructor() {
    afterRenderEffect(() => {
      const count = this.toastService.stackToasts().length;
      const el = this.stack()?.nativeElement as
        | (HTMLElement & { showPopover?: () => void; hidePopover?: () => void })
        | undefined;
      if (!el || typeof el.showPopover !== 'function' || typeof el.hidePopover !== 'function') return;
      let open = false;
      try {
        open = el.matches(':popover-open');
      } catch {
        // The engine does not know the selector (jsdom, old browsers).
      }
      if (open && count === 0) return;
      if (open) el.hidePopover();
      el.showPopover();
    });
  }
}
