import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The five status colours of the design system, so the one accent colour keeps its
 * meaning:
 *
 * - `accent`: done and good, or running now (Bewilligt, Live, Bezahlt).
 * - `warn`: it waits for somebody (In Prüfung, Offen for an invoice).
 * - `error`: it failed or was refused (Abgelehnt, Fehlgeschlagen).
 * - `neutral`: an ordinary state (Eingereicht, Geplant, Geschlossen).
 * - `muted`: it is no longer relevant or not yet started (Abgebrochen).
 */
export type StatusKind = 'accent' | 'warn' | 'error' | 'neutral' | 'muted';

/**
 * A status as text in its colour: no dot, no pill, no plate. In the head of a page or a
 * detail (`chip`) it is a chip: the grey pill of `app-chip` with the text in its colour,
 * centred on its line (app spec 001305).
 *
 * The caller gives the label as content and the colour as `kind`. The host app maps
 * each of its states to a kind and a label:
 *
 * ```html
 * <app-status-text kind="warn">In Prüfung</app-status-text>
 * <app-status-text kind="accent" chip>Bewilligt</app-status-text>
 * ```
 *
 * A tag (a feature of a thing such as NÖ or Pool) is not a status. Use `app-badge` for it.
 */
@Component({
  selector: 'app-status-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'st',
    '[class]': "'st--' + kind()",
    '[class.st--chip]': 'chip()',
  },
  templateUrl: './status-text.component.html',
  styleUrl: './status-text.component.scss',
})
export class StatusTextComponent {
  /** The colour of the status. */
  readonly kind = input<StatusKind>('neutral');
  /** The status of a page or detail head: a chip instead of plain text. */
  readonly chip = input(false, { transform: booleanAttribute });
}
