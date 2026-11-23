import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import {
  registerUiKitTexts,
  SegBarComponent,
  UI_KIT_INTL,
} from "@stupa-makers/ui-kit";
import { UI_KIT_VOTING_TEXTS } from "./voting.texts";

/**
 * The turnout of an open vote: "14 von 19 Anwesenden haben abgestimmt", the percent and
 * a bar.
 *
 * Nobody sees an interim tally while the vote runs (no tally for the lead either). No
 * line explains when the counts show: they appear once every present member voted, or
 * after the close for a secret vote.
 *
 * A vote without a meeting has no attendance. Its turnout counts against the eligible
 * voters (`basis="eligible"`).
 *
 * `size="fat"` is the vote card of a meeting: a thicker bar, the line in body text and
 * the percent in the accent.
 */
@Component({
  selector: "app-vote-progress-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegBarComponent],
  host: {
    "[class.vp--fat]": "size() === 'fat'",
  },
  templateUrl: "./vote-progress-view.component.html",
  styleUrl: "./vote-progress-view.component.scss",
})
export class VoteProgressViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_VOTING_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  /** The ballots cast so far. */
  readonly voted = input.required<number>();
  /** The present members (or the eligible voters for `basis="eligible"`). */
  readonly total = input.required<number>();
  readonly basis = input<"present" | "eligible">("present");
  readonly size = input<"normal" | "fat">("normal");

  protected readonly percent = computed(() => {
    const total = this.total();
    return total > 0
      ? Math.min(100, Math.round((this.voted() / total) * 100))
      : 0;
  });

  protected readonly label = computed(() =>
    this.basis() === "eligible"
      ? this.i18n.translate("voting.progress.eligible", {
          voted: this.voted(),
          total: this.total(),
        })
      : this.i18n.translate("meetings.vote.progress", {
          voted: this.voted(),
          present: this.total(),
        }),
  );
}
