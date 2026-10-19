import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  it('associates label with control and reflects required', async () => {
    await render(`<app-input label="E-Mail" [required]="true"></app-input>`, {
      imports: [InputComponent],
    });
    const input = screen.getByLabelText(/E-Mail/);
    expect(input).toBeInTheDocument();
    expect(input).toBeRequired();
  });

  it('emits typed value via input event', async () => {
    await render(`<app-input label="Name"></app-input>`, { imports: [InputComponent] });
    const input = screen.getByLabelText('Name');
    await userEvent.type(input, 'Ada');
    expect(input).toHaveValue('Ada');
  });

  it('exposes error via aria-invalid + describedby (a11y)', async () => {
    await render(`<app-input label="PLZ" error="Pflichtfeld"></app-input>`, {
      imports: [InputComponent],
    });
    const input = screen.getByLabelText('PLZ');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Pflichtfeld');
    expect(input.getAttribute('aria-describedby')).toContain('-error');
  });

  it('shows a unit at the end and names it in the description', async () => {
    await render(`<app-input label="Gültigkeit" type="number" suffix="Tage" hint="Höchstens 90" />`, {
      imports: [InputComponent],
    });
    const input = screen.getByLabelText('Gültigkeit');
    const unit = screen.getByText('Tage');
    expect(unit).toHaveClass('fld__suffix');
    expect(input).toHaveAccessibleDescription('Tage Höchstens 90');
  });

  it('has no suffix and no description by default', async () => {
    await render(`<app-input label="Name" />`, { imports: [InputComponent] });
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby');
    expect(document.querySelector('.fld__suffix')).toBeNull();
  });
});
