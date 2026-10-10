import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { DefaultUiKitIntl, UI_KIT_INTL } from '../intl/intl';
import { CurrencyInputComponent } from './currency-input.component';

/** A UI_KIT_INTL provider pinned to a language, used to drive locale-dependent formatting. */
function intlProvider(lang: 'de' | 'en') {
  const intl = new DefaultUiKitIntl();
  intl.setLang(lang);
  return { provide: UI_KIT_INTL, useValue: intl };
}

@Component({
  standalone: true,
  imports: [CurrencyInputComponent, FormsModule],
  template: `<app-currency-input [ngModel]="value()" (ngModelChange)="value.set($event)" ariaLabel="amount" />`,
})
class HostComponent {
  readonly value = signal('');
}

async function setup(initial = '') {
  const view = await render(HostComponent);
  view.fixture.componentInstance.value.set(initial);
  view.fixture.detectChanges();
  await view.fixture.whenStable();
  view.fixture.detectChanges(); // NgModel.writeValue läuft per Microtask → re-render
  const input = screen.getByLabelText('amount') as HTMLInputElement;
  return { ...view, input, host: view.fixture.componentInstance };
}

describe('CurrencyInputComponent', () => {
  beforeEach(() => localStorage.setItem('ap.locale', 'de'));

  it('renders a € symbol', async () => {
    await setup();
    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('writes a canonical model value from user input', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '1234,56' } });
    expect(host.value()).toBe('1234.56');
  });

  it('formats with grouping + 2 decimals on blur (de)', async () => {
    const { input } = await setup();
    fireEvent.input(input, { target: { value: '1234,5' } });
    fireEvent.blur(input);
    expect(input.value).toBe('1.234,50');
  });

  it('shows an editable (ungrouped) value on focus', async () => {
    const { input } = await setup('1234.56');
    expect(input.value).toBe('1.234,56'); // formatted while blurred
    fireEvent.focus(input);
    expect(input.value).toBe('1234,56'); // editable on focus
  });

  it('clears to empty model for blank input', async () => {
    const { input, host } = await setup('10');
    fireEvent.input(input, { target: { value: '' } });
    expect(host.value()).toBe('');
  });

  it('formats a numeric model value (number input) on blur', async () => {
    const { input } = await setup();
    // writeValue accepts a number too; here drive through the canonical pipeline.
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: '1000' } });
    fireEvent.blur(input);
    expect(input.value).toBe('1.000,00');
  });

  it('parses thousand groupings in groups of 3 (de)', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '1.234.567,89' } });
    expect(host.value()).toBe('1234567.89');
  });

  it('treats a trailing comma as a separator with empty fraction (no decimals)', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '1234,' } });
    // lastSep present but fracPart empty → integer-only canonical.
    expect(host.value()).toBe('1234');
  });

  it('parses a value with no separator at all', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '42' } });
    expect(host.value()).toBe('42');
  });

  it('strips leading zeros from the integer part', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '007,50' } });
    // Leading zeros stripped from the integer part; fraction kept verbatim.
    expect(host.value()).toBe('7.50');
  });

  it('keeps a single zero integer for a pure-fraction input', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: ',50' } });
    // intPart empty, fracPart '50' → "0.50".
    expect(host.value()).toBe('0.50');
  });

  it('preserves a negative sign', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '-1234,56' } });
    expect(host.value()).toBe('-1234.56');
  });

  it('parses input containing only separators/sign to empty', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '-' } });
    // After stripping sign + separators nothing remains → empty.
    expect(host.value()).toBe('');
  });

  it('shows an editable value when writeValue arrives while focused', async () => {
    const { input, host, fixture } = await setup();
    fireEvent.focus(input);
    host.value.set('9876.5');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // Focused → editable (ungrouped, local separator), not formatted.
    expect(input.value).toBe('9876,5');
  });

  it('renders label, hint, required marker and error', async () => {
    await render(
      `<app-currency-input label="Betrag" hint="in Euro" error="Pflicht" [required]="true" />`,
      { imports: [CurrencyInputComponent], componentProperties: {} },
    );
    expect(screen.getByText('Betrag')).toBeInTheDocument();
    // error present → hint hidden, alert shown.
    expect(screen.queryByText('in Euro')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Pflicht');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows the hint when there is no error', async () => {
    await render(`<app-currency-input label="Betrag" hint="in Euro" />`, {
      imports: [CurrencyInputComponent],
    });
    expect(screen.getByText('in Euro')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('marks aria-invalid when an error is set', async () => {
    const { container } = await render(`<app-currency-input ariaLabel="amount" error="x" />`, {
      imports: [CurrencyInputComponent],
    });
    expect(container.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('uses the label as aria-label fallback and reflects the name attribute', async () => {
    const { container } = await render(`<app-currency-input label="Betrag" name="amount" placeholder="0,00" />`, {
      imports: [CurrencyInputComponent],
    });
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('aria-label', 'Betrag');
    expect(input).toHaveAttribute('name', 'amount');
    expect(input).toHaveAttribute('placeholder', '0,00');
  });

  it('disables the input via setDisabledState', async () => {
    const view = await render(`<app-currency-input ariaLabel="amount" />`, {
      imports: [CurrencyInputComponent],
    });
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as CurrencyInputComponent;
    cmp.setDisabledState(true);
    view.fixture.detectChanges();
    expect(screen.getByLabelText('amount')).toBeDisabled();
  });

  it('parses a lone zero (after leading-zero strip the integer collapses to 0)', async () => {
    const { input, host } = await setup();
    fireEvent.input(input, { target: { value: '000' } });
    // intPart "000" → strip leaves "" → `intPart || '0'` → "0".
    expect(host.value()).toBe('0');
  });

  it('default onChange/onTouched callbacks are safe no-ops before registration', async () => {
    const view = await render(`<app-currency-input ariaLabel="amount" />`, {
      imports: [CurrencyInputComponent],
    });
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as CurrencyInputComponent;
    const onChange = (cmp as unknown as { onChange: (v: string) => void }).onChange;
    const onTouched = (cmp as unknown as { onTouched: () => void }).onTouched;
    expect(() => onChange('x')).not.toThrow();
    expect(() => onTouched()).not.toThrow();
  });

  it('marks the field touched on blur (registerOnTouched)', async () => {
    const onTouched = jest.fn();
    const view = await render(`<app-currency-input ariaLabel="amount" />`, {
      imports: [CurrencyInputComponent],
    });
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as CurrencyInputComponent;
    cmp.registerOnTouched(onTouched);
    fireEvent.blur(screen.getByLabelText('amount'));
    expect(onTouched).toHaveBeenCalled();
  });
});

describe('CurrencyInputComponent (typing and invalid text)', () => {
  beforeEach(() => localStorage.setItem('ap.locale', 'de'));

  it.each([
    ['12,', '12'],
    ['1,5', '1.5'],
    ['1.234,56', '1234.56'],
    ['-5', '-5'],
  ])('keeps the typed text %p while focused and writes %p', async (raw, model) => {
    const { input, host, fixture } = await setup();
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: raw } });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.value()).toBe(model);
    expect(input.value).toBe(raw);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([['abc'], ['12,345'], ['1,999'], ['1234.5']])(
    'keeps invalid text %p, writes an empty model and shows the error',
    async (raw) => {
      const { input, host, fixture } = await setup('10');
      fireEvent.focus(input);
      fireEvent.input(input, { target: { value: raw } });
      fixture.detectChanges();
      expect(host.value()).toBe('');
      expect(input.value).toBe(raw);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('Kein gültiger Betrag');
      fireEvent.blur(input);
      fixture.detectChanges();
      expect(input.value).toBe(raw); // not cleared, not rounded
      fireEvent.focus(input);
      expect(input.value).toBe(raw);
    },
  );

  it('clears the error when the text becomes valid again', async () => {
    const { input, host, fixture } = await setup();
    fireEvent.input(input, { target: { value: 'abc' } });
    fixture.detectChanges();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.input(input, { target: { value: '12,5' } });
    fixture.detectChanges();
    expect(host.value()).toBe('12.5');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not rewrite the text when the model echoes back while focused', async () => {
    const view = await render(`<app-currency-input ariaLabel="amount" />`, {
      imports: [CurrencyInputComponent],
    });
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as CurrencyInputComponent;
    const input = screen.getByLabelText('amount') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: '12,' } });
    cmp.writeValue('12');
    view.fixture.detectChanges();
    expect(input.value).toBe('12,');
    // Invalid text: the echo of the empty model keeps it too.
    fireEvent.input(input, { target: { value: 'abc' } });
    cmp.writeValue('');
    view.fixture.detectChanges();
    expect(input.value).toBe('abc');
  });

  it('shows a non-numeric model value with the error and resets on a valid one', async () => {
    const view = await render(`<app-currency-input ariaLabel="amount" />`, {
      imports: [CurrencyInputComponent],
    });
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as CurrencyInputComponent;
    cmp.writeValue('abc');
    view.fixture.detectChanges();
    const input = screen.getByLabelText('amount') as HTMLInputElement;
    expect(input.value).toBe('abc');
    expect(cmp.validate()).toEqual({ currency: true });
    cmp.writeValue(12.5);
    view.fixture.detectChanges();
    expect(input.value).toBe('12,50');
    expect(cmp.validate()).toBeNull();
  });

  it('makes a reactive form control invalid for invalid text', async () => {
    @Component({
      standalone: true,
      imports: [CurrencyInputComponent, ReactiveFormsModule],
      template: `<app-currency-input [formControl]="ctrl" ariaLabel="amount" />`,
    })
    class FormHost {
      readonly ctrl = new FormControl('5');
    }
    const view = await render(FormHost);
    const input = screen.getByLabelText('amount') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '1,234' } });
    expect(view.fixture.componentInstance.ctrl.errors).toEqual({ currency: true });
    fireEvent.input(input, { target: { value: '1,23' } });
    expect(view.fixture.componentInstance.ctrl.value).toBe('1.23');
    expect(view.fixture.componentInstance.ctrl.errors).toBeNull();
  });

  it('prefers the error input over the invalid-text message', async () => {
    await render(`<app-currency-input ariaLabel="amount" error="Pflicht" />`, {
      imports: [CurrencyInputComponent],
    });
    fireEvent.input(screen.getByLabelText('amount'), { target: { value: 'abc' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Pflicht');
  });
});

describe('CurrencyInputComponent (EN locale)', () => {
  it('reads "12,345" as twelve thousand and rejects 3 decimals', async () => {
    @Component({
      standalone: true,
      imports: [CurrencyInputComponent, FormsModule],
      template: `<app-currency-input [ngModel]="value()" (ngModelChange)="value.set($event)" ariaLabel="amount" />`,
    })
    class EnHost {
      readonly value = signal('');
    }
    const view = await render(EnHost, { providers: [intlProvider('en')] });
    const input = screen.getByLabelText('amount') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '12,345' } });
    expect(view.fixture.componentInstance.value()).toBe('12345');
    fireEvent.input(input, { target: { value: '12.345' } });
    view.fixture.detectChanges();
    expect(view.fixture.componentInstance.value()).toBe('');
    expect(screen.getByRole('alert')).toHaveTextContent('Not a valid amount');
  });

  it('uses a dot decimal separator for editing and en-US grouping for display', async () => {
    @Component({
      standalone: true,
      imports: [CurrencyInputComponent, FormsModule],
      template: `<app-currency-input [ngModel]="value()" (ngModelChange)="value.set($event)" ariaLabel="amount" />`,
    })
    class EnHost {
      readonly value = signal('1234.5');
    }
    const view = await render(EnHost, { providers: [intlProvider('en')] });
    await view.fixture.whenStable();
    view.fixture.detectChanges();
    const input = screen.getByLabelText('amount') as HTMLInputElement;
    expect(input.value).toBe('1,234.50'); // en-US grouping
    fireEvent.focus(input);
    expect(input.value).toBe('1234.5'); // editable keeps the dot separator
  });
});
