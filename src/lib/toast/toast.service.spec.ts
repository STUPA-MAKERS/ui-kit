import { TestBed } from '@angular/core/testing';
import { Announcer } from '../announce/announcer';
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

  it('reads every toast out once, a fault in the assertive region (spec 000517)', () => {
    const announce = jest.spyOn(TestBed.inject(Announcer), 'announce');
    svc.show({ text: 'Gespeichert', kind: 'success' });
    svc.show({ text: 'Nicht gespeichert', kind: 'error' });
    svc.show({
      text: 'Gelöscht',
      action: { key: 'action', label: 'Rückgängig' },
      closed: () => undefined,
    });
    svc.show({ text: 'Offline', kind: 'error', sticky: true });
    expect(announce.mock.calls).toEqual([
      ['Gespeichert', 'polite'],
      ['Nicht gespeichert', 'assertive'],
      ['Gelöscht Rückgängig', 'polite'],
      ['Offline', 'assertive'],
    ]);
  });

  it('starts with no toasts', () => {
    expect(svc.toasts()).toEqual([]);
  });

  it('show() appends a toast with a unique id and returns it; default variant is info', () => {
    jest.useFakeTimers();
    const id1 = svc.show({ text: 'Erste' });
    const id2 = svc.show({ text: 'Zweite' });
    expect(id1).not.toBe(id2);
    const list = svc.toasts();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ id: id1, message: 'Erste', variant: 'info' });
    expect(list[1]).toMatchObject({ id: id2, message: 'Zweite', variant: 'info' });
  });

  it('auto-dismisses after the default timeout (4000ms)', () => {
    jest.useFakeTimers();
    svc.show({ text: 'Verschwindet' });
    expect(svc.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(3999);
    expect(svc.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(svc.toasts()).toHaveLength(0);
  });

  it('keeps a toast with an action for 6 s', () => {
    jest.useFakeTimers();
    svc.show({ text: 'x', action: { key: 'undo', label: 'Rückgängig' } });
    jest.advanceTimersByTime(5999);
    expect(svc.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(svc.toasts()).toHaveLength(0);
  });

  it('does NOT auto-dismiss when timeout is 0', () => {
    jest.useFakeTimers();
    svc.show({ text: 'Bleibt', kind: 'warning', sticky: true });
    jest.advanceTimersByTime(100000);
    expect(svc.toasts()).toHaveLength(1);
    expect(svc.toasts()[0].variant).toBe('warning');
  });

  it('success() pushes a success toast', () => {
    jest.useFakeTimers();
    svc.show({ text: 'Gespeichert', kind: 'success' });
    expect(svc.toasts()[0]).toMatchObject({ message: 'Gespeichert', variant: 'success' });
  });

  it('error() pushes a danger toast', () => {
    jest.useFakeTimers();
    svc.show({ text: 'Fehlgeschlagen', kind: 'error' });
    expect(svc.toasts()[0]).toMatchObject({ message: 'Fehlgeschlagen', variant: 'danger' });
  });

  it('dismiss() removes only the matching toast', () => {
    const a = svc.show({ text: 'A', sticky: true });
    const b = svc.show({ text: 'B', sticky: true });
    svc.dismiss(a);
    const list = svc.toasts();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b);
  });

  it('dismiss() with an unknown id is a no-op', () => {
    svc.show({ text: 'A', sticky: true });
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
      const id = svc.show({
        text: 'Archiviert',
        action: { key: 'action', label: 'Rückgängig' },
        closed: closed,
      });
      expect(svc.toasts()[0]).toMatchObject({
        id,
        message: 'Archiviert',
        action: 'Rückgängig',
        variant: 'info',
      });
      svc.act(id);
      expect(svc.toasts()).toEqual([]);
      jest.advanceTimersByTime(6000);
      expect(closed.mock.calls).toEqual([['action']]);
    });

    it('reports the timeout after 6 s by default, and a dismiss', () => {
      jest.useFakeTimers();
      const closed = jest.fn();
      svc.show({
        text: 'Gelöscht',
        action: { key: 'action', label: 'Rückgängig' },
        closed: closed,
      });
      jest.advanceTimersByTime(5999);
      expect(closed).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      const id = svc.show({
        text: 'x',
        action: { key: 'action', label: 'y' },
        kind: 'success',
        closed: closed,
        sticky: true,
      });
      jest.advanceTimersByTime(60_000);
      svc.dismiss(id);
      expect(closed.mock.calls).toEqual([['timeout'], ['dismiss']]);
    });
  });
});

describe('ToastService notices and the top bar', () => {
  it('keeps a notice without a close button until dismiss()', () => {
    jest.useFakeTimers();
    const svc = TestBed.inject(ToastService);
    const id = svc.show({
      text: 'Keine Verbindung',
      kind: 'error',
      icon: 'cloud-off',
      sticky: true,
      closable: false,
    });
    expect(svc.toasts()[0]).toEqual(
      expect.objectContaining({ closable: false, icon: 'cloud-off', barTone: 'danger' }),
    );
    jest.advanceTimersByTime(60 * 60 * 1000);
    expect(svc.toasts()).toHaveLength(1);
    svc.dismiss(id);
    expect(svc.toasts()).toHaveLength(0);
    jest.useRealTimers();
  });

  it('counts the top bars, and a second removal of one bar does nothing', () => {
    const svc = TestBed.inject(ToastService);
    const first = svc.registerTopBar();
    const second = svc.registerTopBar();
    first();
    first();
    expect(svc.hasTopBar()).toBe(true);
    second();
    expect(svc.hasTopBar()).toBe(false);
  });
});

describe('ToastService.show({ text: options }) (002253)', () => {
  it('shows a text toast as info or as an error', () => {
    const service = TestBed.inject(ToastService);
    service.show({ text: 'Gespeichert' });
    service.show({ text: 'Fehler', kind: 'error', sticky: true });
    expect(service.toasts().map((t) => [t.message, t.variant])).toEqual([
      ['Gespeichert', 'info'],
      ['Fehler', 'danger'],
    ]);
  });

  it('shows an action and calls closed on a press', () => {
    const service = TestBed.inject(ToastService);
    const closed = jest.fn();
    const id = service.show({
      text: 'Gelöscht',
      action: { key: 'undo', label: 'Rückgängig' },
      closed,
    });
    expect(service.toasts()[0].action).toBe('Rückgängig');
    service.act(id);
    expect(closed).toHaveBeenCalledWith('action');
  });

  it('takes the short form show(text, kind) like the options', () => {
    const svc = TestBed.inject(ToastService);
    svc.show('Gespeichert', 'success');
    svc.show('Hinweis');
    const [a, b] = svc.toasts();
    expect(a.message).toBe('Gespeichert');
    expect(a.variant).toBe('success');
    expect(b.variant).toBe('info');
  });
});
