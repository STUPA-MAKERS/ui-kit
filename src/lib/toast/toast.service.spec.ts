import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let svc: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ToastService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with no toasts', () => {
    expect(svc.toasts()).toEqual([]);
  });

  it('show() appends a toast with a unique id and returns it; default variant is info', () => {
    jest.useFakeTimers();
    const id1 = svc.show('Erste');
    const id2 = svc.show('Zweite');
    expect(id1).not.toBe(id2);
    const list = svc.toasts();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ id: id1, message: 'Erste', variant: 'info' });
    expect(list[1]).toMatchObject({ id: id2, message: 'Zweite', variant: 'info' });
  });

  it('auto-dismisses after the default timeout (4000ms)', () => {
    jest.useFakeTimers();
    svc.show('Verschwindet');
    expect(svc.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(3999);
    expect(svc.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(svc.toasts()).toHaveLength(0);
  });

  it('respects a custom timeout', () => {
    jest.useFakeTimers();
    svc.show('x', 'info', 1000);
    jest.advanceTimersByTime(1000);
    expect(svc.toasts()).toHaveLength(0);
  });

  it('does NOT auto-dismiss when timeout is 0', () => {
    jest.useFakeTimers();
    svc.show('Bleibt', 'warning', 0);
    jest.advanceTimersByTime(100000);
    expect(svc.toasts()).toHaveLength(1);
    expect(svc.toasts()[0].variant).toBe('warning');
  });

  it('success() pushes a success toast', () => {
    jest.useFakeTimers();
    svc.success('Gespeichert');
    expect(svc.toasts()[0]).toMatchObject({ message: 'Gespeichert', variant: 'success' });
  });

  it('error() pushes a danger toast', () => {
    jest.useFakeTimers();
    svc.error('Fehlgeschlagen');
    expect(svc.toasts()[0]).toMatchObject({ message: 'Fehlgeschlagen', variant: 'danger' });
  });

  it('dismiss() removes only the matching toast', () => {
    const a = svc.show('A', 'info', 0);
    const b = svc.show('B', 'info', 0);
    svc.dismiss(a);
    const list = svc.toasts();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b);
  });

  it('dismiss() with an unknown id is a no-op', () => {
    svc.show('A', 'info', 0);
    svc.dismiss(-9999);
    expect(svc.toasts()).toHaveLength(1);
  });

  it('exposes a read-only toasts signal (no set method)', () => {
    expect((svc.toasts as unknown as { set?: unknown }).set).toBeUndefined();
  });

  describe('showAction()', () => {
    it('shows the action and reports a press once, also when the time runs out later', () => {
      jest.useFakeTimers();
      const closed = jest.fn();
      const id = svc.showAction({ message: 'Archiviert', action: 'Rückgängig', closed });
      expect(svc.toasts()[0]).toMatchObject({ id, message: 'Archiviert', action: 'Rückgängig', variant: 'info' });
      svc.act(id);
      expect(svc.toasts()).toEqual([]);
      jest.advanceTimersByTime(6000);
      expect(closed.mock.calls).toEqual([['action']]);
    });

    it('reports the timeout after 6 s by default, and a dismiss', () => {
      jest.useFakeTimers();
      const closed = jest.fn();
      svc.showAction({ message: 'Gelöscht', action: 'Rückgängig', closed });
      jest.advanceTimersByTime(5999);
      expect(closed).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      const id = svc.showAction({ message: 'x', action: 'y', variant: 'success', timeout: 0, closed });
      jest.advanceTimersByTime(60_000);
      svc.dismiss(id);
      expect(closed.mock.calls).toEqual([['timeout'], ['dismiss']]);
    });
  });
});
