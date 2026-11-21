import type { FieldDef, FormDef } from '@stupa-makers/ui-kit';

/** One error of a field: the kind and the numbers of its text. */
export interface FieldError {
  readonly kind: string;
  readonly params?: Readonly<Record<string, string | number>>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** The fields of a form that hold a value, in order (a display field holds none). */
export function valueFields(form: FormDef): readonly FieldDef[] {
  return form.sections.flatMap((s) => s.fields).filter((f) => f.kind !== 'display');
}

/** The empty value of a field kind. */
export function emptyValue(field: FieldDef): unknown {
  switch (field.kind) {
    case 'number':
    case 'money':
      return null;
    case 'date-range':
      return { start: '', end: '' };
    case 'checkbox':
    case 'switch':
      return false;
    case 'multi-select':
    case 'file':
      return [];
    case 'repeat':
      return Array.from({ length: field.min ?? 0 }, () => emptyRow(field.fields));
    default:
      return '';
  }
}

/** A new row of a repeat group. */
export function emptyRow(fields: readonly FieldDef[]): Record<string, unknown> {
  return withDefaults(fields, {});
}

/** The value with an empty value for each missing field, and each repeat row filled. */
export function withDefaults(
  fields: readonly FieldDef[],
  value: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const filled = fields
    .filter((f) => f.kind !== 'display')
    .map((f): [string, unknown] => {
      const v = value[f.key];
      if (f.kind === 'repeat') {
        return [
          f.key,
          Array.isArray(v)
            ? v.map((row: Record<string, unknown>) => withDefaults(f.fields, row ?? {}))
            : emptyValue(f),
        ];
      }
      if (f.kind === 'number' && typeof v === 'number') return [f.key, String(v)];
      return [f.key, v === undefined || v === null ? emptyValue(f) : v];
    });
  return { ...value, ...Object.fromEntries(filled) };
}

/** The value the app gets: no hidden field, numbers as numbers, repeat rows cleaned too. */
export function cleanValue(
  fields: readonly FieldDef[],
  value: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((f) => f.kind !== 'display' && f.visible !== false)
      .map((f): [string, unknown] => {
        const v = value[f.key];
        if (f.kind === 'repeat') {
          const rows = Array.isArray(v) ? v : [];
          return [f.key, rows.map((row: Record<string, unknown>) => cleanValue(f.fields, row))];
        }
        if (f.kind === 'number') return [f.key, toNumber(v)];
        return [f.key, plain(v)];
      }),
  );
}

/** A copy of plain data without the symbol keys that signal forms adds to records. */
export function plain(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v).map((k) => [k, plain((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Whether a value counts as filled in for a required field. */
export function isFilled(field: FieldDef, v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'boolean') return v || (field.kind !== 'checkbox' && field.kind !== 'switch');
  if (Array.isArray(v)) return v.length > 0;
  if (field.kind === 'date-range') {
    const r = v as { start?: string; end?: string };
    return !!r.start && !!r.end;
  }
  return true;
}

/** The IBAN check: country, check digits and the mod-97 rule. */
export function validIban(raw: string): boolean {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const moved = s.slice(4) + s.slice(0, 4);
  const digits = [...moved].map((ch) => (ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch)).join('');
  const rest = [...digits].reduce((r, d) => (r * 10 + Number(d)) % 97, 0);
  return rest === 1;
}

/**
 * The first error of a field, or `null`: required, then format, then limits. The kit checks
 * these itself (§S/framework/forms/002256).
 */
export function fieldError(field: FieldDef, v: unknown): FieldError | null {
  if (field.kind === 'display' || field.visible === false || field.disabled) return null;
  const filled = isFilled(field, v);
  if (field.required && !filled) return { kind: 'required' };
  if (field.kind === 'repeat') {
    const n = Array.isArray(v) ? v.length : 0;
    if (field.min !== undefined && n < field.min)
      return { kind: 'repeatMin', params: { n: field.min } };
    if (field.max !== undefined && n > field.max)
      return { kind: 'repeatMax', params: { n: field.max } };
    return null;
  }
  if (!filled) return null;
  switch (field.kind) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
    case 'iban': {
      const s = String(v);
      if (field.maxLength !== undefined && s.length > field.maxLength)
        return { kind: 'maxLength', params: { n: field.maxLength } };
      if (field.kind === 'email' && !EMAIL.test(s.trim())) return { kind: 'email' };
      if (field.kind === 'url' && !URL_RE.test(s.trim())) return { kind: 'url' };
      if (field.kind === 'iban' && !validIban(s)) return { kind: 'iban' };
      if (field.pattern && !new RegExp(`^(?:${field.pattern})$`, 'u').test(s))
        return { kind: 'pattern' };
      return null;
    }
    case 'number':
    case 'money': {
      const n = field.kind === 'number' ? toNumber(v) : toNumber(String(v));
      if (n === null) return { kind: 'number' };
      if (field.min !== undefined && n < field.min)
        return { kind: 'min', params: { n: field.min } };
      if (field.max !== undefined && n > field.max)
        return { kind: 'max', params: { n: field.max } };
      return null;
    }
    case 'date': {
      const s = String(v);
      if (field.min && s < field.min) return { kind: 'minDate', params: { d: field.min } };
      if (field.max && s > field.max) return { kind: 'maxDate', params: { d: field.max } };
      return null;
    }
    case 'date-range': {
      const r = v as { start: string; end: string };
      if (r.start && r.end && r.start > r.end) return { kind: 'range' };
      return null;
    }
    default:
      return null;
  }
}

/** Two values are the same (plain data: strings, numbers, arrays, records). */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) =>
    sameValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}
