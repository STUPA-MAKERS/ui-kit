import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  /** The label of the one action button (for example "Rückgängig"), else none. */
  action?: string;
}

/** How a toast with an action closed. */
export type ToastClose = 'action' | 'timeout' | 'dismiss';

/** A toast with one action, for example the undo of a swipe. */
export interface ActionToast {
  message: string;
  /** The visible label of the button. */
  action: string;
  variant?: ToastVariant;
  /** 0 keeps the toast until a press. */
  timeout?: number;
  /**
   * Called once when the toast goes: `action` after a press of the button, `timeout`
   * when the time ran out, `dismiss` after the close button or `dismiss()`. A delete that
   * waits for its undo sends its request on anything but `action`.
   */
  closed: (how: ToastClose) => void;
}

let nextId = 0;

/** Globaler Toast-Hub. Komponenten rufen `show()`, der Container rendert. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  /** The close callbacks of the toasts with an action, by id. */
  private readonly onClose = new Map<number, (how: ToastClose) => void>();
  readonly toasts = this._toasts.asReadonly();

  /** Zeigt einen Toast; `timeout=0` deaktiviert das automatische Schließen. */
  show(message: string, variant: ToastVariant = 'info', timeout = 4000): number {
    const id = nextId++;
    this._toasts.update((list) => [...list, { id, message, variant }]);
    if (timeout > 0) setTimeout(() => this.dismiss(id), timeout);
    return id;
  }

  /**
   * Shows a toast with one action button. The action closes the toast. The timeout is
   * longer than the default (6 s), because the reader has to find and press the button.
   */
  showAction(toast: ActionToast): number {
    const id = nextId++;
    const { message, action, variant = 'info', timeout = 6000 } = toast;
    this.onClose.set(id, toast.closed);
    this._toasts.update((list) => [...list, { id, message, variant, action }]);
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

  dismiss(id: number): void {
    this.close(id, 'dismiss');
  }

  private close(id: number, how: ToastClose): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
    const closed = this.onClose.get(id);
    this.onClose.delete(id);
    closed?.(how);
  }
}
