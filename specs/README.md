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
| [S/framework/packages/002214](style/framework/packages/002214_entry-points.md) | The kit has six kinds of entry points | approved |
| [S/framework/packages/002215](style/framework/packages/002215_layer-direction.md) | An entry point imports only the layers below it | approved |
| [S/framework/screens/002216](style/framework/screens/002216_screen-anatomy.md) | A screen has a head, a body and fixed places for the rest | approved |
| [S/framework/screens/002217](style/framework/screens/002217_screen-inputs.md) | A screen takes its frame as data and its content as slots | approved |
| [S/framework/screens/002218](style/framework/screens/002218_list-detail-contract.md) | The list/detail screen owns the list, the panes and the URL state | approved |
| [S/framework/actions/002219](style/framework/actions/002219_action-model.md) | An action is data, and the screen places it | approved |
| [S/framework/state/002220](style/framework/state/002220_load-state.md) | A load state is one type for every view | approved |
| [S/framework/state/002221](style/framework/state/002221_ui-state-in-kit.md) | A kit component holds its UI state and the app holds the data | approved |
| [S/framework/forms/002222](style/framework/forms/002222_form-definition.md) | A form is built from a definition | approved |
| [S/framework/texts/002223](style/framework/texts/002223_kit-catalogue.md) | The texts of the kit have keys that an admin can override | approved |
| [S/framework/config/002224](style/framework/config/002224_routes-from-helpers.md) | An app builds the routes of a screen with a kit helper | approved |
| [S/framework/config/002225](style/framework/config/002225_ports.md) | App data reaches the shell only through ports | approved |
| [S/framework/config/002226](style/framework/config/002226_display-settings-in-shell.md) | The display settings and the accessibility menu are part of the shell | approved |
| [S/framework/views/002227](style/framework/views/002227_view-contract.md) | Each domain view has a contract spec before it is built | approved |
| [S/framework/testing/002228](style/framework/testing/002228_tests-in-kit.md) | The kit tests a view, the app tests its adapter | approved |
| [S/framework/testing/002229](style/framework/testing/002229_api-change.md) | A change of a public kit API comes with the change of every app | approved |
| [S/framework/types/002230](style/framework/types/002230_screen-head.md) | The head of a screen is a ScreenHead | approved |
| [S/framework/types/002231](style/framework/types/002231_action-type.md) | The Action type has a fixed set of fields | approved |
| [S/framework/types/002232](style/framework/types/002232_list-row.md) | A row of a list is a ListRow | approved |
| [S/framework/types/002233](style/framework/types/002233_filter-sort-search.md) | Filters, sort and search are FilterDef, SortDef and SearchDef | approved |
| [S/framework/types/002234](style/framework/types/002234_load-state-type.md) | LoadState has four cases | approved |
| [S/framework/types/002235](style/framework/types/002235_screen-tab.md) | A tab of a screen is a ScreenTab with a slot | approved |
| [S/framework/types/002236](style/framework/types/002236_route-link.md) | A link is a RouteLink | approved |
| [S/framework/screens/002240](style/framework/screens/002240_list-detail-screen.md) | The list/detail screen has a fixed interface | approved |
| [S/framework/screens/002241](style/framework/screens/002241_detail-screen.md) | The detail screen has a fixed interface | approved |
| [S/framework/screens/002242](style/framework/screens/002242_form-screen.md) | The form screen has a fixed interface | approved |
| [S/framework/screens/002243](style/framework/screens/002243_wizard-screen.md) | The wizard screen has a fixed interface | approved |
| [S/framework/screens/002244](style/framework/screens/002244_settings-screen.md) | The settings screen has a fixed interface | approved |
| [S/framework/screens/002245](style/framework/screens/002245_public-screen.md) | The public screen has a fixed interface | approved |
| [S/framework/screens/002246](style/framework/screens/002246_status-screen.md) | The status screen has a fixed interface | approved |
| [S/framework/screens/002247](style/framework/screens/002247_board-screen.md) | The board screen has a fixed interface | approved |
| [S/framework/screens/002248](style/framework/screens/002248_calendar-screen.md) | The calendar screen has a fixed interface | approved |
| [S/framework/screens/002249](style/framework/screens/002249_graph-screen.md) | The graph screen has a fixed interface | approved |
| [S/framework/screens/002250](style/framework/screens/002250_editor-screen.md) | The editor screen has a fixed interface | approved |
| [S/framework/overlays/002251](style/framework/overlays/002251_dialog.md) | A dialog has a head, a body and a footer group | approved |
| [S/framework/overlays/002252](style/framework/overlays/002252_sheets.md) | Side sheets, bottom sheets and select sheets have one frame | approved |
| [S/framework/overlays/002253](style/framework/overlays/002253_toasts.md) | A toast is sent through the toast service | approved |
| [S/framework/forms/002255](style/framework/forms/002255_field-def.md) | A field of a form is a FieldDef of a fixed kind | approved |
| [S/framework/forms/002256](style/framework/forms/002256_form-behaviour.md) | A form reports its value, its validity and its dirty state | approved |
| [S/framework/shell/002260](style/framework/shell/002260_framework-config.md) | provideFramework takes one FrameworkConfig | approved |
| [S/framework/shell/002261](style/framework/shell/002261_port-types.md) | The ports have fixed types | approved |
| [S/framework/shell/002262](style/framework/shell/002262_route-helpers.md) | The route helpers have fixed signatures | approved |
| [S/framework/shell/002263](style/framework/shell/002263_frames.md) | The shell has four frames | approved |
| [S/framework/shell/002264](style/framework/shell/002264_menus.md) | The help, accessibility and account menus come from the shell | approved |
| [S/framework/views/002270](style/framework/views/002270_graph-view.md) | The graph view takes nodes and edges | approved |
| [S/framework/views/002271](style/framework/views/002271_board-view.md) | The board view takes columns and cards | approved |
| [S/framework/views/002272](style/framework/views/002272_calendar-view.md) | The calendar view takes entries | approved |
| [S/framework/views/002273](style/framework/views/002273_protocol-view.md) | The protocol view is the Markdown editor with the protocol tools | approved |
| [S/framework/views/002274](style/framework/views/002274_voting-view.md) | The voting view takes a VoteCard and a Ballot | approved |
| [S/framework/views/002275](style/framework/views/002275_meeting-view.md) | The meeting view takes the agenda, the attendance and the dock | approved |
| [S/framework/views/002276](style/framework/views/002276_chat-view.md) | The chat view takes messages and a composer | approved |
| [S/framework/views/002277](style/framework/views/002277_flow-editor-view.md) | The flow editor takes a FlowGraph | approved |
| [S/framework/views/002278](style/framework/views/002278_form-editor-view.md) | The form editor edits a FormDef | approved |
| [S/framework/views/002279](style/framework/views/002279_plan-table-view.md) | The plan table takes rows as a tree | approved |
| [S/framework/views/002280](style/framework/views/002280_activity-view.md) | The activity view takes entries | approved |
