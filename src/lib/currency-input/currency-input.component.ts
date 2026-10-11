import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type ControlValueAccessor,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { UI_KIT_INTL } from '../intl/intl';
import { type MoneyParseResult, parseMoney, parseMoneyModel } from './parse-money';

/**
 * Einheitliches Währungs-Eingabefeld. Überall gleiche Optik:
 * rechtsbündig, Tausender-Gruppierung + 2 Nachkommastellen, „€"-Suffix.
 *
 * `ControlValueAccessor` → per `[(ngModel)]` nutzbar. Das **Modell** ist stets ein
 * kanonischer Dezimal-String mit Punkt (`"1234.56"`, parsebar fürs Backend) bzw.
 * `''` für leer. Die **Anzeige** ist lokalisiert (de `1.234,56`, en `1,234.56`):
 * beim Fokus editierbar (ohne Gruppierung), beim Verlassen formatiert.
 *
 * The parser is {@link parseMoney}: locale-aware, thousands only in groups of 3, at most
 * 2 decimals. Invalid text stays on screen, the model becomes `''`, the field shows the
 * message `currency.invalid` and the validator reports `{ currency: true }`. The field
 * never rounds and never clears the text of the user. While the field has focus, a
 * `writeValue` with the current model value does not rewrite the text.
 */
@Component({
  selector: 'app-currency-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CurrencyInputComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: CurrencyInputComponent, multi: true },
  ],
  templateUrl: './currency-input.component.html',
  styleUrl: './currency-input.component.scss',
})
export class CurrencyInputComponent implements ControlValueAccessor, Validator {
  private readonly intl = inject(UI_KIT_INTL);

  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly name = input('');
  /** Optionales Feld-Label; gesetzt → volle Feld-Optik (Label/Hint/Error),
   *  leer → blankes Control (für eigene Label-Wrapper, z. B. Filter/Dialoge). */
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false);

  /** Sichtbarer Text (formatiert oder beim Tippen roh). */
  protected readonly text = signal('');
  protected readonly disabled = signal(false);
  /** The text is not a valid amount. */
  protected readonly invalid = signal(false);
  /** The error to show: the `error` input first, else the message for invalid text. */
  protected readonly shownError = computed(
    () => this.error() || (this.invalid() ? this.intl.translate('currency.invalid') : ''),
  );

  /** Kanonischer Wert (Punkt-Dezimal, ohne Gruppierung) — das Modell. */
  private canonical = '';
  private focused = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ---------------------------------------------------
  writeValue(value: string | number | null): void {
    const result = parseMoneyModel(value, this.intl.lang());
    const canonical = result.status === 'valid' ? result.canonical : '';
    // An echo of the current model while the user types must not rewrite the text,
    // because that drops a trailing separator and moves the caret.
    if (this.focused && canonical === this.canonical) return;
    this.canonical = canonical;
    if (result.status === 'invalid') {
      this.invalid.set(true);
      this.text.set(String(value));
      return;
    }
    this.invalid.set(false);
    this.text.set(this.focused ? this.toEditable(canonical) : this.format(canonical));
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // --- Validator ----------------------------------------------------------------
  validate(): ValidationErrors | null {
    return this.invalid() ? { currency: true } : null;
  }

  // --- Interaktion ------------------------------------------------------------
  protected onFocus(): void {
    this.focused = true;
    if (!this.invalid()) this.text.set(this.toEditable(this.canonical));
  }

  protected onInput(raw: string): void {
    this.text.set(raw); // roh stehen lassen (kein Cursor-Springen)
    const result: MoneyParseResult = parseMoney(raw, this.intl.lang());
    this.invalid.set(result.status === 'invalid');
    this.canonical = result.status === 'valid' ? result.canonical : '';
    this.onChange(this.canonical);
  }

  protected onBlur(): void {
    this.focused = false;
    // Invalid text stays as typed, so the user can correct it.
    if (!this.invalid()) this.text.set(this.format(this.canonical));
    this.onTouched();
  }

  // --- Formatieren --------------------------------------------------------------
  private get decimalSep(): string {
    return this.intl.lang() === 'en' ? '.' : ',';
  }

  /** Kanonisch → editierbarer Text (lokaler Dezimaltrenner, keine Gruppierung). */
  private toEditable(canonical: string): string {
    if (!canonical) return '';
    return this.decimalSep === ',' ? canonical.replace('.', ',') : canonical;
  }

  /** Kanonisch → lokalisiert formatiert (1.234,56) mit 2 Nachkommastellen. */
  private format(canonical: string): string {
    if (!canonical) return '';
    const locale = this.intl.lang() === 'en' ? 'en-US' : 'de-DE';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(canonical));
  }
}
