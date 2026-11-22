/** Pure, DI-free display helpers of the voting views (copied from STUPA-Workflow). */

import type { UiKitTextKey } from '@stupa-makers/ui-kit';
import type { MeetingVote, Quorum } from './voting.types';

/** A text lookup: a kit text key and its parameters. */
export type Translate = (key: UiKitTextKey, params?: Record<string, string | number>) => string;

/** `HH:MM` of a timestamp, always 24 h; empty without a valid value. */
export function clock(value: string | null | undefined, formatLocale: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(formatLocale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
}

/** Canonical ballot options. The pass/fail evaluation needs yes, no and abstain. */
export const FIXED_VOTE_OPTIONS = ['yes', 'no', 'abstain'] as const;

export function countEntries(vote: MeetingVote): readonly { readonly key: string; readonly value: number }[] {
  return Object.entries(vote.counts ?? {}).map(([key, value]) => ({ key, value }));
}

/** Selectable options of a vote. The fallback is the set of tally keys. */
export function voteOptionsFor(vote: MeetingVote): readonly string[] {
  return vote.options.length ? vote.options : Object.keys(vote.counts ?? {});
}

/** Display label of a ballot option (yes→Ja …). An unknown option stays raw. */
export function voteOptionLabel(
  opt: string,
  translate: (key: UiKitTextKey) => string,
): string {
  const key = `vote.option.${opt}` as UiKitTextKey;
  const label = translate(key);
  return label === key ? opt : label;
}

/** The rule fields of a vote that the rules line reads. */
export interface VoteRules {
  readonly majorityRule?: string | null;
  readonly quorum?: Quorum | null;
  /** Admitted guests vote too: no quorum, the majority of the cast votes decides. */
  readonly guestsVote?: boolean;
}

/** "Einfache Mehrheit", or "Einfache Mehrheit der abgegebenen Stimmen" for a vote with guests. */
export function majorityLabel(
  rule: string,
  guestsVote: boolean | undefined,
  t: Translate,
): string {
  const family = guestsVote ? 'vote.majorityCast' : 'vote.majority';
  return t(`${family}.${rule}` as UiKitTextKey);
}

/** "Quorum 12" or "Quorum 50 %". */
export function quorumLabel(quorum: Quorum, t: Translate): string {
  return t(quorum.type === 'percent' ? 'meetings.vote.quorumPercent' : 'meetings.vote.quorumCount', {
    n: quorum.value,
  });
}

/**
 * The rule parts of a motion: "Einfache Mehrheit · Quorum 12". A part without data stays
 * out: a vote that a live event added before the next read has no rules yet, and a vote
 * without a quorum shows none.
 */
export function voteRulesParts(vote: VoteRules, t: Translate): readonly string[] {
  const majority = vote.majorityRule ? [majorityLabel(vote.majorityRule, vote.guestsVote, t)] : [];
  const quorum = vote.quorum ? [quorumLabel(vote.quorum, t)] : [];
  return [...majority, ...quorum];
}

/**
 * The rules line of a vote card: "Einfache Mehrheit · Quorum 12 · seit 18:48"
 * ({@link voteRulesParts}, then the time of the open or the end). A poll shows only the
 * time, and so does an election with the majority of the members: its caption names the
 * rule.
 */
export function voteMetaLine(vote: MeetingVote, translate: Translate, formatLocale: string): string {
  const captioned =
    vote.kind === 'poll' || vote.election?.majorityRule === 'members_majority';
  const rules = captioned ? [] : voteRulesParts(vote, translate);
  return [...rules, ...voteTimePart(vote, translate, formatLocale)].join(' · ');
}

/** The time part of {@link voteMetaLine}: "seit 18:48" while open, "beendet 19:02" after. */
function voteTimePart(
  vote: MeetingVote,
  translate: Translate,
  formatLocale: string,
): readonly string[] {
  const locale = formatLocale;
  const since = vote.status === 'open' ? clock(vote.openedAt, locale) : null;
  const ended =
    vote.status === 'closed' || vote.status === 'cancelled' ? clock(vote.closedAt, locale) : null;
  return since
    ? [translate('meetings.vote.since', { time: since })]
    : ended
      ? [translate('meetings.vote.endedAt', { time: ended })]
      : [];
}

/**
 * "19 Mitglieder + 7 Gäste anwesend" for a vote with guests, or `null` while the
 * counts are unknown (a vote that closed before the counts existed).
 */
export function guestComposition(
  members: number | null | undefined,
  guests: number | null | undefined,
  translate: Translate,
): string | null {
  if (members === null || members === undefined || guests === null || guests === undefined) {
    return null;
  }
  return translate('guests.vote.composition', { members, guests });
}
