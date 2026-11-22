---
id: "002274"
title: The voting views take votes, ballots and a voting port
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-22
implementation:
  - views/voting/src/vote-card-view.component.ts
  - views/voting/src/vote-panel-view.component.ts
  - views/voting/src/ballot-view.component.ts
  - views/voting/src/voting-api.ts
scope:
  - views/voting
---

# The voting views take votes, ballots and a voting port

`/views/voting` must export copies of the voting components of STUPA-Workflow, with the same
behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-vote-card-view` | `app-vote-card` | one vote of the open agenda item in the meeting page |
| `app-vote-panel-view` | `app-vote-panel` | the vote of a participant, a guest and the follow view (`page`, `phone`, `card`, `strip`) |
| `app-ballot-view` | `app-ballot` | the ballot: motion, election (one or more seats), poll (single, multi, date), proxy row |
| `app-election-result-view` | `app-election-result` | the bars per candidate, runoff and lot (`compact`, `beamer`) |
| `app-poll-result-view` | `app-poll-result` | the counts per option of a poll (`compact`, `beamer`) |
| `app-vote-bars-view` | `app-vote-bars` | the Ja/Nein/Enthaltung bars and the result line (`compact`, `beamer`) |
| `app-vote-progress-view` | `app-vote-progress` | "14 von 19 Anwesenden haben abgestimmt" |

View models: the types of the votes of STUPA-Workflow (`VoteView`, `MeetingVoteView`, `MyBallot`,
`ElectionConfig`, `ElectionResult`, `PollConfig`, `PollResult`, `VoteResult`, `BallotPick`,
`BallotCast`, `BallotFailure`), with the same fields, so the app passes its API objects as they
are.

Inputs of the vote card: the vote, the meeting status and the rights and states of the app card
(`canManage`, `canRun`, `canVote`, `myChoice`, `casting`, `deleting`, `locked`, `canInsert`,
`inProtocol`, `otherOpen`, `repeated`, `canRepeat`, `continued`). Outputs: `close`, `cancel`,
`open`, `remove`, `edit`, `repeat`, `cast`, `insertResult`, `electionChanged`. The card picks its
one main action and puts the rest in the ⋮ menu by the rules of the app card.

Links: the vote panel takes the link of the meeting and of the application as router commands
(`meetingLink`, `applicationLink`), so it knows no app route.

Server calls: the app provides `VOTING_API`, a port with `castBallot(voteId, pick, asDelegation)`,
`drawLot(voteId)` and `nextRound(voteId)`, each an `Observable`. The election ballot of the card
and the runoff and lot actions call it; the ballot of a panel takes the `caster` input as in the
app. Without the port the card offers no runoff and no lot.

Texts: the views read their texts through `UI_KIT_INTL` (`voting.*`), so an app can map them to
its own catalogue.

Behaviour: every rule of the app components stays, and:

- The card states the result once (001006) and has one main action and a ⋮ menu (001007).
- A chosen option is a filled control; in very high contrast it is yellow (000615).
- The live changes are announced (000518).

Reason: Every vote, election and poll then looks the same, and the app only maps its API.

Test: The specs of the app components run against the views through the app adapters; unit tests
and a jest-axe test of each view with the fixtures of `/testing`.
