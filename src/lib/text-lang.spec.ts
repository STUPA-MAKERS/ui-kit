import { render } from '@testing-library/angular';
import { CurrencyInputComponent } from './currency-input/currency-input.component';
import { DatepickerComponent } from './datepicker/datepicker.component';
import { InputComponent } from './input/input.component';
import { SelectFieldComponent } from './select/select.component';

/**
 * WCAG 3.1.2 (app spec 000523): a label, a hint or an option in another language than the
 * page carries its own `lang`, and without `textLang` nothing does.
 */
describe('textLang', () => {
  it('marks the label and the hint of each field', async () => {
    const { container } = await render(
      `<app-input label="Titel" hint="Kurz" textLang="de" />
       <app-datepicker label="Datum" hint="Tag" textLang="de" />
       <app-currency-input label="Betrag" hint="Euro" textLang="de" />
       <app-select label="Art" hint="Eine" textLang="de" [options]="[]" />
       <app-input label="Title" hint="Short" />`,
      { imports: [InputComponent, DatepickerComponent, CurrencyInputComponent, SelectFieldComponent] },
    );
    const labels = Array.from(container.querySelectorAll('label'));
    expect(labels.map((l) => l.getAttribute('lang'))).toEqual(['de', 'de', 'de', 'de', null]);
    const hints = Array.from(container.querySelectorAll('[id$="-hint"]'));
    expect(hints.map((h) => h.getAttribute('lang'))).toEqual(['de', 'de', 'de', 'de', null]);
  });

  it('marks an option and the chosen value in another language', async () => {
    const { container } = await render(
      `<app-select label="Art" value="a" [options]="options" />`,
      {
        imports: [SelectFieldComponent],
        componentProperties: {
          options: [
            { value: 'a', label: 'Reise', lang: 'de' },
            { value: 'b', label: 'Travel' },
          ],
        },
      },
    );
    expect(container.querySelector('.sel__value')).toHaveAttribute('lang', 'de');
  });
});
