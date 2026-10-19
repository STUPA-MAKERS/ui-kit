import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import type { ConfigDiffData } from './config-diff.types';

/** One change of the compact view: the key, then the old and the new value as code. */
interface CompactLine {
  key: string;
  /** The old value, `null` for an added key. */
  before: string | null;
  /** The new value, `null` for a removed key. */
  after: string | null;
}

/**
 * Feld-Diff-Renderer (added/removed/changed) — z. B. für Antrags-Historie
 * (Submission-Versionen) oder Config-Versionen (Forms/Flow/Branding). Reine
 * Präsentation: nimmt einen aufgelösten {@link ConfigDiffData} (Arrays) und rendert
 * je Eintrag ein Severity-Badge + Feld-Key + Alt→Neu-Werte.
 *
 * `compact` renders one dense code block instead of the cards, for a row of a log
 * (the audit log): per change the key, a `- ` line with the old value and a `+ ` line
 * with the new one. The values are JSON (a string in quotes). The order is changed,
 * added, removed. An empty diff shows the no-changes line inside the block.
 * `<app-config-diff [diff]="d" compact />`
 */
@Component({
  selector: 'app-config-diff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe, BadgeComponent],
  templateUrl: './config-diff.component.html',
  styleUrl: './config-diff.component.scss',
})
export class ConfigDiffComponent {
  /** Aufgelöster Diff (`null`/leer ⇒ »keine Änderungen«). */
  readonly diff = input<ConfigDiffData | null>(null);
  /** One dense code block (key, `-` old, `+` new) instead of the cards. */
  readonly compact = input(false, { transform: booleanAttribute });

  /** The changes of the compact view, in the order changed, added, removed. */
  protected readonly lines = computed<CompactLine[]>(() => {
    const d = this.diff();
    if (!d) return [];
    const code = (v: unknown): string => (v === undefined ? 'null' : JSON.stringify(v));
    return [
      ...d.changed.map((c) => ({ key: c.key, before: code(c.old), after: code(c.new) })),
      ...d.added.map((a) => ({ key: a.key, before: null, after: code(a.value) })),
      ...d.removed.map((r) => ({ key: r.key, before: code(r.value), after: null })),
    ];
  });

  protected isEmpty(d: ConfigDiffData | null): boolean {
    return !d || (d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0);
  }

  /** Wert lesbar machen (Objekte als JSON; null/undefined als »—«). */
  protected fmt(value: unknown): string {
    if (value === null || value === undefined) return '—';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}
