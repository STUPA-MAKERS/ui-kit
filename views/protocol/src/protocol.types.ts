/**
 * The view models of the protocol views (S/framework/views/002273): copies of the meeting types
 * of STUPA-Workflow, so the app passes its API objects as they are. One view entry must not import
 * another (002215), so these copy the types of the meeting views.
 */
export type Uuid = string;
/** An ISO 8601 timestamp with offset. */
export type IsoDateTime = string;

export type MeetingStatus = 'planned' | 'live' | 'closed';

export interface CurrentAgendaItem {
  /** 1-based number in the agenda order ("TOP 3"). */
  readonly position: number;
  readonly title: string | null;
}

export type VoteResult = 'passed' | 'rejected' | 'tie' | 'elected' | 'runoff' | 'no_majority';

export interface PollResult {
  /** Votes per option id. A date poll counts the Ja answers here. */
  readonly counts: Readonly<Record<string, number>>;
  /** A date poll: the Vielleicht answers per option id. */
  readonly maybe?: Readonly<Record<string, number>> | null;
  readonly abstentions: number;
  readonly ballots: number;
  /** The option ids, highest first. */
  readonly order: readonly string[];
  /** The options with the most votes (every tied one); empty without a vote. */
  readonly top: readonly string[];
}

export type VoteKind = 'motion' | 'election' | 'poll' | 'circular';

export interface ElectionLot {
  readonly among: readonly string[];
  readonly seats: number;
  readonly drawn: readonly string[] | null;
  readonly at?: IsoDateTime | null;
  readonly by?: string | null;
  readonly byName?: string | null;
}

export interface ElectionRunoff {
  readonly candidateIds: readonly string[];
  readonly seats: number;
  readonly voteId?: Uuid | null;
}

export interface ElectionResult {
  /** Votes per candidate id (`yes`/`no` for a single candidate). */
  readonly counts: Readonly<Record<string, number>>;
  readonly abstentions: number;
  readonly ballots: number;
  readonly yes?: number | null;
  readonly no?: number | null;
  /** The elected candidate ids, best first. */
  readonly elected: readonly string[];
  readonly runoff?: ElectionRunoff | null;
  readonly lot?: ElectionLot | null;
  /** The lot for a place in the third Wahlgang, after a tie for the second place. */
  readonly nextRoundLot?: ElectionLot | null;
}

export type PollMode = 'single' | 'multi' | 'date';

export interface PollOption {
  readonly id: string;
  readonly label?: string | null;
  readonly start?: IsoDateTime | null;
  readonly end?: IsoDateTime | null;
}

export interface PollConfig {
  readonly mode: PollMode;
  readonly options: readonly PollOption[];
  /** A multi poll: the most options of one ballot. `null` = every option. */
  readonly maxChoices?: number | null;
  readonly secret: boolean;
  readonly guestsVote?: boolean;
}

export interface Quorum {
  readonly type: 'count' | 'percent';
  readonly value: number;
}

export interface ElectionCandidate {
  readonly id: string;
  readonly name: string;
  /** The account of the candidate, or `null` for a free name. */
  readonly principalId?: Uuid | null;
  /** The DSGVO erasure removed the name (`name` then holds the German placeholder
   *  "Gelöscht"): the UI shows `election.candidate.erased` instead. Only the server
   *  sets it. */
  readonly erased?: boolean;
}

export interface ElectionConfig {
  readonly seats: number;
  readonly candidates: readonly ElectionCandidate[];
  readonly secret: boolean;
  readonly quorum?: Quorum | null;
  readonly abstainCountsQuorum?: boolean;
  readonly guestsVote?: boolean;
  /** `members_majority` (one seat): the elected candidate needs more votes than half
   *  of the eligible members. */
  readonly majorityRule?: 'relative' | 'members_majority';
}

export interface ElectionFields {
  readonly kind?: VoteKind;
  readonly election?: ElectionConfig | null;
  readonly electionResult?: ElectionResult | null;
  /** The election that this runoff continues. */
  readonly parentVoteId?: Uuid | null;
  /** The number of the Wahlgang: 1 for the first one. */
  readonly round?: number;
  /** A poll: its mode and options. */
  readonly poll?: PollConfig | null;
  /** A poll: the counts once closed, or while open once revealed. */
  readonly pollResult?: PollResult | null;
}

