import { fireEvent, render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { EditButtonComponent } from './edit-button.component';

const TEMPLATE = `<div class="btn-grp"><app-edit-button [phone]="phone" label="Rechnung bearbeiten" text="Bearbeiten" (pressed)="pressed()" /></div>`;

describe('EditButtonComponent', () => {
  it('is an icon button with its name as the tooltip above the phone width', async () => {
    const pressed = jest.fn();
    const { container } = await render(TEMPLATE, {
      imports: [EditButtonComponent],
      componentProperties: { phone: false, pressed },
    });
    const button = screen.getByRole('button', { name: 'Rechnung bearbeiten' });
    expect(button.getAttribute('title')).toBe('Rechnung bearbeiten');
    expect(container.querySelector('app-edit-button')!.classList).toContain('btn-grp__seg');
    fireEvent.click(button);
    expect(pressed).toHaveBeenCalledTimes(1);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('shows its text on a phone', async () => {
    const pressed = jest.fn();
    const { container } = await render(TEMPLATE, {
      imports: [EditButtonComponent],
      componentProperties: { phone: true, pressed },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    expect(pressed).toHaveBeenCalledTimes(1);
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
