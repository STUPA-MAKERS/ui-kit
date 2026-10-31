import { DOCUMENT } from '@angular/common';
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, type UnrecoverableStateEvent, type VersionEvent } from '@angular/service-worker';
import { ToastService } from '@stupa-makers/ui-kit';
import { Subject } from 'rxjs';
import { PAGE_RELOAD, SwUpdateService, pageReloadFactory } from './sw-update.service';

const FIVE_MINUTES = 5 * 60 * 1000;

/** Controllable SwUpdate stub: tests push version events and control the update check. */
class FakeSwUpdate {
  isEnabled = true;
  readonly versionUpdates = new Subject<VersionEvent>();
  readonly unrecoverable = new Subject<UnrecoverableStateEvent>();
  activateUpdate = jest.fn(() => Promise.resolve(true));
  checkForUpdate = jest.fn(async () => false);
}

describe('SwUpdateService', () => {
  let svc: SwUpdateService;
  let sw: FakeSwUpdate;
  let reload: jest.Mock;
  let toast: ToastService;

  function configure(enabled: boolean): void {
    sw = new FakeSwUpdate();
    sw.isEnabled = enabled;
    reload = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: sw },
        { provide: PAGE_RELOAD, useValue: reload },
      ],
    });
    svc = TestBed.inject(SwUpdateService);
    toast = TestBed.inject(ToastService);
  }

  const ready = { type: 'VERSION_READY' } as VersionEvent;

  /** Let the promise of a check settle, so concatMap takes the next tick. */
  async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when the service worker is not enabled', () => {
    configure(false);
    const subscribeSpy = jest.spyOn(sw.versionUpdates, 'subscribe');
    const unrecoverableSpy = jest.spyOn(sw.unrecoverable, 'subscribe');
    svc.init();
    jest.advanceTimersByTime(FIVE_MINUTES + 1000);
    expect(subscribeSpy).not.toHaveBeenCalled();
    expect(unrecoverableSpy).not.toHaveBeenCalled();
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    sw.versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
    expect(svc.updateReady()).toBe(false);
  });

  /** Activation without a reload lets the old JS run against the new cache. */
  it('marks the update as ready on VERSION_READY and does not activate it', () => {
    configure(true);
    svc.init();
    expect(svc.updateReady()).toBe(false);

    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);

    expect(svc.updateReady()).toBe(true);
    expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('shows a notice that stays, with the reload icon as its action and no close button', () => {
    configure(true);
    svc.init();
    sw.versionUpdates.next(ready);
    expect(toast.toasts()).toEqual([
      expect.objectContaining({
        message: 'Eine neue Version der App ist bereit.',
        action: 'Neu laden',
        actionIcon: 'reload',
        closable: false,
        variant: 'info',
        phonePlacement: 'top',
      }),
    ]);
    jest.advanceTimersByTime(60 * 60 * 1000);
    expect(toast.toasts()).toHaveLength(1);
  });

  it('activates the update and reloads only after the action', async () => {
    configure(true);
    svc.init();
    sw.versionUpdates.next(ready);
    toast.act(toast.toasts()[0].id);
    await flushPromises();
    expect(sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when the notice goes without its action', async () => {
    configure(true);
    svc.init();
    sw.versionUpdates.next(ready);
    toast.dismiss(toast.toasts()[0].id);
    await flushPromises();
    expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('shows one toast for a repeated VERSION_READY, and a new one after a close', () => {
    configure(true);
    svc.init();
    sw.versionUpdates.next(ready);
    sw.versionUpdates.next(ready);
    expect(toast.toasts()).toHaveLength(1);
    toast.dismiss(toast.toasts()[0].id);
    sw.versionUpdates.next(ready);
    expect(toast.toasts()).toHaveLength(1);
  });

  it('starts once, however often init() runs', async () => {
    configure(true);
    svc.init();
    svc.init();
    sw.versionUpdates.next(ready);
    expect(toast.toasts()).toHaveLength(1);
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'x' });
    expect(reload).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    await flushPromises();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('ends every subscription and timer when the injector goes', async () => {
    configure(true);
    svc.init();
    TestBed.resetTestingModule();
    jest.advanceTimersByTime(FIVE_MINUTES * 2);
    window.dispatchEvent(new Event('focus'));
    await flushPromises();
    sw.versionUpdates.next(ready);
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'x' });
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  /** The polling continues after a failed installation. */
  it('ignores VERSION_DETECTED, NO_NEW_VERSION_DETECTED and VERSION_INSTALLATION_FAILED', async () => {
    configure(true);
    svc.init();
    sw.versionUpdates.next({ type: 'VERSION_DETECTED' } as VersionEvent);
    sw.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED' } as VersionEvent);
    sw.versionUpdates.next({
      type: 'VERSION_INSTALLATION_FAILED',
      error: 'download failed',
    } as VersionEvent);
    expect(svc.updateReady()).toBe(false);
    expect(reload).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await flushPromises();
    jest.advanceTimersByTime(FIVE_MINUTES);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('reloads the page at once when the state is unrecoverable', () => {
    configure(true);
    svc.init();
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing chunk' });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reload() without a ready update reloads and does not activate', async () => {
    configure(true);
    await svc.reload();
    expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reload() with a ready update activates it first, then reloads', async () => {
    configure(true);
    const order: string[] = [];
    sw.activateUpdate.mockImplementation(async () => {
      order.push('activate');
      return true;
    });
    reload.mockImplementation(() => order.push('reload'));
    svc.init();
    sw.versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
    await svc.reload();
    expect(order).toEqual(['activate', 'reload']);
  });

  it('reload() still reloads when the activation rejects', async () => {
    configure(true);
    sw.activateUpdate.mockRejectedValue(new Error('activation failed'));
    svc.init();
    sw.versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
    await svc.reload();
    expect(sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('checks for updates after a delay to allow SW registration', () => {
    configure(true);
    svc.init();
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('polls every five minutes after the initial check', async () => {
    configure(true);
    svc.init();
    jest.advanceTimersByTime(1000);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(FIVE_MINUTES);
    await flushPromises();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(FIVE_MINUTES);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(3);
  });

  /** One initial check and three polls run, and every rejection is ignored. */
  it('keeps polling after a rejected check (offline)', async () => {
    configure(true);
    sw.checkForUpdate.mockRejectedValue(new Error('offline'));
    svc.init();
    jest.advanceTimersByTime(1000);
    await flushPromises();

    jest.advanceTimersByTime(FIVE_MINUTES);
    await flushPromises();
    jest.advanceTimersByTime(FIVE_MINUTES);
    await flushPromises();
    jest.advanceTimersByTime(FIVE_MINUTES);
    await flushPromises();

    expect(sw.checkForUpdate).toHaveBeenCalledTimes(4);
  });

  it('keeps polling after a check that throws synchronously', async () => {
    configure(true);
    sw.checkForUpdate.mockImplementation(() => {
      throw new Error('no service worker');
    });
    svc.init();
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(FIVE_MINUTES);
    await flushPromises();
    jest.advanceTimersByTime(FIVE_MINUTES);
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(3);
  });

  it('checks on window focus and keeps listening after a rejected check', async () => {
    configure(true);
    sw.checkForUpdate.mockRejectedValue(new Error('offline'));
    svc.init();
    jest.advanceTimersByTime(1000);
    await flushPromises();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('focus'));
    await flushPromises();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event('focus'));
    await flushPromises();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(3);
  });
});

describe('pageReloadFactory', () => {
  it('reloads the location of the injected document', () => {
    const fakeReload = jest.fn();
    const injector = Injector.create({
      providers: [{ provide: DOCUMENT, useValue: { location: { reload: fakeReload } } }],
    });
    const reload = runInInjectionContext(injector, pageReloadFactory);
    expect(fakeReload).not.toHaveBeenCalled();
    reload();
    expect(fakeReload).toHaveBeenCalledTimes(1);
  });
});
