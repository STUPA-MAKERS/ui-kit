# Specs

The binding rules of the ui-kit framework. One file holds one rule. The format follows the spec
rules of STUPA-Workflow (`S/specs/*`); the kit gets its own copy and its own
`scripts/check_specs.py` in the first framework pull request. The kit and STUPA-Workflow share one
number space (`S/specs/sharing/002211`).

[../docs/framework.md](../docs/framework.md) gives the overview. [MIGRATION.md](MIGRATION.md) lists the specs that move here from STUPA-Workflow.

## Index

| ID | Title | Status |
| --- | --- | --- |
| [S/framework/architecture/002200](style/framework/architecture/002200_apps-fill-screens.md) | An app only fills the screens of the kit | approved |
| [S/framework/architecture/002201](style/framework/architecture/002201_screen-catalogue.md) | The kit has one screen for each page pattern | approved |
| [S/framework/architecture/002202](style/framework/architecture/002202_data-driven-components.md) | A kit component is driven by its inputs | approved |
| [S/framework/architecture/002203](style/framework/architecture/002203_domain-views-in-kit.md) | Domain views are kit components | approved |
| [S/framework/architecture/002204](style/framework/architecture/002204_view-models.md) | A kit view model is a typed interface of the kit | approved |
| [S/framework/architecture/002205](style/framework/architecture/002205_no-app-styles.md) | An app has no stylesheet of its own | approved |
| [S/framework/architecture/002206](style/framework/architecture/002206_ui-features-everywhere.md) | Every UI feature of the kit is on in every app | approved |
| [S/framework/architecture/002207](style/framework/architecture/002207_one-app-config.md) | An app configures the kit in one provider | approved |
| [S/framework/architecture/002208](style/framework/architecture/002208_texts-through-inputs.md) | Content texts come from the app, control texts from the kit | approved |
| [S/framework/architecture/002209](style/framework/architecture/002209_showcase.md) | Every screen and domain view has a page in the kit showcase | approved |
| [S/specs/sharing/002210](style/specs/sharing/002210_what-lives-in-the-kit.md) | A spec about the look and the behaviour of the UI lives in the kit | approved |
| [S/specs/sharing/002211](style/specs/sharing/002211_shared-numbers.md) | The kit and its apps share one number space | approved |
| [S/specs/sharing/002212](style/specs/sharing/002212_cross-repo-reference.md) | A reference to a spec of another repository names the repository | approved |
| [S/framework/architecture/002213](style/framework/architecture/002213_style-ratchet.md) | The style lines of an app only fall until they reach zero | approved |
| [S/framework/packages/002214](style/framework/packages/002214_entry-points.md) | The kit has six kinds of entry points | draft |
| [S/framework/packages/002215](style/framework/packages/002215_layer-direction.md) | An entry point imports only the layers below it | draft |
| [S/framework/screens/002216](style/framework/screens/002216_screen-anatomy.md) | A screen has a head, a body and fixed places for the rest | draft |
| [S/framework/screens/002217](style/framework/screens/002217_screen-inputs.md) | A screen takes its frame as data and its content as slots | draft |
| [S/framework/screens/002218](style/framework/screens/002218_list-detail-contract.md) | The list/detail screen owns the list, the panes and the URL state | draft |
| [S/framework/actions/002219](style/framework/actions/002219_action-model.md) | An action is data, and the screen places it | draft |
| [S/framework/state/002220](style/framework/state/002220_load-state.md) | A load state is one type for every view | draft |
| [S/framework/state/002221](style/framework/state/002221_ui-state-in-kit.md) | A kit component holds its UI state and the app holds the data | draft |
| [S/framework/forms/002222](style/framework/forms/002222_form-definition.md) | A form is built from a definition | draft |
| [S/framework/texts/002223](style/framework/texts/002223_kit-catalogue.md) | The texts of the kit have keys that an admin can override | draft |
| [S/framework/config/002224](style/framework/config/002224_routes-from-helpers.md) | An app builds the routes of a screen with a kit helper | draft |
| [S/framework/config/002225](style/framework/config/002225_ports.md) | App data reaches the shell only through ports | draft |
| [S/framework/config/002226](style/framework/config/002226_display-settings-in-shell.md) | The display settings and the accessibility menu are part of the shell | draft |
| [S/framework/views/002227](style/framework/views/002227_view-contract.md) | Each domain view has a contract spec before it is built | draft |
| [S/framework/testing/002228](style/framework/testing/002228_tests-in-kit.md) | The kit tests a view, the app tests its adapter | draft |
| [S/framework/testing/002229](style/framework/testing/002229_api-change.md) | A change of a public kit API comes with the change of every app | draft |
