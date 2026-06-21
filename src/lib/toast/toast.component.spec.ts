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
});
