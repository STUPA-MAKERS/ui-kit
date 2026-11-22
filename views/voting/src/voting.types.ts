/*
 * The view models of the voting views (S/framework/views/002274): the vote types of
 * STUPA-Workflow with the same fields, so the app passes its API objects as they are.
 */

export type Uuid = string;

export type IsoDateTime = string;

/** Uniform problem object (close to RFC 9457). */
export interface ProblemDetail {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly detail?: string;
  readonly errors?: readonly { readonly field: string; readonly msg: string }[];
  readonly traceId?: string;
}

/** The two `members_` rules count the yes ballots against all eligible members. */
export type MajorityRule =
  | 'simple'
  | 'absolute'
  | 'two_thirds'
  | 'members_majority'
  | 'members_two_thirds';

/** `draft`: planned, not open yet. `cancelled`: the application left the vote state by hand, so the vote stopped. */
export type VoteStatus = 'draft' | 'open' | 'closed' | 'cancelled';

/** A motion gives `passed`, `rejected` or `tie`. A personnel election gives
 *  `elected`, `runoff` (a runoff decides the open seats), `tie` (the lot decides) or
 *  `rejected` (quorum missed, or nobody elected). An election that needs the majority
 *  of the members gives `no_majority` when no candidate reaches it. */
export type VoteResult = 'passed' | 'rejected' | 'tie' | 'elected' | 'runoff' | 'no_majority';

/** `motion`: a decision (Ja/Nein/Enthaltung). `election`: a personnel election.
 *  `poll`: a poll ("Umfrage") that only counts the answers. `circular`: an
 *  Umlaufverfahren, a decision of a Gremium outside a meeting. */
export type VoteKind = 'motion' | 'election' | 'poll' | 'circular';

/** `single`: one option or an abstention. `multi`: 0 to `maxChoices` options.
 *  `date`: Ja/Vielleicht/Nein for every date. */
export type PollMode = 'single' | 'multi' | 'date';

/** The answer of a date poll for one date. */
export type DateAnswer = 'yes' | 'maybe' | 'no';

/** One option of a poll: a text (`label`), or a date with a start and an optional end.
 *  The server gives the ids (`o1`..`on`). */
export interface PollOption {
  readonly id: string;
  readonly label?: string | null;
  readonly start?: IsoDateTime | null;
  readonly end?: IsoDateTime | null;
}

/** The config of a poll (`PollConfig`). */
export interface PollConfig {
  readonly mode: PollMode;
  readonly options: readonly PollOption[];
  /** A multi poll: the most options of one ballot. `null` = every option. */
  readonly maxChoices?: number | null;
  readonly secret: boolean;
  readonly guestsVote?: boolean;
}

/** The counts of a poll (`PollResultOut`): stored at the close, live once revealed. */
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

/** One candidate of a personnel election. The server gives the ids (`c1`..`cn`). */
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

/**
 * The config of a personnel election (`ElectionConfig`). Each voter gives up to
 * `seats` votes, at most one per candidate. One candidate for one seat gives a
 * Ja/Nein/Enthaltung ballot.
 */
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

/** The runoff that a tie at the seat boundary needs. `voteId` is set once it exists. */
export interface ElectionRunoff {
  readonly candidateIds: readonly string[];
  readonly seats: number;
  readonly voteId?: Uuid | null;
}

/** The lot of a tie. `drawn` is `null` while the lot is pending. */
export interface ElectionLot {
  readonly among: readonly string[];
  readonly seats: number;
  readonly drawn: readonly string[] | null;
  readonly at?: IsoDateTime | null;
  readonly by?: string | null;
  readonly byName?: string | null;
}

/** The stored result of a closed election (`ElectionResultOut`). */
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

/** The election fields of a vote and the poll fields. A motion has
 *  `kind: 'motion'` and no others. */
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

/** Quorum threshold. */
export interface Quorum {
  readonly type: 'count' | 'percent';
  readonly value: number;
}

/**
 * Vote configuration (`VoteConfig`). The backend `_CamelModel` sends the fields in
 * camelCase. The defaults mirror the Pydantic defaults: `abstainCountsQuorum` is
 * true, `secret` is false. The frontend never sets a tie break: a tie is a
 * rejection.
 */
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

/**
 * The own ballot of the caller in one vote (`MyBallot`). `choice` is the chosen
 * option. A secret vote keeps the choice apart from the identity, so there `choice`
 * is always `null` and only `cast` tells that the caller voted.
 */
export interface MyBallot {
  readonly cast: boolean;
  readonly choice: string | null;
  /** The chosen candidate ids of an open election ballot, or the chosen option
   *  ids of an open single or multi poll. */
  readonly choices?: readonly string[] | null;
  /** The answers of an open date poll ballot. */
  readonly answers?: Readonly<Record<string, DateAnswer>> | null;
}

/**
 * Aggregated interim or final result (`TallyOut`). For a `secret` vote the server
 * returns only `counts`. It never returns an individual voter.
 */
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

/**
 * Vote state and tally. GET /api/votes/{id} (`VoteOut`). It is a plain
 * `_CamelModel`, so the frontend uses it 1:1 as a view model. It carries no i18n
 * label. The options are raw keys. The frontend translates them through
 * `vote.option.*`.
 */
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

/** Meeting status. The backend enum is `planned|live|closed`. */
export type MeetingStatus = 'planned' | 'live' | 'closed';

/** `draft`: planned, not open yet. `cancelled`: the application left the vote state by hand, so the vote stopped. */
export type MeetingVoteStatus = 'draft' | 'open' | 'closed' | 'cancelled';

/** Vote summary, frontend view. It normalizes the `null` defaults. */
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
  readonly proposal?: unknown;
  /** A repeat ("Erneut abstimmen"): the closed vote of the same agenda item it repeats. */
  readonly repeatOfId?: Uuid | null;
  /** The number of the vote in its repeat chain: 2 for the first repeat. */
  readonly attempt?: number;
}

/** The body of a poll for the server, built from a draft. */
export interface PollIn {
  readonly mode: PollMode;
  readonly options: readonly {
    readonly label?: string;
    readonly start?: IsoDateTime;
    readonly end?: IsoDateTime;
  }[];
  readonly maxChoices?: number | null;
}
