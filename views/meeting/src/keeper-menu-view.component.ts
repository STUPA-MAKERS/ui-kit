import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { Attendance, Meeting, Uuid } from './meeting.types';
import { registerUiKitTexts, UI_KIT_INTL, UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import type { UiKitTextKey } from '@stupa-makers/ui-kit';
import {
  AvatarComponent,
  ButtonComponent,
  ButtonGroupComponent,
  IconComponent,
  SearchPillComponent,
  TruncatedDirective,
} from '@stupa-makers/ui-kit';
import { personLabel } from './person-label.util';
import { UI_KIT_MEETING_TEXTS } from './meeting.texts';

/** One member of the picker. */
interface Candidate {
  readonly principalId: Uuid;
  readonly name: string;
  /** "Anwesend · führt das Protokoll". */
  readonly sub: string;
  readonly current: boolean;
}

/**
 * The minute-taker menu of the dock.
 *
 * A live meeting: the planned handover on top ("Uli Übernahme übernimmt ab TOP 4",
 * "Verwerfen"), then "Protokollführung übergeben an" with a member search and the
 * members who can keep the minutes. A pick opens the handover dialog, which asks when the
 * handover takes effect. A planned meeting: "Protokollführung zuweisen"; a pick names the
 * minute-taker at once.
 *
 * Only members with the gremium right `protocol.write` ("Protokoll führen") are in
 * the list; the server refuses any other with 422.
 */
@Component({
  selector: 'app-keeper-menu-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TruncatedDirective, SearchPillComponent, UiKitTranslatePipe, ButtonComponent, ButtonGroupComponent, IconComponent, AvatarComponent],
  templateUrl: './keeper-menu-view.component.html',
  styleUrl: './keeper-menu-view.component.scss',
  host: { '[class.km--sheet]': 'inSheet()' },
})
export class KeeperMenuViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_MEETING_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly meeting = input.required<Meeting>();
  readonly attendance = input.required<Attendance[]>();
  /** In a bottom sheet (surface 2) the field and the hover go one step down from the menu (surface 3). */
  readonly inSheet = input(false);

  /** A member was picked: the new minute-taker, or the current one (no change). */
  readonly pick = output<Uuid>();
  /** Discard the planned handover. */
  readonly discard = output<void>();

  protected readonly query = signal('');

  protected readonly live = computed(() => this.meeting().status === 'live');
  protected readonly heading = computed<UiKitTextKey>(() =>
    this.live() ? 'meetings.keeper.handTo' : 'meetings.keeper.assign',
  );

  /** "übernimmt ab TOP 4", or "übernimmt mit dem nächsten TOP" without a known number. */
  protected readonly plannedSub = computed(() => {
    const plan = this.meeting().plannedHandover;
    if (!plan) return '';
    return plan.fromPosition !== null
      ? this.i18n.translate('meetings.keeper.takesOverAt', {
          top: this.i18n.translate('meetings.agenda.top', { n: plan.fromPosition }),
        })
      : this.i18n.translate('meetings.keeper.takesOverNext');
  });

  protected readonly candidates = computed<Candidate[]>(() => {
    const m = this.meeting();
    const q = this.query().trim().toLowerCase();
    return this.attendance()
      .filter((a) => a.canKeepProtocol)
      .filter((a) => !q || [a.displayName, a.email].some((v) => v?.toLowerCase().includes(q)))
      .map((a) => {
        const current = a.principalId === m.protokollantId;
        const state = this.i18n.translate(
          a.status ? `meetings.attendance.${a.status}` : 'meetings.attendance.unknown',
        );
        const sub = current ? `${state} · ${this.i18n.translate('meetings.keeper.keeps')}` : state;
        return { principalId: a.principalId, name: personLabel(a, '—'), sub, current };
      });
  });

  /** A pick of the current minute-taker keeps everything as it is; the dock just closes. */
  protected choose(c: Candidate): void {
    this.pick.emit(c.principalId);
  }
}
