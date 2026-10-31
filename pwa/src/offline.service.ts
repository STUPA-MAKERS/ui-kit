import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ToastService, UI_KIT_INTL } from '@stupa-makers/ui-kit';

/**
 * The connection state of the browser, and a notice while it is offline. Call `init()` once
 * at app start. It needs no service worker.
 *
 * `online` follows `navigator.onLine` and the `online` and `offline` events of the window.
 * Without a window (a server render) it stays true and no notice shows.
 *
 * While the browser is offline, `init()` keeps a notice open (`pwa.offline` of
 * `UI_KIT_INTL`, the icon `cloud-off` at the end of the row): on a phone a red bar at the
 * top of the frame (`app-toast-bar`), on a wider screen a toast in the stack. It has no action and no close
 * button, and it goes away by itself when the connection comes back. A second `init()` does
 * nothing, and the listeners end when the root injector is destroyed.
 */
@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly toast = inject(ToastService);
  private readonly intl = inject(UI_KIT_INTL);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _online = signal(this.window?.navigator.onLine ?? true);
  /** The browser has a network connection. */
  readonly online = this._online.asReadonly();

  private started = false;
  private noticeId: number | null = null;

  constructor() {
    const win = this.window;
    if (!win) return;
    const update = (): void => {
      this._online.set(win.navigator.onLine);
      this.sync();
    };
    win.addEventListener('online', update);
    win.addEventListener('offline', update);
    this.destroyRef.onDestroy(() => {
      win.removeEventListener('online', update);
      win.removeEventListener('offline', update);
    });
  }

  /** Shows the notice while the browser is offline. */
  init(): void {
    if (this.started) return;
    this.started = true;
    this.destroyRef.onDestroy(() => this.hide());
    this.sync();
  }

  private sync(): void {
    if (!this.started) return;
    if (this._online()) this.hide();
    else this.show();
  }

  private show(): void {
    if (this.noticeId !== null) return;
    this.noticeId = this.toast.showNotice({
      message: this.intl.translate('pwa.offline'),
      variant: 'danger',
      icon: 'cloud-off',
      iconPosition: 'end',
      phonePlacement: 'top',
    });
  }

  private hide(): void {
    if (this.noticeId === null) return;
    this.toast.dismiss(this.noticeId);
    this.noticeId = null;
  }
}
