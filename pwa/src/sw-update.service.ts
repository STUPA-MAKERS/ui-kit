import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { ToastService, UI_KIT_INTL } from '@stupa-makers/ui-kit';
import {
  type Observable,
  Subscription,
  catchError,
  concatMap,
  defer,
  fromEvent,
  interval,
  merge,
  of,
  timer,
} from 'rxjs';

/** Reloads the page. A token, so that a test can replace the reload. */
export const PAGE_RELOAD = new InjectionToken<() => void>('PAGE_RELOAD', {
  providedIn: 'root',
  factory: pageReloadFactory,
});

/** The default `PAGE_RELOAD`: `document.location.reload()` of the injected document. */
export function pageReloadFactory(): () => void {
  const doc = inject(DOCUMENT);
  return () => doc.location.reload();
}

/** The time between two update checks. */
const CHECK_INTERVAL = 5 * 60 * 1000;
/** The wait before the first check, so the service worker can register. */
const FIRST_CHECK_DELAY = 1000;

/**
 * The update of the installed app. Call `init()` once at app start. The app registers the
 * service worker itself (`provideServiceWorker`). Without a service worker (dev mode, plain
 * HTTP, old browsers) `isEnabled` is false and nothing happens.
 *
 * - `VERSION_READY`: the new version is in the cache. The service shows a toast of the kit
 *   `ToastService` with the action "Reload" (`pwa.updateReady`, `pwa.reload` of
 *   `UI_KIT_INTL`). The toast stays until the person closes it. Only the action reloads:
 *   it activates the update and then reloads, so the reload loads the new version. The
 *   service never reloads without the consent of the person, because the page can hold
 *   unsaved work. It does not activate the update before that, because the old JS would
 *   then run against the new cache and miss a lazy chunk of the old build.
 * - `VERSION_INSTALLATION_FAILED`: the service ignores it. The next check tries again.
 * - `unrecoverable`: the cache of the running version is broken, so the page cannot load
 *   its lazy chunks. The service reloads the page at once.
 *
 * The service looks for updates 1 second after `init()`, every 5 minutes and when the
 * window gets the focus. A failed check (offline, a server error) is ignored, and each
 * check catches its own error, so one failure does not stop the checks.
 *
 * A second `init()` does nothing, so the events do not show two toasts. All subscriptions
 * and the timers end when the root injector is destroyed (for example between tests).
 */
@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly reloadPage = inject(PAGE_RELOAD);
  private readonly toast = inject(ToastService);
  private readonly intl = inject(UI_KIT_INTL);
  private readonly subscriptions = new Subscription();
  private started = false;
  /** The open update toast, so a second `VERSION_READY` does not show another one. */
  private toastOpen = false;

  private readonly _updateReady = signal(false);
  /** True when a new version is in the cache and a reload loads it. */
  readonly updateReady = this._updateReady.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.subscriptions.unsubscribe());
  }

  init(): void {
    if (this.started || !this.updates.isEnabled) return;
    this.started = true;

    this.subscriptions.add(this.updates.versionUpdates.subscribe((e) => this.onVersionEvent(e)));
    this.subscriptions.add(this.updates.unrecoverable.subscribe(() => this.reloadPage()));
    this.subscriptions.add(
      merge(
        timer(FIRST_CHECK_DELAY),
        timer(FIRST_CHECK_DELAY).pipe(concatMap(() => interval(CHECK_INTERVAL))),
        fromEvent(window, 'focus'),
      )
        .pipe(concatMap(() => this.safeCheck()))
        .subscribe(),
    );
  }

  /**
   * Activates a ready update and reloads the page, so the browser loads the new version. A
   * failed activation is ignored: the reload still runs.
   */
  async reload(): Promise<void> {
    if (this._updateReady()) {
      await this.updates.activateUpdate().catch(() => false);
    }
    this.reloadPage();
  }

  /** Other version events need no action. */
  private onVersionEvent(e: VersionEvent): void {
    if (e.type !== 'VERSION_READY') return;
    this._updateReady.set(true);
    if (this.toastOpen) return;
    this.toastOpen = true;
    this.toast.showAction({
      message: this.intl.translate('pwa.updateReady'),
      action: this.intl.translate('pwa.reload'),
      variant: 'info',
      timeout: 0,
      closed: (how) => {
        this.toastOpen = false;
        if (how === 'action') void this.reload();
      },
    });
  }

  /**
   * One update check that never errors. `defer` also catches a synchronous throw, and a
   * rejected check gives `false`, so the stream that runs the checks stays alive.
   */
  private safeCheck(): Observable<boolean> {
    return defer(() => this.updates.checkForUpdate()).pipe(catchError(() => of(false)));
  }
}