export type MajorityRule =
  | 'simple'
  | 'absolute'
  | 'two_thirds'
  | 'members_majority'
  | 'members_two_thirds';

export type VoteStatus = 'draft' | 'open' | 'closed' | 'cancelled';

export type DateAnswer = 'yes' | 'maybe' | 'no';

export interface MyBallot {
  readonly cast: boolean;
  readonly choice: string | null;
  /** The chosen candidate ids of an open election ballot, or the chosen option
   *  ids of an open single or multi poll. */
  readonly choices?: readonly string[] | null;
  /** The answers of an open date poll ballot. */
  readonly answers?: Readonly<Record<string, DateAnswer>> | null;
}

export interface VoteConfig {
  readonly options: readonly string[];
  readonly majorityRule: MajorityRule;
  readonly quorum?: Quorum | null;
  /** `present`: the quorum of a meeting vote counts the present persons, not the ballots. */
  readonly quorumBasis?: 'ballots' | 'present';
  /** The least number of present persons of the Gremium, copied to the vote. */
  readonly quorumMinPresent?: number | null;
  readonly abstainCountsQuorum?: boolean;
  readonly secret?: boolean;
  /** Admitted guests of a public meeting vote too: no quorum, majority of the cast votes. */
  readonly guestsVote?: boolean;
}

export interface Tally {
  readonly counts: Readonly<Record<string, number>>;
  readonly eligible: number;
  readonly quorumMet: boolean;
  readonly leading: string | null;
  readonly result?: VoteResult | null;
  /** Turnout: the ballots cast so far. The server always sends it, also while the
   *  counts stay hidden. */
  readonly voted?: number;
  /** The present members of the meeting (the reveal denominator). It is 0 for a vote
   *  without a meeting and for a closed vote. */
  readonly present?: number;
  /** `counts` and `leading` are visible: the vote is closed, or it is open, not secret
   *  and every present member voted (a vote without a meeting is always visible).
   *  Otherwise `counts` is empty. */
  readonly revealed?: boolean;
  /** Why a closed vote failed: `quorum` or `majority`. `null` while open, on a pass and
   *  on a tie. */
  readonly failedReason?: 'quorum' | 'majority' | null;
  /** The present members and the admitted guests: live while open, fixed at the close.
   *  `null` for a vote that closed before public meetings existed. */
  readonly presentMembers?: number | null;
  readonly presentGuests?: number | null;
}

export interface Vote extends ElectionFields {
  readonly id: Uuid;
  /** `null` marks a motion on a free-text agenda item, with no application. */
  readonly applicationId: Uuid | null;
  /** The meeting that holds the vote. `null` marks a standalone (async) vote.
   *  A meeting-bound vote is deleted through its meeting, never through
   *  `DELETE /votes/{id}` (that route answers 409). */
  readonly meetingId?: Uuid | null;
  /** The agenda item of a meeting vote. The page reads its number ("TOP 3") from the
   *  agenda. */
  readonly agendaItemId?: Uuid | null;
  /** The motion of a meeting vote. A standalone vote often has none. */
  readonly question?: string | null;
  /** The version of a Haushaltsplan whose step the vote decides, else `null`. */
  readonly planVersionId?: Uuid | null;
  readonly eligibleGroup: string;
  readonly config: VoteConfig;
  readonly status: VoteStatus;
  readonly opensAt: IsoDateTime | null;
  /** The planned end of the cast window (a deadline), not the real end. */
  readonly closesAt: IsoDateTime | null;
  readonly result: VoteResult | null;
  /** `objection`: a member objected to the Umlaufverfahren, which cancelled it. */
  readonly cancelReason?: 'objection' | null;
  readonly secret: boolean;
  /** Copies of `config.majorityRule` and `config.quorum` for the vote card. */
  readonly majorityRule?: MajorityRule;
  readonly quorum?: Quorum | null;
  /** The real moment when the vote opened. */
  readonly openedAt?: IsoDateTime | null;
  /** The real moment when the vote ended (close or cancel). `null` while it runs. */
  readonly closedAt?: IsoDateTime | null;
  readonly tally: Tally;
  /** The own ballot of the caller. Only `GET /votes/{id}` sets it. */
  readonly myBallot?: MyBallot | null;
  /** Admitted guests vote too: no quorum, the majority of the cast votes decides. */
  readonly guestsVote?: boolean;
  /** The caller cast the ballot of a delegator in this vote. Only `GET /votes/{id}`
   *  sets it. */
  readonly representedCast?: boolean;
  /** The caller may open, close, cancel and delete the vote: the admin role, or the
   *  gremium permission `vote.manage` or `session.manage` in the gremium of the vote.
   *  Only `GET /votes/{id}` sets it. */
  readonly canManage?: boolean;
  /** The caller may cast an own ballot: the gremium permission `vote.cast` in the
   *  gremium of the vote, in a browser session. A delegated ballot has its own check.
   *  Only `GET /votes/{id}` sets it. */
  readonly canCast?: boolean;
}

