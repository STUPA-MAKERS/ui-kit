import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type {
  Attendance,
  AttendanceStatus,
  Delegation,
  LiveViewer,
  Meeting,
  Uuid,
} from './meeting.types';
import { MEETING_API } from './meeting-api';
import { registerUiKitTexts, UI_KIT_INTL, UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import type { UiKitTextKey } from '@stupa-makers/ui-kit';
import {
  AvatarComponent,
  ButtonComponent,
  ButtonGroupComponent,
  EmptyStateComponent,
  IconComponent,
  MEDIA,
  mediaQuery,
  RowMenuComponent,
  type RowMenuItem,
  type RowMenuSection,
  ScrollFadeDirective,
  SearchPillComponent,
  SideSheetComponent,
  type StatusKind,
  StatusTextComponent,
  ToastService,
  TruncatedDirective,
  ErrorTextComponent,
  SheetBodyDirective,
} from '@stupa-makers/ui-kit';
import { eligibleCount, isDelegate, presentCount } from './present-count.util';
import { SegmentedComponent, type SegmentedOption } from '@stupa-makers/ui-kit';
import { personLabel } from './person-label.util';
import { UI_KIT_MEETING_TEXTS } from './meeting.texts';

/** One attendance change. `note` is the reason of an excuse; omitted keeps the stored one. */
/** The context of an app part in the sheet: the meeting and the search text. */
export interface AttendanceSlot {
  readonly $implicit: Meeting;
  readonly query: string;
}

/** A change of the own delegation: the rows read the delegations again. */
export interface OwnDelegationChange {
  readonly kind: string;
  readonly delegatorId: Uuid;
}

export interface AttendanceChange {
  readonly member: Attendance;
  readonly status: AttendanceStatus;
  readonly note?: string | null;
}

/** A choice of the attendance control. `open` resets the record (lead only). */
type Choice = AttendanceStatus | 'open';

/** One option of the control of a row. */
interface ChoiceOption {
  readonly value: Choice;
  readonly label: UiKitTextKey;
  /** Why the option is not possible now, or `null`. */
  readonly blocked: UiKitTextKey | null;
}

/** A row of the sheet: the record, its sub line and its control. */
interface Row {
  readonly a: Attendance;
  readonly name: string;
  readonly sub: string;
  /** The options of the control, or `null` for a read-only row. */
  readonly options: readonly ChoiceOption[] | null;
  /** The chosen option. */
  readonly value: Choice;
  /** The read-only status text. */
  readonly readOnly: { readonly kind: StatusKind; readonly key: UiKitTextKey };
  readonly menu: readonly RowMenuSection[];
  /** The server refused "present" for this member; the delegation is in the way. */
  readonly conflict: Delegation | 'unknown' | null;
}

const LEAD_CHOICES: readonly { readonly value: Choice; readonly label: UiKitTextKey }[] = [
  { value: 'present', label: 'meetings.attendance.present' },
  { value: 'excused', label: 'meetings.attendance.excused' },
  { value: 'absent', label: 'meetings.attendance.absent' },
  { value: 'open', label: 'meetings.attendance.unknown' },
];

/** A member reports the own record as present or absent ("Abwesend" means excused). */
const SELF_CHOICES: readonly { readonly value: Choice; readonly label: UiKitTextKey }[] = [
  { value: 'present', label: 'meetings.attendance.selfPresent' },
  { value: 'excused', label: 'meetings.attendance.selfExcused' },
];

/**
 * The attendance sheet of a meeting.
 *
 * A side sheet from the end edge (a bottom sheet on a phone) with the counts, a member
 * search and one row per member: avatar, name, a sub line (the reason, "durch
 * Sitzungsleitung", "vertreten durch …") and the control.
 *
 * - The meeting lead (`canControl`) sets every row to "Anwesend / Entschuldigt /
 *   Unentschuldigt" and resets it to "Offen" (DELETE). The lead's record wins.
 * - A member reports only the own row, as "Anwesend / Abwesend", while the lead
 *   did not set it. Every other row is read-only.
 * - A member with an active delegation cannot be present. The option is disabled
 *   and says why; a 409 from the server marks the row and offers the revoke. A revoke
 *   of that delegation (here or in the own-delegation card) clears the mark.
 * - The arrow keys move the focus between the options only; Enter, Space or a click
 *   sets the state. So the keyboard sends no change for each step.
 * - The reason of an excuse shows only to the member and the lead (the server sends it
 *   to them only); the row menu edits it.
 * - A closed meeting freezes the attendance: every row is read-only.
 * - The row of the minute-taker says so in the sub line.
 * - While the meeting is live, the meeting lead (`canManage`) enters a substitute
 *   from the pool for a missing member (open, excused or absent, without a delegation):
 *   the row menu item "Vertretung eintragen" opens the picker. The row then says
 *   "vertreten durch …".
 * - A member who does not lead reads "abwesend" for an excuse and an absence, in the
 *   rows and in the counts.
 *
 * - A delegate holds the voting right of a member in the meeting. The row says "vertritt
 *   …"; the delegates who are no members follow the members as the section
 *   "Vertretungen". The lead sets their rows and a delegate reports the own row like a
 *   member (spec 003150).
 *
 * Below the members: the vote transfers of the meeting (the lead revokes one while the
 * meeting is live), the own delegation card and the people who have the meeting open.
 *
 * The delegation picker sits outside the side sheet, so that Escape in the picker does not close
 * the sheet.
 */
@Component({
  selector: 'app-attendance-sheet-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SheetBodyDirective,
    ErrorTextComponent,
    EmptyStateComponent,
    TruncatedDirective,
    SearchPillComponent,
    UiKitTranslatePipe,
    ButtonComponent,
    ButtonGroupComponent,
    IconComponent,
    AvatarComponent,
    RowMenuComponent,
    SideSheetComponent,
    StatusTextComponent,
    ScrollFadeDirective,
    SegmentedComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './attendance-sheet-view.component.html',
  styleUrl: './attendance-sheet-view.component.scss',
})
export class AttendanceSheetViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_MEETING_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);
  private readonly api = inject(MEETING_API, { optional: true });
  private readonly toast = inject(ToastService);

  /** A phone opens the sheet from the bottom. */
  protected readonly phone = mediaQuery(MEDIA.phone);

  readonly open = model(false);
  /** The protocol of the meeting is final or in its render. */
  readonly protocolLocked = input(false);
  readonly meeting = input.required<Meeting>();
  readonly attendance = input.required<Attendance[]>();
  readonly saving = input(false);
  /** Names of the people who have the meeting open (WS presence). */
  readonly viewers = input<readonly LiveViewer[]>([]);
  /** The member whose "present" the server refused with 409 `delegation_active`. */
  readonly conflictId = input<Uuid | null>(null);

  readonly statusChange = output<AttendanceChange>();
  /**
   * The lead resets a row to "open". The name is not `reset`: a native `reset` event of a
   * form in the sheet would bubble to the host and reach a `(reset)` binding.
   */
  readonly statusReset = output<Attendance>();
  /** The delegation of this member (the `conflictId`) was revoked; clear the mark. */
  readonly conflictResolved = output<Uuid>();
  /** The lead picked "Vertretung eintragen" for a missing member; the app opens its dialog. */
  readonly substitute = output<Attendance>();
  /** A revoke in the sheet changed the own delegation; the app reads its card again. */
  readonly ownReload = output<void>();

  /**
   * The admitted guests that the app has loaded for the lead of a public meeting, or `null`.
   * With a count the sheet shows the guest parts and the tabs Mitglieder | Gäste.
   */
  readonly guestCount = input<number | null>(null);
  /** The app part above the tabs: the join link and the join requests. */
  readonly guestsHead = input<TemplateRef<AttendanceSlot> | null>(null);
  /** The app part of the tab "Gäste": the guest list. */
  readonly guestList = input<TemplateRef<AttendanceSlot> | null>(null);
  /** The app part of the own delegation below the rows. */
  readonly ownDelegation = input<TemplateRef<AttendanceSlot> | null>(null);
  /** The tab of the lead: the members or the guests. */
  protected readonly tab = signal<'members' | 'guests'>('members');

  protected readonly query = signal('');
  /** The delegations of the meeting: all of them for the lead, else the own ones. */
  protected readonly delegations = signal<Delegation[]>([]);
  /** The row whose reason is being edited. */
  protected readonly editingNote = signal<Uuid | null>(null);
  protected readonly revoking = signal<Uuid | null>(null);
  /** The option that has the keyboard focus in a row (roving tab stop), or `null`. */
  private readonly focused = signal<{ id: Uuid; value: Choice } | null>(null);
  /** The reason field of the row in edit; it takes the focus when it appears. */
  private readonly noteInput = viewChild<ElementRef<HTMLInputElement>>('note');

  constructor() {
    effect(() => {
      const open = this.open();
      const id = this.meeting().id;
      this.conflictId();
      if (open) untracked(() => this.loadDelegations(id));
    });
    effect(() => {
      if (!this.open()) {
        untracked(() => {
          this.query.set('');
          this.editingNote.set(null);
        });
      }
    });
    effect(() => this.noteInput()?.nativeElement.focus());
  }

  /**
   * The lead sets every row. A closed meeting freezes the own report; the lead still
   * corrects a row until the protocol is final (§ 000951).
   */
  protected readonly lead = computed(() => this.meeting().canControl);
  protected readonly locked = computed(
    () => this.meeting().status === 'closed' && (!this.lead() || this.protocolLocked()),
  );
  /** The line below the title of the delegation dialog. */

  /** The guest part shows: the lead of a public meeting, with the list loaded. */
  protected readonly guestsActive = computed(
    () => this.guestCount() !== null,
  );
  /** The admitted guests: the loaded list of the lead, else the count of the meeting. */
  private readonly admittedGuests = computed(() =>
    this.guestCount() ?? this.meeting().admittedGuests,
  );
  /** "26 anwesend: 19 Mitglieder + 7 Gäste", or `null` without guests in the meeting. */
  protected readonly guestSummary = computed(() => {
    const m = this.meeting();
    if (!m.publicJoin && !this.admittedGuests()) return null;
    const members = presentCount(m, this.attendance());
    const guests = this.admittedGuests();
    return { total: members + guests, members, guests };
  });
  /** The tabs "Mitglieder 19 / 23" and "Gäste 7" (watch mode: "Gäste (zuschauend) 7"). */
  protected readonly tabs = computed<SegmentedOption[]>(() => {
    const present = presentCount(this.meeting(), this.attendance());
    const eligible = eligibleCount(this.meeting(), this.attendance());
    const watch = this.meeting().guestsMode === 'watch';
    return [
      {
        value: 'members',
        label: this.i18n.translate('guests.tab.members', { n: present, m: eligible }),
      },
      {
        value: 'guests',
        label: this.i18n.translate(watch ? 'guests.tab.guestsWatching' : 'guests.tab.guests', {
          n: this.admittedGuests(),
        }),
      },
    ];
  });

  setTab(value: string | null): void {
    if (value === 'members' || value === 'guests') this.tab.set(value);
  }

  /** The delegation of a member for this meeting, as the delegator. */
  private delegationOf(principalId: Uuid): Delegation | null {
    return this.delegations().find((d) => d.delegatorId === principalId) ?? null;
  }

  /** The delegations the lead manages: every delegation of the meeting. */
  protected readonly meetingDelegations = computed(() =>
    this.meeting().canManage ? this.delegations() : [],
  );

  protected readonly rows = computed<Row[]>(() => {
    const q = this.query().trim().toLowerCase();
    const t = (key: UiKitTextKey, params?: Record<string, string | number>) =>
      this.i18n.translate(key, params);
    return this.attendance()
      .filter((a) => !q || [a.displayName, a.email].some((v) => v?.toLowerCase().includes(q)))
      .map((a) => this.row(a, t));
  });

  /** The rows of the members; a delegate who is a member stays here (spec 003150). */
  protected readonly memberRows = computed(() =>
    this.rows().filter((r) => !(r.a.isMember === false && isDelegate(r.a))),
  );
  /** The rows of the delegates who are no members: the section "Vertretungen" (spec 003150). */
  protected readonly delegateRows = computed(() =>
    this.rows().filter((r) => r.a.isMember === false && isDelegate(r.a)),
  );

  /**
   * Some row has a row menu. Only then do the other rows keep a gap at the end, so that
   * all controls line up. Without a menu the control ends at the right inset of the row.
   */
  protected readonly anyMenu = computed(() => this.rows().some((r) => r.menu.length > 0));

  private row(
    a: Attendance,
    t: (key: UiKitTextKey, params?: Record<string, string | number>) => string,
  ): Row {
    const delegation = this.delegationOf(a.principalId);
    const represented = (a.represents ?? []).map((p) => p.displayName ?? '—').join(', ');
    const sub = [
      ...(represented ? [t('meetings.attendanceSheet.represents', { names: represented })] : []),
      ...(a.note ? [t('meetings.attendanceSheet.reason', { note: a.note })] : []),
      ...(delegation
        ? [t('meetings.attendanceSheet.representedBy', { name: delegation.delegateName ?? '—' })]
        : []),
      ...(delegation?.delegateVoting ? [t('meetings.attendanceSheet.withVote')] : []),
      ...(a.source === 'lead' ? [t('meetings.attendance.bySession')] : []),
      ...(a.principalId === this.meeting().protokollantId ? [t('meetings.keeper.keeps')] : []),
    ];

    const blocked: UiKitTextKey | null = delegation ? 'meetings.attendanceSheet.revokeFirst' : null;
    const choices = this.locked()
      ? null
      : this.lead()
        ? LEAD_CHOICES
        : a.isSelf && a.source !== 'lead'
          ? SELF_CHOICES
          : null;
    const options: readonly ChoiceOption[] | null =
      choices?.map((c) => ({ ...c, blocked: c.value === 'present' ? blocked : null })) ?? null;

    const conflict =
      this.conflictId() === a.principalId && a.status !== 'present' ? (delegation ?? 'unknown') : null;
    return {
      a,
      name: personLabel(a, '—'),
      sub: sub.join(' · '),
      options,
      value: a.status ?? 'open',
      readOnly: this.readOnly(a.status),
      menu: this.menuOf(a),
      conflict,
    };
  }

  /** The status text of a read-only row. A member reads "Abwesend" for an excuse. */
  private readOnly(status: AttendanceStatus | null): { kind: StatusKind; key: UiKitTextKey } {
    if (status === 'present') return { kind: 'accent', key: 'meetings.attendance.present' };
    if (status === null) return { kind: 'muted', key: 'meetings.attendance.unknown' };
    if (!this.lead()) return { kind: 'neutral', key: 'meetings.attendance.selfExcused' };
    return { kind: status === 'absent' ? 'warn' : 'neutral', key: `meetings.attendance.${status}` };
  }

  /**
   * The reason is editable on an excused row: by the member on the own row while the
   * lead did not set it; by the lead on a row the lead set and on the own row. A save
   * from the lead takes the record over, so a member's own reason stays the
   * member's.
   */
  private noteEditable(a: Attendance): boolean {
    if (this.locked() || a.status !== 'excused') return false;
    if (this.lead()) return a.source === 'lead' || a.isSelf;
    return a.isSelf && a.source !== 'lead';
  }

  /**
   * The lead enters a substitute for a missing member while the meeting is live. A
   * member who is present, or who already has a delegation, needs none. The server
   * refuses a member without an own vote and a member who already substitutes another
   * member in this meeting (no chains), so the action is not offered for them.
   */
  private substitutable(a: Attendance): boolean {
    const m = this.meeting();
    return (
      m.status === 'live' &&
      m.canManage &&
      !a.isSelf &&
      a.status !== 'present' &&
      a.canVote !== false &&
      this.delegationOf(a.principalId) === null &&
      !this.delegations().some((d) => d.delegateId === a.principalId)
    );
  }

  private menuOf(a: Attendance): readonly RowMenuSection[] {
    const substitute: RowMenuItem = {
      id: 'substitute',
      label: this.i18n.translate('meetings.leadSubstitute.action'),
      icon: 'repeat',
    };
    const note: RowMenuItem = {
      id: 'note',
      label: this.i18n.translate(
        a.note ? 'meetings.attendanceSheet.editReason' : 'meetings.attendanceSheet.addReason',
      ),
      icon: 'edit',
    };
    const items = [
      ...(this.substitutable(a) ? [substitute] : []),
      ...(this.noteEditable(a) ? [note] : []),
    ];
    return items.length ? [{ items }] : [];
  }

  protected choose(row: Row, option: ChoiceOption): void {
    if (option.blocked || this.saving() || option.value === row.value) return;
    if (option.value === 'open') {
      this.statusReset.emit(row.a);
      return;
    }
    this.statusChange.emit({ member: row.a, status: option.value });
  }

  /**
   * The arrow keys move the focus to the next option; a blocked option is skipped. They
   * do not set the state: each step would send a change (and a reset on "Offen"), and a
   * lead's change takes a member's own report over. Enter, Space or a click sets it.
   */
  protected onKey(event: KeyboardEvent, row: Row, index: number): void {
    const options = row.options;
    if (!options) return;
    const dir = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    event.preventDefault();
    const steps = Array.from({ length: options.length }, (_, i) => i + 1);
    const next = steps
      .map((i) => (index + dir * i + options.length) % options.length)
      .find((k) => !options[k].blocked);
    if (next === undefined) return;
    const group = (event.currentTarget as HTMLElement).parentElement;
    this.focused.set({ id: row.a.principalId, value: options[next].value });
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }

  /**
   * The tab stop of a row: the option the arrow keys moved to, else the chosen one. So
   * Tab leaves the row from where the focus is, and comes back to the chosen option.
   * When no option has that value (the own row of a member is "open", and the member
   * has no "Offen" option), the first option that is not blocked is the tab stop. So
   * the control always has one tab stop.
   */
  protected tabStop(row: Row, option: ChoiceOption): 0 | -1 {
    const options = row.options ?? [];
    const f = this.focused();
    const value = f?.id === row.a.principalId ? f.value : row.value;
    const stop =
      options.find((o) => o.value === value) ?? options.find((o) => !o.blocked) ?? options[0];
    return option === stop ? 0 : -1;
  }

  /** The focus left the control of a row: its tab stop is the chosen option again. */
  protected onFocusOut(event: FocusEvent, row: Row): void {
    const group = event.currentTarget as HTMLElement;
    if (group.contains(event.relatedTarget as Node | null)) return;
    if (this.focused()?.id === row.a.principalId) this.focused.set(null);
  }

  protected onMenu(row: Row, item: RowMenuItem): void {
    if (item.id === 'note') this.editingNote.set(row.a.principalId);
    else if (item.id === 'substitute') this.substitute.emit(row.a);
  }

  /** The lead entered a substitute in the dialog of the app; the row shows "vertreten durch …". */
  substituted(): void {
    this.loadDelegations(this.meeting().id);
  }

  /** Save a changed reason. An empty field removes it. */
  protected saveNote(a: Attendance, value: string): void {
    if (this.editingNote() !== a.principalId) return;
    this.editingNote.set(null);
    const note = value.trim() || null;
    if (note === a.note) return;
    this.statusChange.emit({ member: a, status: 'excused', note });
  }

  protected cancelNote(event: Event): void {
    event.stopPropagation();
    this.editingNote.set(null);
  }

  /** Revoke a delegation of the meeting (the lead while live, or the delegator). */
  protected revoke(d: Delegation): void {
    if (this.revoking() || !this.api) return;
    this.revoking.set(d.id);
    this.api.revokeDelegation(d.id).subscribe({
      next: () => {
        this.revoking.set(null);
        this.toast.show(this.i18n.translate('delegation.toast.revoked'), 'success');
        this.loadDelegations(this.meeting().id);
        this.ownReload.emit();
        this.resolveConflict(d.delegatorId);
      },
      error: () => {
        this.revoking.set(null);
        this.toast.show(this.i18n.translate('delegation.toast.revokeFailed'), 'error');
      },
    });
  }

  /** The own delegation changed in the card of the app: the rows load the delegations again. */
  delegationChanged(change: OwnDelegationChange): void {
    this.loadDelegations(this.meeting().id);
    if (change.kind === 'revoked') this.resolveConflict(change.delegatorId);
  }

  /** A revoked delegation of the refused member ends the delegation conflict of the row. */
  private resolveConflict(delegatorId: Uuid): void {
    if (this.conflictId() === delegatorId) this.conflictResolved.emit(delegatorId);
  }

  protected delegationLine(d: Delegation): string {
    return `${d.delegatorName ?? '—'} → ${d.delegateName ?? '—'}`;
  }

  private loadDelegations(meetingId: Uuid): void {
    if (!this.api) return;
    this.api.listDelegations(meetingId).subscribe({
      next: (rows) => {
        if (this.meeting().id === meetingId) this.delegations.set(rows.filter((d) => d.meetingId === meetingId));
      },
      error: () => this.delegations.set([]),
    });
  }
}
