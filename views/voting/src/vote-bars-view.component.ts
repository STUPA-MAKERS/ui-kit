import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { VoteResult } from './voting.types';
import { voteResultStatus, type StatusView } from './voting-status';
import { voteOptionLabel } from './voting-display.util';
import {
  registerUiKitTexts,
  SegBarComponent,
  type SegTone,
  StatusTextComponent,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import { UI_KIT_VOTING_TEXTS } from './voting.texts';

interface BarRow {
  readonly option: string;
  readonly label: string;
  readonly count: number;
  /** Share of the cast ballots, rounded to whole percent. */
  readonly pct: number;
  readonly tone: SegTone;
}

/** Ja in the accent, Nein in the error colour, Enthaltung grey. */
const TONES: Readonly<Record<string, SegTone>> = { yes: 'filled', no: 'error', abstain: 'muted' };

/**
 * The result of a vote: one row per option with the count, the share of the cast
 * ballots and a bar, and above them the result as status text.
 *
 * "Angenommen" takes the accent, "Abgelehnt" the error colour. A tie is a rejection:
 * the server has no tie break, so `tie` shows as "Abgelehnt". A missed quorum
 * adds "Quorum nicht erreicht".
 *
 * The vote page, the live page and the beamer share this component. It shows
 * aggregated counts only, never a name. Pass counts only when the server revealed them.
 */
@Component({
  selector: 'app-vote-bars-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegBarComponent, StatusTextComponent, UiKitTranslatePipe],
  host: {
    '[class.bars--beamer]': "variant() === 'beamer'",
  },
  templateUrl: './vote-bars-view.component.html',
  styleUrl: './vote-bars-view.component.scss',
})
export class VoteBarsViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_VOTING_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly options = input.required<readonly string[]>();
  readonly counts = input.required<Readonly<Record<string, number>>>();
  /** The result of a closed vote. Without it the component shows no status line. */
  readonly result = input<VoteResult | string | null>(null);
  /** Why a closed vote failed. `quorum` adds "Quorum nicht erreicht". */
  readonly failedReason = input<'quorum' | 'majority' | null | undefined>(null);
  readonly variant = input<'compact' | 'beamer'>('compact');

  /** All cast ballots: the base of the shares. */
  protected readonly cast = computed(() =>
    this.options().reduce((sum, o) => sum + (this.counts()[o] ?? 0), 0),
  );

  protected readonly rows = computed<readonly BarRow[]>(() => {
    const counts = this.counts();
    const cast = this.cast();
    return this.options().map((option) => {
      const count = counts[option] ?? 0;
      return {
        option,
        label: voteOptionLabel(option, (key) => this.i18n.translate(key)),
        count,
        pct: cast > 0 ? Math.round((count / cast) * 100) : 0,
        tone: TONES[option] ?? 'filled',
      };
    });
  });

  /** The status line. Every result that is not `passed` is a rejection. */
  protected readonly status = computed<StatusView | null>(() => {
    const result = this.result();
    if (!result) return null;
    return voteResultStatus(result === 'passed' ? 'passed' : 'rejected');
  });

  protected rowLabel(row: BarRow): string {
    return this.i18n.translate('voting.bars.row', {
      option: row.label,
      count: row.count,
      pct: row.pct,
    });
  }
}
