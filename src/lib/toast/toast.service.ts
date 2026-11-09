import { Injectable, computed, inject, signal } from '@angular/core';
import { Announcer } from '../announce/announcer';
import { MEDIA } from '../breakpoints/breakpoints';
import { mediaQuery } from '../signals/media-query';
import type { IconName } from '../icon/icons';
import { withEntry } from '../util/immutable';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
  /** The label of the one action button (for example "Rückgängig"), else none. */
  readonly action?: string;
  /** Show the action as this icon; `action` is then its accessible name and its title. */
  readonly actionIcon?: IconName;
  /** Where the toast shows on a phone (see {@link ToastPhonePlacement}). */
  readonly phonePlacement?: ToastPhonePlacement;
  /** An icon before the message, or at the end of the row (see `iconPosition`). */
  readonly icon?: IconName;
  /** Where `icon` sits: `start` before the message (default), `end` at the end of the row. */
  readonly iconPosition?: ToastIconPosition;
  /** False hides the close button: the code that shows the toast also removes it. */
  readonly closable?: boolean;
  /** The colour of the phone top bar (see {@link ToastBarTone}). */
  readonly barTone?: ToastBarTone;
}

/** Where the icon of a toast sits. */
export type ToastIconPosition = 'start' | 'end';

/**
 * The colour of a toast in the phone top bar. `accent`: the accent colour (an offer, for
 * example the update of the app). `danger`: the danger colour (a fault, for example
 * offline). A danger bar sits above an accent bar.
 */
export type ToastBarTone = 'accent' | 'danger';

/** A toast that stays until the code that shows it removes it, for example a state. */
export interface ToastNotice {
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly icon?: IconName;
  /** Where `icon` sits. Default `start`. */
  readonly iconPosition?: ToastIconPosition;
  /** Show a close button. Default false. */
  readonly closable?: boolean;
  /** Where the notice shows on a phone. Default `stack`. */
  readonly phonePlacement?: ToastPhonePlacement;
  /** The colour of the phone top bar. Default `danger` for a `danger` notice, else `accent`. */
  readonly barTone?: ToastBarTone;
}

/**
 * Where a toast shows on a phone. `stack`: in the toast stack, as on every width. `top`: as
 * a full-width bar at the top of the frame (`app-toast-bar`), which moves the page down.
 * On a wider screen, and while no `app-toast-bar` is in the page, a `top` toast shows in
 * the stack.
 */
export type ToastPhonePlacement = 'stack' | 'top';

/** How a toast with an action closed. */
export type ToastClose = 'action' | 'timeout' | 'dismiss';

/** A toast with one action, for example the undo of a swipe. */
export interface ActionToast {
  readonly message: string;
  /** The visible label of the button. */
  readonly action: string;
  readonly variant?: ToastVariant;
  /** 0 keeps the toast until a press. */
  readonly timeout?: number;
  /**
   * Called once when the toast goes: `action` after a press of the button, `timeout`
   * when the time ran out, `dismiss` after the close button or `dismiss()`. A delete that
   * waits for its undo sends its request on anything but `action`.
   */
  readonly closed: (how: ToastClose) => void;
  /** Where the toast shows on a phone. Default `stack`. */
  readonly phonePlacement?: ToastPhonePlacement;
  /**
   * Show the action as this icon at the end of the row; `action` is then its accessible
   * name. In the phone top bar the whole bar is the action button.
   */
  readonly actionIcon?: IconName;
  /** False hides the close button, so only the action closes the toast. Default true. */
  readonly closable?: boolean;
}

let nextId = 0;

