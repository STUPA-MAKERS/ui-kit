import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { DefaultUiKitIntl, UI_KIT_INTL } from '../intl/intl';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastComponent + ToastService', () => {
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
