import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@stupa-makers/ui-kit';
import { OfflineService } from './offline.service';

/** A window whose `navigator.onLine` the test sets, with real event listeners. */
class FakeWindow extends EventTarget {
  readonly navigator = { onLine: true };

  go(online: boolean): void {
    this.navigator.onLine = online;
    this.dispatchEvent(new Event(online ? 'online' : 'offline'));
  }
}

describe('OfflineService', () => {
  let win: FakeWindow;

  function setup(online = true): { svc: OfflineService; toast: ToastService } {
    win = new FakeWindow();
    win.navigator.onLine = online;
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: win } }],
    });
    return { svc: TestBed.inject(OfflineService), toast: TestBed.inject(ToastService) };
  }

  it('follows navigator.onLine and the online and offline events', () => {
    const { svc } = setup(false);
    expect(svc.online()).toBe(false);
    win.go(true);
    expect(svc.online()).toBe(true);
    win.go(false);
    expect(svc.online()).toBe(false);
  });

  it('shows no notice before init()', () => {
    const { toast } = setup(false);
    expect(toast.toasts()).toHaveLength(0);
  });

  it('shows the notice while offline and removes it when the connection comes back', () => {
    const { svc, toast } = setup();
    svc.init();
    expect(toast.toasts()).toHaveLength(0);
    win.go(false);
    expect(toast.toasts()).toEqual([
      expect.objectContaining({
        message: 'Keine Verbindung',
        variant: 'danger',
        icon: 'cloud-off',
        closable: false,
        phonePlacement: 'top',
        barTone: 'danger',
      }),
    ]);
    expect(toast.toasts()[0].action).toBeUndefined();
    win.go(false);
    expect(toast.toasts()).toHaveLength(1);
    win.go(true);
    expect(toast.toasts()).toHaveLength(0);
  });

  it('shows the notice at init() when the browser is already offline, and starts once', () => {
    const { svc, toast } = setup(false);
    svc.init();
    svc.init();
    expect(toast.toasts()).toHaveLength(1);
  });

  it('removes the notice and stops listening when the injector goes', () => {
    const { svc, toast } = setup(false);
    svc.init();
    TestBed.resetTestingModule();
    expect(toast.toasts()).toHaveLength(0);
    win.go(true);
    expect(svc.online()).toBe(false);
  });

  it('stays online without a window', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });
    const svc = TestBed.inject(OfflineService);
    svc.init();
    expect(svc.online()).toBe(true);
    expect(TestBed.inject(ToastService).toasts()).toHaveLength(0);
  });
});