export type MeetingVoteStatus = 'draft' | 'open' | 'closed' | 'cancelled';

export interface MeetingVote extends ElectionFields {
  readonly id: Uuid;
  /** `null` marks a generic motion on a free-text agenda item. */
  readonly applicationId: Uuid | null;
  /** The agenda item the vote belongs to. */
  readonly agendaItemId: Uuid | null;
  readonly title: string | null;
  readonly question: string | null;
  readonly options: readonly string[];
  readonly status: MeetingVoteStatus;
  readonly result: string | null;
  readonly counts: Readonly<Record<string, number>> | null;
  readonly leading: string | null;
  readonly closesAt: IsoDateTime | null;
  /** Participation progress: members who voted against members present.
   *  `revealed` tells whether `counts` and `leading` are visible. If not, the
   *  frontend shows the progress only. */
  readonly voted: number;
  readonly present: number;
  readonly revealed: boolean;
  /** Reason for the rejection. `quorum` means the vote missed the quorum.
   *  `majority` means the vote missed the majority. */
  readonly failedReason: 'quorum' | 'majority' | null;
  /** The own ballot of the caller. A secret vote gives only `cast`. `null` when the
   *  server sent none (for example a broadcast). */
  readonly myBallot?: MyBallot | null;
  /** The rules of the vote, for the vote card. A vote that a WS event added
   *  before the next GET has none of them. */
  readonly majorityRule?: MajorityRule;
  readonly secret?: boolean;
  readonly quorum?: Quorum | null;
  /** The real open time, and the real end time (close or cancel). */
  readonly openedAt?: IsoDateTime | null;
  readonly closedAt?: IsoDateTime | null;
  /** Admitted guests vote too: no quorum, majority of the cast votes. */
  readonly guestsVote?: boolean;
  /** Present members and admitted guests ("19 Mitglieder + 7 Gäste anwesend"). */
  readonly presentMembers?: number | null;
  readonly presentGuests?: number | null;
  /** The decision proposal of an application vote, for the edit of a prepared vote. */
  readonly proposal?: unknown | null;
  /** A repeat ("Erneut abstimmen"): the closed vote of the same agenda item it repeats. */
  readonly repeatOfId?: Uuid | null;
  /** The number of the vote in its repeat chain: 2 for the first repeat. */
  readonly attempt?: number;
}

export type MeetingForm = 'presence' | 'hybrid' | 'video';

export type GuestsMode = 'vote' | 'watch';

export interface KeeperPeriod {
  readonly principalId: Uuid;
  readonly name: string | null;
  readonly fromAt: IsoDateTime | null;
  readonly toAt: IsoDateTime | null;
  readonly fromAgendaItemId: Uuid | null;
  readonly toAgendaItemId: Uuid | null;
  readonly fromPosition: number | null;
  readonly toPosition: number | null;
}

export type MeetingKind = 'ordinary' | 'extraordinary' | 'repeat' | 'constituent';

