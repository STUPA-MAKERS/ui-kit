import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { matchOnly } from '../../../testing/media';
import { MEDIA } from '../breakpoints/breakpoints';
import { DefaultUiKitIntl, UI_KIT_INTL } from '../intl/intl';
import { TOAST_SWIPE_CLOSE_PX, ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastComponent + ToastService', () => {
  it('puts the stack in the top layer and raises it for a new toast', async () => {
    const show = jest.fn();
    const proto = HTMLElement.prototype as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
    const had = [proto.showPopover, proto.hidePopover];
    proto.showPopover = show;
    proto.hidePopover = jest.fn();
    try {
      const { fixture } = await render(ToastComponent);
      expect(document.querySelector('.toasts')).toHaveAttribute('popover', 'manual');
      const before = show.mock.calls.length;
      expect(before).toBeGreaterThan(0);
      fixture.debugElement.injector.get(ToastService).success('Gespeichert');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(show.mock.calls.length).toBeGreaterThan(before);
    } finally {
      [proto.showPopover, proto.hidePopover] = had;
    }
  });

  // Default language is DE (navigator pinned in setup-jest); the EN case flips it via the
  // injected UI_KIT_INTL instance.

  it('renders toasts pushed through the service', async () => {
    const { fixture } = await render(ToastComponent);
    const svc = fixture.debugElement.injector.get(ToastService);
    svc.success('Gespeichert');
    fixture.detectChanges();
    const toast = await screen.findByRole('status');
    expect(toast).toHaveTextContent('Gespeichert');
    expect(toast).toHaveClass('toast--success');
  });

  it('removes a toast when dismissed', async () => {
    const { fixture } = await render(ToastComponent);
    const svc = fixture.debugElement.injector.get(ToastService);
    svc.show('Weg damit', 'info', 0);
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    fixture.detectChanges();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('localizes the dismiss control label (EN)', async () => {
    const { fixture } = await render(ToastComponent);
    const intl = fixture.debugElement.injector.get(UI_KIT_INTL) as DefaultUiKitIntl;
    intl.setLang('en');
    const svc = fixture.debugElement.injector.get(ToastService);
    svc.show('x', 'info', 0);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('shows the action of a toast, and a press closes it with "action"', async () => {
    const { fixture } = await render(ToastComponent);
    const svc = fixture.debugElement.injector.get(ToastService);
    const closed = jest.fn();
    svc.showAction({ message: 'Archiviert', action: 'Rückgängig', timeout: 0, closed });
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Rückgängig' }));
    fixture.detectChanges();
    expect(closed).toHaveBeenCalledWith('action');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows an icon action with its label as name and title, and an icon before the message', async () => {
    const { fixture, container } = await render(ToastComponent);
    const svc = fixture.debugElement.injector.get(ToastService);
    const closed = jest.fn();
    svc.showAction({
      message: 'Neue Version',
      action: 'Neu laden',
      actionIcon: 'reload',
      closable: false,
      timeout: 0,
      closed,
    });
    svc.showNotice({ message: 'Keine Verbindung', variant: 'danger', icon: 'cloud-off' });
    svc.showNotice({
      message: 'Offline',
      variant: 'danger',
      icon: 'cloud-off',
      iconPosition: 'end',
    });
    fixture.detectChanges();
    expect(screen.queryByRole('button', { name: 'Schließen' })).toBeNull();
    const reload = screen.getByRole('button', { name: 'Neu laden' });
    expect(reload).toHaveAttribute('title', 'Neu laden');
    expect(reload).toHaveClass('toast__iconAction');
    expect(container.querySelectorAll('app-icon.toast__icon:not(.toast__icon--end)')).toHaveLength(
      1,
    );
    const end = container.querySelector('app-icon.toast__icon--end') as HTMLElement;
    expect(end.parentElement?.lastElementChild).toBe(end);
    expect(end.previousElementSibling).toHaveTextContent('Offline');
    expect((reload.firstElementChild as HTMLElement).style.getPropertyValue('--icon-size')).toBe(
      '18px',
    );
    await userEvent.click(reload);
    expect(closed).toHaveBeenCalledWith('action');
  });
});

describe('ToastComponent on a phone (specs 000562-000566)', () => {
  let restore: () => void;
  beforeEach(() => (restore = matchOnly(MEDIA.phone)));
  afterEach(() => restore());

  function pointer(type: string, clientY: number): MouseEvent {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    return event;
  }

  async function phoneToast(message = 'Gespeichert') {
    const { fixture } = await render(ToastComponent);
    const svc = fixture.debugElement.injector.get(ToastService);
    svc.show(message, 'success', 0);
    fixture.detectChanges();
    return { fixture, svc, toast: await screen.findByRole('status') };
  }

  it('shows only the newest toast', async () => {
    const { fixture, svc } = await phoneToast('Erste');
    svc.show('Zweite', 'info', 0);
    fixture.detectChanges();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Zweite');
    expect(svc.toasts()).toHaveLength(2);
  });

  it('shows the icon of the variant in the tile', async () => {
    const { toast } = await phoneToast();
    expect(toast.querySelector('.toast__tile app-icon')).toBeTruthy();
    expect(toast.querySelector('.toast__tile')).toHaveAttribute('aria-hidden', 'true');
  });

  it('closes the toast on a swipe up', async () => {
    const { fixture, toast } = await phoneToast();
    toast.dispatchEvent(pointer('pointerdown', 100));
    toast.dispatchEvent(pointer('pointermove', 80));
    expect(toast.style.transform).toBe('translateY(-20px)');
    toast.dispatchEvent(pointer('pointerup', 100 - TOAST_SWIPE_CLOSE_PX));
    fixture.detectChanges();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('lets a short swipe and a swipe down go back', async () => {
    const { fixture, toast } = await phoneToast();
    toast.dispatchEvent(pointer('pointerdown', 100));
    toast.dispatchEvent(pointer('pointermove', 140));
    expect(toast.style.transform).toBe('');
    toast.dispatchEvent(pointer('pointermove', 90));
    toast.dispatchEvent(pointer('pointerup', 90));
    fixture.detectChanges();
    expect(toast.style.transform).toBe('');
    expect(screen.getByRole('status')).toBe(toast);
    toast.dispatchEvent(pointer('pointerdown', 100));
    toast.dispatchEvent(pointer('pointermove', 50));
    toast.dispatchEvent(pointer('pointercancel', 50));
    fixture.detectChanges();
    expect(toast.style.transform).toBe('');
    expect(screen.getByRole('status')).toBe(toast);
  });
});

describe('ToastComponent on a wide screen', () => {
  let restore: () => void;
  beforeEach(() => (restore = matchOnly(MEDIA.notPhone)));
  afterEach(() => restore());

  it('keeps the whole stack and takes no swipe', async () => {
    const { fixture } = await render(ToastComponent);
    const svc = fixture.debugElement.injector.get(ToastService);
    svc.show('Erste', 'info', 0);
    svc.show('Zweite', 'info', 0);
    fixture.detectChanges();
    const toasts = await screen.findAllByRole('status');
    expect(toasts).toHaveLength(2);
    const down = new MouseEvent('pointerdown', { bubbles: true, clientY: 100 });
    const up = new MouseEvent('pointerup', { bubbles: true, clientY: 0 });
    toasts[0].dispatchEvent(down);
    toasts[0].dispatchEvent(up);
    fixture.detectChanges();
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });
});
