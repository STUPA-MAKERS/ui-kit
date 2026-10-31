import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import { matchOnly } from '../../../testing/media';
import { MEDIA } from '../breakpoints/breakpoints';
import { ToastBarComponent } from './toast-bar.component';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

const TEMPLATE = '<app-toast-bar /><app-toast />';

async function setup() {
  const view = await render(TEMPLATE, { imports: [ToastBarComponent, ToastComponent] });
  return { ...view, toast: TestBed.inject(ToastService) };
}

const bar = (container: Element) => container.querySelector('app-toast-bar') as HTMLElement;
const stack = (container: Element) => container.querySelector('app-toast') as HTMLElement;

describe('ToastBarComponent', () => {
  let restore: () => void;
  afterEach(() => restore());

  describe('on a phone', () => {
    beforeEach(() => (restore = matchOnly(MEDIA.phone)));

    it('shows a top toast as a bar with its message, action and close button', async () => {
      const { fixture, container, toast } = await setup();
      const closed = jest.fn();
      toast.showAction({
        message: 'Eine neue Version der App ist bereit.',
        action: 'Neu laden',
        timeout: 0,
        phonePlacement: 'top',
        closed,
      });
      fixture.detectChanges();
      const status = within(bar(container)).getByRole('status');
      expect(status).toHaveClass('tbar');
      expect(status).not.toHaveClass('tbar--danger');
      expect(status).toHaveTextContent('Eine neue Version der App ist bereit.');
      expect(stack(container).querySelector('.toast')).toBeNull();
      await userEvent.click(within(status).getByRole('button', { name: 'Neu laden' }));
      fixture.detectChanges();
      expect(closed).toHaveBeenCalledWith('action');
      expect(toast.toasts()).toHaveLength(0);
    });

    it('makes the whole bar the action button of an icon action, without a close button', async () => {
      const { fixture, container, toast } = await setup();
      const closed = jest.fn();
      toast.showAction({
        message: 'Eine neue Version der App ist bereit.',
        action: 'Neu laden',
        actionIcon: 'reload',
        closable: false,
        timeout: 0,
        phonePlacement: 'top',
        closed,
      });
      fixture.detectChanges();
      const status = within(bar(container)).getByRole('status');
      const buttons = within(status).getAllByRole('button');
      expect(buttons).toHaveLength(1);
      const reload = within(status).getByRole('button', { name: 'Neu laden' });
      expect(reload).toHaveClass('tbar__row');
      expect(reload).toHaveAccessibleDescription('Eine neue Version der App ist bereit.');
      expect(reload.querySelector('app-icon.tbar__go')).not.toBeNull();
      await userEvent.click(screen.getByText('Eine neue Version der App ist bereit.'));
      expect(closed).toHaveBeenCalledWith('action');
    });

    it('closes the bar with its close button', async () => {
      const { fixture, container, toast } = await setup();
      const closed = jest.fn();
      toast.showAction({ message: 'Neu', action: 'Neu laden', phonePlacement: 'top', closed });
      fixture.detectChanges();
      await userEvent.click(within(bar(container)).getByRole('button', { name: 'Schließen' }));
      expect(closed).toHaveBeenCalledWith('dismiss');
    });

    it('keeps the other toasts in the stack', async () => {
      const { fixture, container, toast } = await setup();
      toast.success('Gespeichert');
      fixture.detectChanges();
      expect(bar(container).querySelector('.tbar')).toBeNull();
      expect(within(stack(container)).getByRole('status')).toHaveTextContent('Gespeichert');
    });

    it('shows a danger notice red, with its icon, without a close button, above the accent bar', async () => {
      const { fixture, container, toast } = await setup();
      toast.showAction({
        message: 'Update',
        action: 'Neu laden',
        phonePlacement: 'top',
        closed: jest.fn(),
      });
      const id = toast.showNotice({
        message: 'Keine Verbindung',
        variant: 'danger',
        icon: 'cloud-off',
        phonePlacement: 'top',
      });
      fixture.detectChanges();
      const bars = within(bar(container)).getAllByRole('status');
      expect(bars.map((b) => b.querySelector('.tbar__msg')?.textContent)).toEqual([
        'Keine Verbindung',
        'Update',
      ]);
      expect(bars[0]).toHaveClass('tbar--danger');
      expect(bars[0].querySelector('app-icon.tbar__icon')).not.toBeNull();
      expect(within(bars[0]).queryByRole('button')).toBeNull();
      toast.dismiss(id);
      fixture.detectChanges();
      expect(toast.topBarToasts().map((t) => t.message)).toEqual(['Update']);
    });

    it('has no axe violations', async () => {
      const { fixture, container, toast } = await setup();
      toast.showAction({
        message: 'Neu',
        action: 'Neu laden',
        phonePlacement: 'top',
        closed: jest.fn(),
      });
      fixture.detectChanges();
      expect(await runAxe(container)).toHaveNoViolations();
    });
  });

  describe('on a wider screen', () => {
    beforeEach(() => (restore = matchOnly(MEDIA.notPhone)));

    it('leaves the bar empty and shows a top toast in the stack', async () => {
      const { fixture, container, toast } = await setup();
      toast.showAction({
        message: 'Neu',
        action: 'Neu laden',
        phonePlacement: 'top',
        closed: jest.fn(),
      });
      fixture.detectChanges();
      expect(bar(container).querySelector('.tbar')).toBeNull();
      expect(within(stack(container)).getByRole('status')).toHaveTextContent('Neu');
    });
  });

  it('shows a top toast in the stack on a phone while no bar is in the page', async () => {
    restore = matchOnly(MEDIA.phone);
    const { fixture, container } = await render('<app-toast />', { imports: [ToastComponent] });
    const toast = TestBed.inject(ToastService);
    toast.showAction({
      message: 'Neu',
      action: 'Neu laden',
      phonePlacement: 'top',
      closed: jest.fn(),
    });
    fixture.detectChanges();
    expect(within(stack(container)).getByRole('status')).toHaveTextContent('Neu');
  });
});