export interface Meeting {
  readonly id: Uuid;
  readonly title: string;
  /** Planned meeting date (`YYYY-MM-DD`) or `null`. */
  readonly date: string | null;
  /** Planned time (`HH:mm`) or `null`. */
  readonly startTime: string | null;
  /** Planned end time (`HH:mm`) or `null`. */
  readonly endTime: string | null;
  readonly status: MeetingStatus;
  readonly activeApplicationId: Uuid | null;
  /** The agenda item the room handles now ("Jetzt"). Followers and the beamer follow it. */
  readonly currentAgendaItemId: Uuid | null;
  /** Number (1-based, in agenda order) and title of the current agenda item. */
  readonly currentAgendaItem?: CurrentAgendaItem | null;
  /** Number of items on the agenda. */
  readonly agendaItemCount?: number;
  /** The real start. The start sets it once. `null` before the start, and for a
   *  meeting that started before the field existed: show the planned start then. */
  readonly startedAt?: IsoDateTime | null;
  /** The close sets it. */
  readonly closedAt?: IsoDateTime | null;
  readonly gremiumId: Uuid | null;
  /** Name of the gremium. The timeline shows it. */
  readonly gremiumName: string | null;
  readonly votes: readonly MeetingVote[];
  readonly protocolId: Uuid | null;
  readonly createdAt: IsoDateTime;
  readonly protokollantId: Uuid | null;
  readonly protokollantName: string | null;
  /** True if the logged-in user is the assigned protokollant of this meeting. */
  readonly isProtokollant: boolean;
  /** Master flag. True if the user may run the meeting: protocol, agenda, status. */
  readonly canControl: boolean;
  /** Manage the meeting: create it, plan it and assign the protokollant. */
  readonly canManage: boolean;
  /** Write the protocol and the agenda. The assigned protokollant or a manager may. */
  readonly canWrite: boolean;
  /** Open and close motions. */
  readonly canManageVotes: boolean;
  /** Eligible to vote in this meeting. */
  readonly canVote: boolean;
  /** Finalize and send the protocol: write access plus the gremium permission
   *  `protocol.finalize`. */
  readonly canFinalize: boolean;
  /** Delete the meeting: `canManage`, and `meeting.delete_finalized` for a final protocol.
   *  The server sets it, because the client does not know the protocol status. */
  readonly canDelete: boolean;
  /** The periods of the protocol keepers, running and ended, in time order. */
  readonly keeperPeriods: readonly KeeperPeriod[];
  /** The handover planned for the next agenda item, or `null`. */
  readonly plannedHandover: KeeperPeriod | null;
  /** Public participation over a QR code is on. */
  readonly publicJoin: boolean;
  /** Admitted guests vote or only follow the meeting. */
  readonly guestsMode: GuestsMode;
  /** The join code, for the meeting lead only (`null` for everybody else). */
  readonly joinCode: string | null;
  /** The guests admitted now. */
  readonly admittedGuests: number;
  /** The open join requests (meeting lead only, else 0). */
  readonly pendingGuests: number;
  /** The present count fixed at the close (000946); `null` while the meeting is not closed. */
  readonly presentCount?: number | null;
  /** The members with a voting right, fixed at the close; `null` while not closed. */
  readonly eligibleCount?: number | null;
  /** The pool substitutes on a seat who are no present member with a voting right. */
  readonly presentSeats?: number;
  /** Guests can get a ballot: the Gremium has the switch on and no quorum. */
  readonly guestsVoteAllowed: boolean;
  /** The kind of the meeting. Only a planned meeting changes it. */
  readonly kind: MeetingKind;
  /** The first meeting of a `repeat` meeting (000940), else `null`. */
  readonly repeatOfId?: Uuid | null;
  /** The place of the meeting, or `null`. */
  readonly location: string | null;
  /** The form of the meeting. */
  readonly form: MeetingForm;
  /** The earliest open of a planned meeting with a date (ISO, UTC), else `null`. */
  readonly opensAt: IsoDateTime | null;
}

export type I18nMap = Readonly<Record<string, string>>;

