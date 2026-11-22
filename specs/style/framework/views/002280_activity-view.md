---
id: "002280"
title: The activity view takes entries
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
implementation: views/activity/src/activity-view.component.ts
scope:
  - views/activity
---

# The activity view takes entries

`/views/activity` must export `app-activity-view` and these view models:

```ts
interface ActivityEntry { readonly id: string; readonly item: { title: string; icon: IconName; link: RouteLink };
  readonly actor: PersonRef | null; readonly change: string; readonly day: string; readonly time: string;
  readonly new?: boolean }
```

Inputs: `entries: LoadState<readonly ActivityEntry[]>` (`ready.more`: more entries follow),
`loadingMore: boolean`, `emptyBody: string | null`.

Outputs: `more`.

Behaviour:

- The view is a copy of the list of the page "Aktivität" of STUPA-Workflow (001270 to 001277).
- Entries in a row with the same `day` form one group with `day` as its label. The app formats
  `day` ("Heute", "Gestern", "Mo, 16.11.2026") and `time`.
- A row names the item, the actor and the change ("actor · change", only the change without an
  actor) and the time (001277), and it is a link to `item.link`. A new entry has a dot on its icon
  and the hidden word "Neu". Beside the rail the row ends with the quiet arrow (001962); on a phone
  the title and the second line wrap.
- While the first page loads, the view shows grey rows. An empty list shows the face with the
  heading and the icon of the empty state and `emptyBody`. A failed load shows the face with the
  error text (002405); the error toast is the job of the page.
- With `ready.more`, the end of the list and the button "Mehr laden" emit `more`, but not while
  `loadingMore` is true.

Reason: Every activity list then looks the same, and the app only maps its API to entries.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
