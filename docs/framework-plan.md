# Plan: the kit becomes a framework

The order follows the decision "screens first, then views". Each step is one kit pull request
and, where an app changes, one app pull request. Tests run in CI only. A visual change gets
screenshots with the accessibility views before the merge.

| Step | Repository | Content | Done when |
| --- | --- | --- | --- |
| M0 | kit | Specs (#213), `scripts/check_specs.py` with the shared number space and `ui-kit:` references, CI job `specs`, entry points `/screens` and `/views/*`, the shared types of 002230 to 002236, the import-boundary lint (002215). | CI green, no visual change. |
| M1 | spec-explorer | Resolve `ui-kit:` and `STUPA-Workflow:` references and link them to the other repository. | A reference in the app opens the kit spec. |
| M2 | kit + app | Move the 270 specs (248 of the list, 7 newer, 15 replaced ones that follow their successor) and split the 11 into a kit spec (002281 to 002291) and an app spec. The app rewrites its `§` references to `§ui-kit:`. Done in kit #213 and app #1101; the kit merges first. | `check_specs.py` green in both repositories. |
| M3 | kit + app | Showcase app with fixtures (002209); the style ratchet in the app CI (002213) with the current count. | Ratchet job green. |
| M4 | kit + app | `provideFramework()`, ports, display settings and the accessibility menu in the shell (002260 to 002264); the app moves its shell config. | Screenshots of the shell in all modes. |
| M5 | kit | Screens: list/detail, detail, form, settings, public, status (002240 to 002246); overlays (002251 to 002253); `app-form` on signal forms (002255, 002256). | Showcase pages and jest-axe green. |
| M6 | app | Pages move to screens, area by area: Verwaltung and Konto, Anträge, Sitzungen, Haushalt, Aufgaben, Kalender, public pages. Each PR lowers the ratchet. formly leaves the app with the last form. | Ratchet lower after each PR. |
| M7 | kit + app | Domain views one by one (002270 to 002280): activity, chat, voting, meeting, protocol, board, calendar, plan table, graph, flow editor, form editor. | Ratchet at zero, the check of 002205 is hard. |
| M8 | spec-explorer | Angular 22, the kit as framework, no own styles. | Ratchet at zero there too. |

Coordination: other threads work on the kit and the app at the same time. A step that touches a
file of an open pull request of another thread waits for its merge or builds on its branch.
