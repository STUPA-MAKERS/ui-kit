import { fallbackChain, type I18nMap, type UiKitTextKey } from '@stupa-makers/ui-kit';
import type { FormRule, RuleSeverity } from './form-editor.types';
import {
  type QuestionGroup,
  duplicateKeys,
  fundingProblem,
  participantsProblem,
  validateFormField,
  validateJsonLogic,
} from './form-field.util';

/*
 * The helpers of the form editor view: copies of the helpers of `app-form-editor`,
 * `shared/forms/i18n-text` and `shared/util/immutable` of STUPA-Workflow.
 */

/** A rule as the editor holds it: the logic as the text the admin types (app spec 001670). */
export interface RuleDraft {
  readonly logic: string;
  readonly message: I18nMap;
  readonly severity: RuleSeverity;
}

/** The logic of a rule as an object, or null when the text is no allowed JsonLogic. */
export function parseLogic(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    const record = typeof value === 'object' && value !== null && !Array.isArray(value);
    return record && validateJsonLogic(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The problem of a rule as a text key, or null. The server checks the same. */
export function ruleProblem(rule: RuleDraft): UiKitTextKey | null {
  if (parseLogic(rule.logic) === null) return 'admin.forms.rules.logicInvalid';
  if (!rule.message['de']?.trim() || !rule.message['en']?.trim()) {
    return 'admin.forms.rules.messageMissing';
  }
  return null;
}

/** A stored rule as the editor holds it. */
export function toDraft(rule: FormRule): RuleDraft {
  return {
    logic: JSON.stringify(rule.logic),
    message: { de: '', en: '', ...rule.message },
    severity: rule.severity,
  };
}

/** A valid draft as the rule the server stores. */
export function toRule(rule: RuleDraft): FormRule {
  return {
    logic: parseLogic(rule.logic) ?? {},
    message: { de: rule.message['de'] ?? '', en: rule.message['en'] ?? '' },
    severity: rule.severity,
  };
}

/**
 * The form can be saved: it has a question, no key twice, no form problem, no rule problem
 * and no question problem. The view shows each problem; the app gates its save with this.
 */
export function formEditorValid(groups: readonly QuestionGroup[], rules: readonly RuleDraft[]): boolean {
  const flat = groups.flatMap((g) => g.fields);
  return (
    flat.length > 0 &&
    duplicateKeys(flat).length === 0 &&
    (fundingProblem(flat) ?? participantsProblem(flat)) === null &&
    rules.every((r) => ruleProblem(r) === null) &&
    flat.every((f) => validateFormField(f).errors.length === 0)
  );
}

/** The index the arrow, Home or End key moves the type menu focus to, or null for another key. */
export function menuTarget(key: string, at: number, length: number): number | null {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return at < 0 ? 0 : (at + 1) % length;
    case 'ArrowUp':
    case 'ArrowLeft':
      return at <= 0 ? length - 1 : at - 1;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}

/** The list with the item at `from` moved to `to`. */
export function movedTo<T>(list: readonly T[], from: number, to: number): readonly T[] {
  const rest = list.filter((_, i) => i !== from);
  return [...rest.slice(0, to), list[from], ...rest.slice(to)];
}

/** Returns a new record without `key`. */
export const withoutKey = <T extends object, K extends keyof T>(record: T, key: K): Omit<T, K> =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key)) as Omit<T, K>;

/** The text of the first language of the fallback chain that the map has, else its first text. */
export function resolveI18n(map: I18nMap | null | undefined, lang: string): string {
  if (!map) return '';
  const code = fallbackChain(lang).find((c) => c in map);
  return code === undefined ? (Object.values(map)[0] ?? '') : (map[code] ?? '');
}
