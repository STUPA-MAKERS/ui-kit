import { Injectable, computed, inject, signal } from '@angular/core';
import { Announcer } from '../announce/announcer';
import { MEDIA } from '../breakpoints/breakpoints';
import { mediaQuery } from '../signals/media-query';
import type { IconName } from '../icon/icons';
import type { Action } from '../screen/screen.types';
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

/**
 * Where a toast shows on a phone. `stack`: in the toast stack, as on every width. `top`: as
 * a full-width bar at the top of the frame (`app-toast-bar`), which moves the page down.
 * On a wider screen, and while no `app-toast-bar` is in the page, a `top` toast shows in
 * the stack.
 */
export type ToastPhonePlacement = 'stack' | 'top';

/** How a toast with an action closed. */
export type ToastClose = 'action' | 'timeout' | 'dismiss';

/** The kind of a toast: its colour and the icon of its tile. */
export type ToastKind = 'info' | 'success' | 'warning' | 'error';

/** A toast: the one call `ToastService.show(options)` (002253). */
export interface ToastOptions {
  readonly text: string;
  /** Default `info`. */
  readonly kind?: ToastKind;
  /** One button; a press closes the toast and calls `closed('action')`. Its icon replaces the label. */
  readonly action?: Action;
  /**
   * True keeps the toast until a press, its close button or `dismiss(id)`. Default: it goes
   * after 4 s, or after 6 s with an action, because the reader has to find the button.
   */
  readonly sticky?: boolean;
  /** How the toast went (see {@link ToastClose}). */
  readonly closed?: (how: ToastClose) => void;
  /** An icon before the message, or at the end of the row (`iconPosition`). */
  readonly icon?: IconName;
  readonly iconPosition?: ToastIconPosition;
  /** `top`: on a phone a full-width bar at the top of the frame (see {@link ToastPhonePlacement}). */
  readonly placement?: ToastPhonePlacement;
  /** False hides the close button: the code that shows the toast also removes it. Default true. */
  readonly closable?: boolean;
}

const VARIANT: Readonly<Record<ToastKind, ToastVariant>> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger',
};

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

  /**
   * Shows a toast and returns its id for `dismiss(id)` (002253). `show(text, kind?)` is the
   * short form of `show({ text, kind })`.
   */
  show(o: ToastOptions): number;
  show(text: string, kind?: ToastKind): number;
  show(arg: ToastOptions | string, kind?: ToastKind): number {
    const o: ToastOptions = typeof arg === 'string' ? { text: arg, kind } : arg;
    const id = nextId++;
    const variant = VARIANT[o.kind ?? 'info'];
    const action = o.action;
    const timeout = o.sticky ? 0 : action ? 6000 : 4000;
    const closable = o.closable ?? true;
    const barTone: ToastBarTone = variant === 'danger' ? 'danger' : 'accent';
    if (o.closed) this.onClose = withEntry(this.onClose, id, o.closed);
    this._toasts.update((list) => [
      ...list,
      {
        id,
        message: o.text,
        variant,
        action: action?.label,
        actionIcon: action?.icon,
        icon: o.icon,
        iconPosition: o.iconPosition,
        closable,
        phonePlacement: o.placement,
        barTone,
      },
    ]);
    this.say(action ? `${o.text} ${action.label}` : o.text, variant);
    if (timeout > 0) setTimeout(() => this.close(id, 'timeout'), timeout);
    return id;
  }

  /** The action button of a toast was pressed. */
  act(id: number): void {
    this.close(id, 'action');
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
