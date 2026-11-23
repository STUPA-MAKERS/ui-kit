import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import type { PollConfig, PollResult } from "./voting.types";
import type { Translate } from "./voting-display.util";
import {
  registerUiKitTexts,
  SegBarComponent,
  type SegTone,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from "@stupa-makers/ui-kit";
import { POLL_ABSTAIN, type PollBar, pollBars } from "./poll.util";
import { UI_KIT_VOTING_TEXTS } from "./voting.texts";

/**
 * The result of a poll ("Umfrage"): the options by votes, highest first. Every tied
 * top option gets the filled bar. A date poll counts Ja and Vielleicht per
 * date ("3 (+2)", sorted by Ja, then by Ja plus Vielleicht) and
 * explains the numbers ("Zahl = Ja, (+n) = Vielleicht"). The footer counts the answers:
 * "n von m haben geantwortet". A poll lists counts only,
 * never a name.
 */
@Component({
  selector: "app-poll-result-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegBarComponent, UiKitTranslatePipe],
  host: {
    "[class.bars--beamer]": "variant() === 'beamer'",
  },
  templateUrl: "./poll-result-view.component.html",
  styleUrls: [
    "./vote-bars-view.component.scss",
    "./poll-result-view.component.scss",
  ],
})
export class PollResultViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_VOTING_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly poll = input.required<PollConfig>();
  /** The counts of the server: stored at the close, live once revealed. */
  readonly result = input<PollResult | null>(null);
  /** The revealed counts of the tally, as a fallback without `result`. */
  readonly counts = input<Readonly<Record<string, number>>>({});
  /** The answers and the eligible persons of the footer. */
  readonly answered = input(0);
  readonly total = input(0);
  readonly variant = input<"compact" | "beamer">("compact");

  private readonly t: Translate = (key, params) =>
    this.i18n.translate(key, params);

  protected readonly date = computed(() => this.poll().mode === "date");
  protected readonly bars = computed<readonly PollBar[]>(() =>
    pollBars(
      this.poll(),
      this.result(),
      this.counts(),
      this.i18n.formatLocale(),
      this.t,
    ),
  );
  /** The base of the bars: the ballots of a date poll, else every vote and abstention. */
  protected readonly base = computed(() => {
    if (this.date())
      return Math.max(this.result()?.ballots ?? 0, this.answered());
    return this.bars().reduce((sum, b) => sum + b.count, 0);
  });
  protected readonly footer = computed(() =>
    this.t("poll.result.footer", { n: this.answered(), m: this.total() }),
  );

  protected pct(bar: PollBar): number {
    const base = this.base();
    return base > 0 ? Math.round((bar.count / base) * 100) : 0;
  }

  protected tone(bar: PollBar): SegTone {
    if (bar.id === POLL_ABSTAIN) return "muted";
    return bar.top ? "filled" : "second";
  }

  protected barLabel(bar: PollBar): string {
    if (bar.maybe !== null) {
      return this.t("poll.result.dateRow", {
        option: bar.label,
        yes: bar.count,
        maybe: bar.maybe,
      });
    }
    return this.t("voting.bars.row", {
      option: bar.label,
      count: bar.count,
      pct: this.pct(bar),
    });
  }
}