export interface AgendaItem {
  readonly id: Uuid;
  /** `null` for a free-text agenda item (no application). */
  readonly applicationId: Uuid | null;
  /** The to-do card that the item was made from, or `null`. */
  readonly todoId?: Uuid | null;
  /** The version of a Haushaltsplan that the item decides, or `null`. */
  readonly planVersionId?: Uuid | null;
  /** The plan of the item is a draft: the meeting reads it and takes no vote on it. */
  readonly planReading?: boolean;
  /** The own title of the item, else the title of its application. */
  readonly title: string | null;
  /** The title of the application. `null` for a free-text item. */
  readonly applicationTitle?: string | null;
  /** Markdown text of this agenda item. Each item has its own editor. */
  readonly body?: string | null;
  readonly position: number;
  /** Non-public. The public protocol PDF redacts this agenda item. */
  readonly nonPublic?: boolean;
  /** The done mark ("TOP abhaken"): the time of the tick, or `null`. Set by hand only. */
  readonly doneAt?: string | null;
  /** The time of the first move of the live meeting to the item (§ 000870), or `null`. */
  readonly startedAt?: IsoDateTime | null;
  /** The estimated duration in minutes (§ 001140), or `null`. */
  readonly estimatedMinutes?: number | null;
  readonly stateLabel?: I18nMap | null;
  /** The requested amount of the application, for the decision proposal. */
  readonly amount?: string | null;
}

export type AttendanceStatus = 'present' | 'excused' | 'absent';

export interface Attendance {
  readonly principalId: Uuid;
  readonly displayName: string | null;
  readonly email: string | null;
  /** `null` = not recorded yet ("open"). */
  readonly status: AttendanceStatus | null;
  /** Who set the record. A `lead` record wins: the member cannot change it. */
  readonly source: 'self' | 'lead' | null;
  /**
   * The reason of an excuse. The server sends it only to the member and to the
   * meeting lead (`canWrite`). All other readers get `null`.
   */
  readonly note: string | null;
  /** True if this row is the requesting user. It enables self-marking. */
  readonly isSelf: boolean;
  /** The member holds `protocol.write` in the gremium and can keep the minutes. */
  readonly canKeepProtocol?: boolean;
  /**
   * The member has an own vote now (gremium permission `vote.cast`). Only such a member
   * can be substituted. An older server leaves the flag out.
   */
  readonly canVote?: boolean;
  /**
   * The end of the late-excuse window: only on the own `absent` row of a closed meeting
   * while the window is open (§ 000922).
   */
  readonly lateExcuseUntil?: string | null;
}

export interface Delegation {
  readonly id: Uuid;
  readonly meetingId: Uuid;
  readonly meetingTitle: string | null;
  readonly meetingDate: string | null;
  readonly gremiumId: Uuid;
  readonly gremiumName: string | null;
  readonly delegatorId: Uuid;
  readonly delegatorName: string | null;
  readonly delegateId: Uuid;
  readonly delegateName: string | null;
  readonly delegateVoting: boolean;
  readonly viaPool: boolean;
  readonly createdAt: IsoDateTime;
  /** True while revocation is possible: meeting `planned` and before the start. */
  readonly revocable: boolean;
  /** Direction from the view of the caller. `null` = not involved (admin view). */
  readonly direction: 'outgoing' | 'incoming' | null;
}

export interface LiveViewer {
  readonly id: string | null;
  readonly name: string;
}

/** The protocol of a meeting. */
export interface Protocol {
  readonly id: Uuid;
  readonly meetingId: Uuid;
  readonly markdown: string;
  readonly status: 'draft' | 'rendering' | 'final';
  readonly isFinal: boolean;
  /** Not editable. The protocol is final, or the worker renders it (`rendering`). */
  readonly isLocked: boolean;
  readonly pdfUrl: string | null;
  /** Redacted public variant for non-public agenda items. Otherwise null. */
  readonly publicPdfUrl: string | null;
  readonly sentAt: IsoDateTime | null;
  /** The final protocol went out after its last finalization (STUPA-Workflow:003019). */
  readonly isSent?: boolean;
  /** Held back from the public protocol page (only matters for a public gremium). */
  readonly publicWithheld?: boolean;
  /** The gremium publishes its final protocols on the public protocol page. */
  readonly gremiumProtocolsPublic?: boolean;
  /** The time of the mark "genehmigt", `null` without a mark (§ 000924). */
  readonly approvedAt?: IsoDateTime | null;
  /** The meeting that approved the protocol. */
  readonly approvedMeetingId?: Uuid | null;
  readonly approvedMeetingTitle?: string | null;
  readonly approvedMeetingDate?: string | null;
  /** The last send of the draft by mail, `null` without a send (§ 000937). */
  readonly draftSentAt?: IsoDateTime | null;
}