/** Globaler Toast-Hub. Komponenten rufen `show()`, der Container rendert. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Every toast is read out once, through the live regions of the page (spec 000517). */
  private readonly announcer = inject(Announcer);
  private readonly say = (message: string, variant: ToastVariant): void =>
    this.announcer.announce(message, variant === 'danger' ? 'assertive' : 'polite');
  private readonly _toasts = signal<Toast[]>([]);
  /** The close callbacks of the toasts with an action, by id. */
  private onClose: ReadonlyMap<number, (how: ToastClose) => void> = new Map();
  readonly toasts = this._toasts.asReadonly();

  private readonly topBars = signal(0);
  /** An `app-toast-bar` is in the page, so a phone shows the `top` toasts there. */
  readonly hasTopBar = computed(() => this.topBars() > 0);

  /** The viewport is a phone, the same query as the bottom bar of the shell. */
  readonly phone = mediaQuery(MEDIA.phone);

  private readonly inTopBar = (t: Toast): boolean =>
    t.phonePlacement === 'top' && this.phone() && this.hasTopBar();

  /**
   * The toasts of the top bar: the `top` toasts on a phone while a bar is in the page. The
   * danger bars (faults) come first, the accent bars (offers) after them.
   */
  readonly topBarToasts = computed(() => {
    const top = this._toasts().filter(this.inTopBar);
    const danger = (t: Toast): boolean => t.barTone === 'danger';
    return [...top.filter(danger), ...top.filter((t) => !danger(t))];
  });
  /**
   * The toasts of the stack: all others. A phone shows only the newest one (spec 000563):
   * a new toast replaces the visible one, and each toast was read out when it came.
   */
  readonly stackToasts = computed(() => {
    const stack = this._toasts().filter((t) => !this.inTopBar(t));
    return this.phone() ? stack.slice(-1) : stack;
  });

  /** Zeigt einen Toast; `timeout=0` deaktiviert das automatische Schließen. */
  show(message: string, variant: ToastVariant = 'info', timeout = 4000): number {
    const id = nextId++;
    this._toasts.update((list) => [...list, { id, message, variant }]);
    this.say(message, variant);
    if (timeout > 0) setTimeout(() => this.dismiss(id), timeout);
    return id;
  }

  /**
   * Shows a toast with one action button. The action closes the toast. The timeout is
   * longer than the default (6 s), because the reader has to find and press the button.
   */
  showAction(toast: ActionToast): number {
    const id = nextId++;
    const { message, action, actionIcon, closable, variant = 'info', timeout = 6000 } = toast;
    const { phonePlacement } = toast;
    this.onClose = withEntry(this.onClose, id, toast.closed);
    this._toasts.update((list) => [
      ...list,
      { id, message, variant, action, actionIcon, closable, phonePlacement },
    ]);
    this.say(action ? `${message} ${action}` : message, variant);
    if (timeout > 0) setTimeout(() => this.close(id, 'timeout'), timeout);
    return id;
  }

  /** The action button of a toast was pressed. */
  act(id: number): void {
    this.close(id, 'action');
  }

  success(message: string): number {
    return this.show(message, 'success');
  }
  error(message: string): number {
    return this.show(message, 'danger');
  }

  /**
   * Shows a notice that stays until `dismiss(id)`, for example "offline" while the
   * connection is gone. Without `closable` it has no close button.
   */
  showNotice(notice: ToastNotice): number {
    const id = nextId++;
    const { message, variant = 'info', icon, iconPosition, closable = false } = notice;
    const { phonePlacement } = notice;
    const barTone = notice.barTone ?? (variant === 'danger' ? 'danger' : 'accent');
    this._toasts.update((list) => [
      ...list,
      { id, message, variant, icon, iconPosition, closable, phonePlacement, barTone },
    ]);
    this.say(message, variant);
    return id;
  }

  /**
   * Called by `app-toast-bar` while it is in the page. Returns the function that removes it
   * again.
   */
  registerTopBar(): () => void {
    this.topBars.update((n) => n + 1);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.topBars.update((n) => n - 1);
    };
  }

  dismiss(id: number): void {
    this.close(id, 'dismiss');
  }

  private close(id: number, how: ToastClose): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
    const closed = this.onClose.get(id);
    this.onClose = new Map([...this.onClose].filter(([key]) => key !== id));
    closed?.(how);
  }
}
