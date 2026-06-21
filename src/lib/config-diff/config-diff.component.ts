import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import type { ConfigDiffData } from './config-diff.types';

/**
 * Feld-Diff-Renderer (added/removed/changed) — z. B. für Antrags-Historie
 * (Submission-Versionen) oder Config-Versionen (Forms/Flow/Branding). Reine
 * Präsentation: nimmt einen aufgelösten {@link ConfigDiffData} (Arrays) und rendert
 * je Eintrag ein Severity-Badge + Feld-Key + Alt→Neu-Werte.
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

  protected isEmpty(d: ConfigDiffData | null): boolean {
    return !d || (d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0);
  }

  /** Wert lesbar machen (Objekte als JSON; null/undefined als »—«). */
  protected fmt(value: unknown): string {
    if (value === null || value === undefined) return '—';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}
