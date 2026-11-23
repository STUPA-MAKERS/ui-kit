# Specs

The binding rules of the ui-kit framework. One file holds one rule. The rules for specs are the
spec rules of STUPA-Workflow (`STUPA-Workflow:S/specs/*`); the kit has no copy of them, because a
rule is written in one place. The kit and STUPA-Workflow share one number space
(`S/specs/sharing/002211`), and a reference to a spec of the other repository names the
repository (`S/specs/sharing/002212`).

[../docs/framework.md](../docs/framework.md) gives the overview and [../docs/framework-plan.md](../docs/framework-plan.md)
the steps. The specs under `requirements/` came from STUPA-Workflow and keep their numbers and
folders (002211).

`python3 scripts/check_specs.py` checks the specs (`--write` updates this file). With
`PARTNER_SPECS=<checkout of STUPA-Workflow>/specs` it also checks the shared numbers and the
references to the app.

## Tree

```
specs/
  style/
    framework/  actions, architecture, config, forms, material, overlays, packages, screens, shell, state, testing, texts, types, views
    frontend/   angular
    specs/      sharing
  requirements/
    functional/
      administration/  admin, files
      applications/    applications, flow, forms
      collaboration/   activity, graph, todos
      finance/         budget, invoices
      meetings/        calendar, meetings, protocols, voting
      public/          public-pages
    non-functional/
      accessibility/  conformance, interaction, language, perception, settings, statement
      compatibility/  pwa
      performance/    loading
      usability/      controls, layout
```

## Index

| ID | Title | Status |
| --- | --- | --- |
| [F/administration/admin/000165](requirements/functional/administration/admin/000165_admin-start.md) | Verwaltung keeps its frame widths | approved |
| [F/administration/files/001080](requirements/functional/administration/files/001080_download-opens-viewer.md) | A download of a viewable file opens the file viewer | approved |
| [F/administration/files/002281](requirements/functional/administration/files/002281_drop-zone.md) | A drop target accepts files by drag and drop | approved |
| [F/applications/applications/000131](requirements/functional/applications/applications/000131_comments-button.md) | Comments open from a header button | approved |
| [F/applications/applications/001185](requirements/functional/applications/applications/001185_apply-step-spacing.md) | The blocks of step 1 have one even spacing | approved |
| [F/applications/applications/001703](requirements/functional/applications/applications/001703_bulk-result.md) | The bulk result shows success or error per Antrag | approved |
| [F/applications/applications/002282](requirements/functional/applications/applications/002282_choice-step-groups.md) | A choice step shows its options by group with the group text | approved |
| [F/applications/applications/002283](requirements/functional/applications/applications/002283_visibility-switch-labels.md) | The visibility switch of a composer takes its labels from inputs | approved |
| [F/applications/flow/000137](requirements/functional/applications/flow/000137_flow-auto-layout.md) | The flow editor lays out automatically | approved |
| [F/applications/forms/000283](requirements/functional/applications/forms/000283_sections.md) | Section fields make wizard steps | approved |
| [F/collaboration/activity/001277](requirements/functional/collaboration/activity/001277_activity-row.md) | An activity row names the item, the actor, the change and the time | approved |
| [F/collaboration/graph/001425](requirements/functional/collaboration/graph/001425_graph-filters.md) | The graph has filters above the drawing | approved |
| [F/collaboration/graph/001426](requirements/functional/collaboration/graph/001426_graph-builds-up.md) | The graph builds up node by node | approved |
| [F/collaboration/graph/001427](requirements/functional/collaboration/graph/001427_graph-reduced-motion.md) | The graph does not move with reduced motion | approved |
| [F/collaboration/graph/001428](requirements/functional/collaboration/graph/001428_graph-text-alternative.md) | The drawing has a text alternative | approved |
| [F/collaboration/graph/001429](requirements/functional/collaboration/graph/001429_graph-node-press.md) | A press on a node shows the element and its neighbours | approved |
| [F/collaboration/graph/001430](requirements/functional/collaboration/graph/001430_graph-node-look.md) | A node shows the icon and the colour of its kind | approved |
| [F/collaboration/graph/001433](requirements/functional/collaboration/graph/001433_graph-node-drag.md) | A drag moves a node of the graph | approved |
| [F/collaboration/todos/000148](requirements/functional/collaboration/todos/000148_move-sheet.md) | One move sheet | approved |
| [F/collaboration/todos/001074](requirements/functional/collaboration/todos/001074_gremium-person-picker.md) | One search field picks Gremien and persons | approved |
| [F/collaboration/todos/001380](requirements/functional/collaboration/todos/001380_move-sheet-select-rows.md) | The move sheet lists the columns as the select sheet does | approved |
| [F/collaboration/todos/001967](requirements/functional/collaboration/todos/001967_column-menu-corner.md) | The menu of a board column stands in its top right corner | approved |
| [F/finance/budget/000146](requirements/functional/finance/budget/000146_legend.md) | The budget legend matches the drawing | approved |
| [F/finance/budget/001020](requirements/functional/finance/budget/001020_plan-table-amounts-one-edge.md) | The amounts of a plan table end on one edge | approved |
| [F/finance/invoices/000262](requirements/functional/finance/invoices/000262_invoice-segments.md) | The invoice list has four segments | replaced |
| [F/meetings/calendar/000726](requirements/functional/meetings/calendar/000726_calendar-phone.md) | The Kalender on the phone is a list of days | approved |
| [F/meetings/calendar/000728](requirements/functional/meetings/calendar/000728_calendar-week-view.md) | The desktop Kalender has a week and a month view | approved |
| [F/meetings/calendar/000742](requirements/functional/meetings/calendar/000742_termin-invite-search-rows.md) | The invitation search of a Termin shows its hits as rows with an avatar | replaced |
| [F/meetings/calendar/000744](requirements/functional/meetings/calendar/000744_week-span-blocks.md) | A timed entry over several days is a block on each of its days in the week view | approved |
| [F/meetings/calendar/000746](requirements/functional/meetings/calendar/000746_week-whole-day.md) | The week view shows the whole day from 00:00 to 24:00 | approved |
| [F/meetings/calendar/001771](requirements/functional/meetings/calendar/001771_termin-button-in-tools-row.md) | The desktop Kalender has no visible title and its buttons end the tools row | approved |
| [F/meetings/meetings/000100](requirements/functional/meetings/meetings/000100_agenda-subtitle.md) | An agenda row has a subtitle only for an Antrag | approved |
| [F/meetings/meetings/000101](requirements/functional/meetings/meetings/000101_application-top-row.md) | A TOP with an Antrag shows the Antrag as its first row | approved |
| [F/meetings/meetings/000607](requirements/functional/meetings/meetings/000607_agenda-row-no-drag-handle.md) | An agenda row shows no drag handle | approved |
| [F/meetings/meetings/000610](requirements/functional/meetings/meetings/000610_attendance-month-without-meeting.md) | A month without a meeting is a narrow column with a dash | approved |
| [F/meetings/meetings/000611](requirements/functional/meetings/meetings/000611_attendance-cell-badges.md) | An attendance cell holds its badges | approved |
| [F/meetings/meetings/001460](requirements/functional/meetings/meetings/001460_votes-in-side-sheet.md) | The vote cards of an item are in a side sheet | approved |
| [F/meetings/meetings/001461](requirements/functional/meetings/meetings/001461_phone-open-vote-replaces-text.md) | On a phone an open vote takes the place of the text | approved |
| [F/meetings/meetings/001800](requirements/functional/meetings/meetings/001800_linked-items-in-side-sheet.md) | The linked rows of an item are in a side sheet | approved |
| [F/meetings/meetings/001801](requirements/functional/meetings/meetings/001801_attendance-edge-tab.md) | A tab at the end edge opens the attendance | approved |
| [F/meetings/meetings/001802](requirements/functional/meetings/meetings/001802_vote-sheet-head-add.md) | The vote sheet has its add button in the head and an empty state | approved |
| [F/meetings/meetings/002284](requirements/functional/meetings/meetings/002284_side-sheet-open-input.md) | A side sheet opens by itself on request | approved |
| [F/meetings/protocols/000689](requirements/functional/meetings/protocols/000689_blackout-internal.md) | Internal views show a marked segment as marked | approved |
| [F/meetings/protocols/000690](requirements/functional/meetings/protocols/000690_blackout-format-bar.md) | The format bar marks a segment for blackout | approved |
| [F/meetings/protocols/000863](requirements/functional/meetings/protocols/000863_pdf-file-badge.md) | An embedded PDF shows as a file badge | approved |
| [F/meetings/protocols/000873](requirements/functional/meetings/protocols/000873_time-note-tool.md) | A toolbar tool inserts a time note | approved |
| [F/meetings/protocols/000969](requirements/functional/meetings/protocols/000969_blackout-known-names.md) | The editor blacks out a known name after it is typed | approved |
| [F/meetings/protocols/001304](requirements/functional/meetings/protocols/001304_protocol-in-meeting-head.md) | The protocol state and its actions sit in the meeting head | approved |
| [F/meetings/voting/001006](requirements/functional/meetings/voting/001006_vote-card-states-result-once.md) | The vote card states the result once | approved |
| [F/meetings/voting/001007](requirements/functional/meetings/voting/001007_vote-card-one-action.md) | The vote card has one main action and a menu | approved |
| [F/meetings/voting/002070](requirements/functional/meetings/voting/002070_vote-card-opaque-on-glass.md) | A vote card on a glass sheet is opaque in the light theme | approved |
| [F/public/public-pages/000688](requirements/functional/public/public-pages/000688_blackout-bar-width.md) | A black bar has one fixed width and the text colour | approved |
| [F/public/public-pages/002285](requirements/functional/public/public-pages/002285_blackout-bar.md) | A blackout block shows as one bar on screen | approved |
| [NF/accessibility/conformance/000490](requirements/non-functional/accessibility/conformance/000490_wcag-22-aa.md) | Every view meets WCAG 2.2 level AA | approved |
| [NF/accessibility/conformance/000491](requirements/non-functional/accessibility/conformance/000491_axe-every-route.md) | Every route passes an axe check in both themes | approved |
| [NF/accessibility/conformance/000492](requirements/non-functional/accessibility/conformance/000492_template-lint.md) | The template lint has the accessibility rules | approved |
| [NF/accessibility/conformance/000493](requirements/non-functional/accessibility/conformance/000493_axe-unit-per-component.md) | Every shared component has a jest-axe test | approved |
| [NF/accessibility/interaction/000217](requirements/non-functional/accessibility/interaction/000217_keyboard-and-labels.md) | Controls are reachable by keyboard and named | approved |
| [NF/accessibility/interaction/000218](requirements/non-functional/accessibility/interaction/000218_themes.md) | Light and dark themes are both supported | approved |
| [NF/accessibility/interaction/000219](requirements/non-functional/accessibility/interaction/000219_reduced-motion.md) | Motion follows the reduced motion setting | approved |
| [NF/accessibility/interaction/000508](requirements/non-functional/accessibility/interaction/000508_focus-ring.md) | The focus ring is 2 px and has a contrast of 3:1 | approved |
| [NF/accessibility/interaction/000509](requirements/non-functional/accessibility/interaction/000509_focus-not-hidden.md) | Sticky bars do not hide the focus | approved |
| [NF/accessibility/interaction/000510](requirements/non-functional/accessibility/interaction/000510_skip-link.md) | A skip link goes to the main content | approved |
| [NF/accessibility/interaction/000511](requirements/non-functional/accessibility/interaction/000511_page-title.md) | Each page has its own title | approved |
| [NF/accessibility/interaction/000512](requirements/non-functional/accessibility/interaction/000512_focus-after-navigation.md) | Focus goes to the heading after navigation | approved |
| [NF/accessibility/interaction/000513](requirements/non-functional/accessibility/interaction/000513_dialog-focus.md) | A dialog keeps the focus inside | approved |
| [NF/accessibility/interaction/000514](requirements/non-functional/accessibility/interaction/000514_gesture-alternative.md) | Each gesture has a single tap alternative | approved |
| [NF/accessibility/interaction/000515](requirements/non-functional/accessibility/interaction/000515_drag-alternative.md) | Each drag has an alternative without a drag | approved |
| [NF/accessibility/interaction/000516](requirements/non-functional/accessibility/interaction/000516_target-size.md) | A target is at least 24 by 24 px | approved |
| [NF/accessibility/interaction/000517](requirements/non-functional/accessibility/interaction/000517_status-announced.md) | A status message is announced | approved |
| [NF/accessibility/interaction/000518](requirements/non-functional/accessibility/interaction/000518_live-vote-announced.md) | The live vote announces its changes | approved |
| [NF/accessibility/interaction/000519](requirements/non-functional/accessibility/interaction/000519_form-errors.md) | A form error is a text next to the field | approved |
| [NF/accessibility/interaction/000520](requirements/non-functional/accessibility/interaction/000520_landmarks-headings.md) | Each page has landmarks and one h1 | approved |
| [NF/accessibility/language/000522](requirements/non-functional/accessibility/language/000522_page-language.md) | The page language follows the UI language | approved |
| [NF/accessibility/language/000523](requirements/non-functional/accessibility/language/000523_content-language.md) | Content in a different language has its lang | approved |
| [NF/accessibility/perception/000499](requirements/non-functional/accessibility/perception/000499_text-contrast.md) | Text has a contrast of 4.5:1 | approved |
| [NF/accessibility/perception/000500](requirements/non-functional/accessibility/perception/000500_non-text-contrast.md) | Control edges and icons have a contrast of 3:1 | approved |
| [NF/accessibility/perception/000502](requirements/non-functional/accessibility/perception/000502_colour-not-alone.md) | Colour is not the only sign of a state | approved |
| [NF/accessibility/perception/000503](requirements/non-functional/accessibility/perception/000503_reflow-320.md) | Every view works at a width of 320 px | approved |
| [NF/accessibility/perception/000504](requirements/non-functional/accessibility/perception/000504_text-spacing.md) | User text spacing does not cut text | approved |
| [NF/accessibility/perception/000506](requirements/non-functional/accessibility/perception/000506_image-alt.md) | A Markdown image has an alternative text | approved |
| [NF/accessibility/perception/000507](requirements/non-functional/accessibility/perception/000507_chart-text.md) | A chart has a text alternative | approved |
| [NF/accessibility/perception/002286](requirements/non-functional/accessibility/perception/002286_accent-clamp.md) | The accent check keeps the contrast | approved |
| [NF/accessibility/settings/000593](requirements/non-functional/accessibility/settings/000593_display-settings-in-accessibility-menu.md) | The accessibility menu holds the display settings | approved |
| [NF/accessibility/settings/000594](requirements/non-functional/accessibility/settings/000594_setting-overrides-system.md) | A display setting overrides the system setting | approved |
| [NF/accessibility/settings/000595](requirements/non-functional/accessibility/settings/000595_more-contrast.md) | More contrast raises the contrast of text and borders | approved |
| [NF/accessibility/settings/000596](requirements/non-functional/accessibility/settings/000596_less-transparency.md) | Less transparency makes the glass surfaces opaque | approved |
| [NF/accessibility/settings/000598](requirements/non-functional/accessibility/settings/000598_highlight-fields.md) | Very high contrast highlights the fields black on yellow | approved |
| [NF/accessibility/settings/000605](requirements/non-functional/accessibility/settings/000605_very-high-contrast.md) | Very high contrast shows the app in four colours | approved |
| [NF/accessibility/settings/000606](requirements/non-functional/accessibility/settings/000606_very-high-contrast-includes-settings.md) | Very high contrast includes the other display settings | approved |
| [NF/accessibility/settings/000608](requirements/non-functional/accessibility/settings/000608_display-reset-in-head-row.md) | The display reset lines up with the heading and the switches | approved |
| [NF/accessibility/settings/000612](requirements/non-functional/accessibility/settings/000612_attendance-matrix-very-high-contrast.md) | The attendance matrix follows very high contrast | approved |
| [NF/accessibility/settings/000614](requirements/non-functional/accessibility/settings/000614_yellow-means-press.md) | In very high contrast, yellow shows what a person can press | approved |
| [NF/accessibility/settings/000615](requirements/non-functional/accessibility/settings/000615_chosen-is-yellow-fill.md) | In very high contrast, the chosen control of a choice is yellow filled | approved |
| [NF/accessibility/settings/000616](requirements/non-functional/accessibility/settings/000616_navigation-yellow-text.md) | In very high contrast, the navigation has yellow text and yellow icons | approved |
| [NF/accessibility/settings/000617](requirements/non-functional/accessibility/settings/000617_menus-black-yellow-rows.md) | In very high contrast, every menu is black with yellow rows | approved |
| [NF/accessibility/settings/000618](requirements/non-functional/accessibility/settings/000618_choice-cards-keep-circle.md) | In very high contrast, a choice card has a yellow edge and a yellow circle | approved |
| [NF/accessibility/settings/000619](requirements/non-functional/accessibility/settings/000619_row-title-yellow.md) | In very high contrast, a row that opens something has a yellow title | approved |
| [NF/accessibility/settings/000620](requirements/non-functional/accessibility/settings/000620_switch-off-edge-on-fill.md) | In very high contrast, a switch, a checkbox and a radio button are filled only when on | approved |
| [NF/accessibility/settings/000621](requirements/non-functional/accessibility/settings/000621_black-on-yellow-fill.md) | In very high contrast, everything on a yellow fill is black | approved |
| [NF/accessibility/settings/000622](requirements/non-functional/accessibility/settings/000622_no-ring-on-script-focus.md) | A heading that a script focuses shows no focus ring | approved |
| [NF/accessibility/settings/000623](requirements/non-functional/accessibility/settings/000623_scripts-read-motion-setting.md) | A script reads the motion setting, not the system | approved |
| [NF/accessibility/settings/000647](requirements/non-functional/accessibility/settings/000647_accessibility-menu.md) | Accessibility has its own menu | approved |
| [NF/accessibility/settings/000739](requirements/non-functional/accessibility/settings/000739_copy-box-yellow-fill.md) | In very high contrast, a box with a text to copy is a yellow fill | approved |
| [NF/accessibility/settings/001352](requirements/non-functional/accessibility/settings/001352_very-high-contrast-button-group.md) | In very high contrast, a head group is yellow with black gaps | approved |
| [NF/accessibility/settings/001980](requirements/non-functional/accessibility/settings/001980_very-high-contrast-tab-bar.md) | In very high contrast, a tab bar is one group with a yellow bar under the open tab | approved |
| [NF/accessibility/statement/002287](requirements/non-functional/accessibility/statement/002287_statement-link-slot.md) | The accessibility menu links to the accessibility statement | approved |
| [NF/compatibility/pwa/000220](requirements/non-functional/compatibility/pwa/000220_zoom.md) | Zoom is blocked only in the installed app | approved |
| [NF/compatibility/pwa/000221](requirements/non-functional/compatibility/pwa/000221_android-nav-bar.md) | The Android navigation bar has the manifest colour | approved |
| [NF/compatibility/pwa/000222](requirements/non-functional/compatibility/pwa/000222_update-offline.md) | The app shows update and offline bars | replaced |
| [NF/compatibility/pwa/000411](requirements/non-functional/compatibility/pwa/000411_status-bar-theme.md) | The status bar follows the theme | approved |
| [NF/compatibility/pwa/000578](requirements/non-functional/compatibility/pwa/000578_server-unreachable-bar.md) | The offline bar shows when the server is unreachable | approved |
| [NF/compatibility/pwa/000579](requirements/non-functional/compatibility/pwa/000579_reload-after-unreachable.md) | An unreachable server shows no error toast, and the page loads again | approved |
| [NF/compatibility/pwa/002151](requirements/non-functional/compatibility/pwa/002151_reload-on-new-version.md) | A new app version reloads the app at once | approved |
| [NF/compatibility/pwa/002152](requirements/non-functional/compatibility/pwa/002152_reload-loop-guard.md) | The app reloads at most twice for the same server version | approved |
| [NF/compatibility/pwa/002153](requirements/non-functional/compatibility/pwa/002153_offline-bar.md) | The app shows the offline bar | approved |
| [NF/performance/loading/000189](requirements/non-functional/performance/loading/000189_load-bar.md) | The load bar shows only for slow foreground reads | approved |
| [NF/performance/loading/000191](requirements/non-functional/performance/loading/000191_search-as-you-type.md) | Search runs as you type | approved |
| [NF/performance/loading/000893](requirements/non-functional/performance/loading/000893_skeleton-shape.md) | A skeleton has the shape of the loaded page | approved |
| [NF/performance/loading/002288](requirements/non-functional/performance/loading/002288_skeleton-until-images.md) | A list with images keeps its skeleton until the images have loaded | approved |
| [NF/performance/loading/002289](requirements/non-functional/performance/loading/002289_row-intent.md) | A list reports a sign of intent for a row | approved |
| [NF/usability/controls/000203](requirements/non-functional/usability/controls/000203_app-popover.md) | Every dropdown uses the app popover | approved |
| [NF/usability/controls/000204](requirements/non-functional/usability/controls/000204_whole-control.md) | The whole control is clickable | approved |
| [NF/usability/controls/000205](requirements/non-functional/usability/controls/000205_empty-state.md) | Empty states use one component | approved |
| [NF/usability/controls/000206](requirements/non-functional/usability/controls/000206_no-helper-texts.md) | The UI has no helper texts | approved |
| [NF/usability/controls/000207](requirements/non-functional/usability/controls/000207_no-title-counters.md) | Titles show no counters | replaced |
| [NF/usability/controls/000208](requirements/non-functional/usability/controls/000208_separators.md) | A separator stands only between two items | approved |
| [NF/usability/controls/000209](requirements/non-functional/usability/controls/000209_no-cut-urls.md) | URLs, IBANs and e-mail addresses are never cut | approved |
| [NF/usability/controls/000210](requirements/non-functional/usability/controls/000210_press-feedback.md) | A press gives feedback | replaced |
| [NF/usability/controls/000211](requirements/non-functional/usability/controls/000211_swipe-and-select.md) | A swipe never deletes | approved |
| [NF/usability/controls/000212](requirements/non-functional/usability/controls/000212_tooltips.md) | A tooltip shows only for cut text | approved |
| [NF/usability/controls/000213](requirements/non-functional/usability/controls/000213_segments.md) | Segments have equal width | approved |
| [NF/usability/controls/000214](requirements/non-functional/usability/controls/000214_pill-icon.md) | A leading icon is centred on the end cap | approved |
| [NF/usability/controls/000399](requirements/non-functional/usability/controls/000399_design-basics.md) | The design has one accent and plain status text | approved |
| [NF/usability/controls/000400](requirements/non-functional/usability/controls/000400_danger-button.md) | A destructive action is an outlined red button | approved |
| [NF/usability/controls/000401](requirements/non-functional/usability/controls/000401_error-toast.md) | Errors show as a toast | approved |
| [NF/usability/controls/000410](requirements/non-functional/usability/controls/000410_tap-tint.md) | A tap tints the whole tile | approved |
| [NF/usability/controls/000412](requirements/non-functional/usability/controls/000412_ghost-rows-for-lists.md) | Ghost rows are only for lists | replaced |
| [NF/usability/controls/000416](requirements/non-functional/usability/controls/000416_empty-chart.md) | An empty chart is a grey skeleton | approved |
| [NF/usability/controls/000528](requirements/non-functional/usability/controls/000528_segment-press.md) | A pressed segment shrinks its whole control | replaced |
| [NF/usability/controls/000529](requirements/non-functional/usability/controls/000529_menu-row-tile.md) | A menu row is an inset rounded tile | approved |
| [NF/usability/controls/000560](requirements/non-functional/usability/controls/000560_no-counts-in-headings-and-selectors.md) | Headings and selectors show no counts | approved |
| [NF/usability/controls/000561](requirements/non-functional/usability/controls/000561_segment-pill.md) | A segmented control is a pill track | approved |
| [NF/usability/controls/000562](requirements/non-functional/usability/controls/000562_phone-toast-top.md) | A toast shows at the top of a phone and at the bottom end of a wide screen | approved |
| [NF/usability/controls/000563](requirements/non-functional/usability/controls/000563_phone-one-toast.md) | A phone shows one toast at a time | replaced |
| [NF/usability/controls/000564](requirements/non-functional/usability/controls/000564_phone-toast-close.md) | A toast closes by a swipe, by its close button or by its time | approved |
| [NF/usability/controls/000565](requirements/non-functional/usability/controls/000565_phone-toast-card.md) | A toast is a tinted glass card | approved |
| [NF/usability/controls/000566](requirements/non-functional/usability/controls/000566_phone-toast-icon-action.md) | A phone toast action is an icon button | replaced |
| [NF/usability/controls/000568](requirements/non-functional/usability/controls/000568_wide-toast-card.md) | A wide-screen toast is the same glass card | replaced |
| [NF/usability/controls/000570](requirements/non-functional/usability/controls/000570_avatar-stack-cover.md) | An avatar in a stack covers the one before it | approved |
| [NF/usability/controls/000576](requirements/non-functional/usability/controls/000576_load-error-toast.md) | A load error shows as a toast with a retry action | approved |
| [NF/usability/controls/000577](requirements/non-functional/usability/controls/000577_load-error-toast-stays.md) | A load error toast stays until it is closed | replaced |
| [NF/usability/controls/000581](requirements/non-functional/usability/controls/000581_card-add-buttons-dashed.md) | The add buttons of a card look like its chips with a dashed border | approved |
| [NF/usability/controls/000582](requirements/non-functional/usability/controls/000582_empty-linked-section.md) | An empty "Verknüpft" section shows an empty state | approved |
| [NF/usability/controls/000597](requirements/non-functional/usability/controls/000597_one-ghost-row-in-sections.md) | A section in a detail and a small tile show one ghost row | replaced |
| [NF/usability/controls/000603](requirements/non-functional/usability/controls/000603_one-centre-line-in-controls.md) | Text, icons and counts of a control share one centre line | approved |
| [NF/usability/controls/000604](requirements/non-functional/usability/controls/000604_count-plate-in-button.md) | A count in a button is the count plate of the kit button | approved |
| [NF/usability/controls/000613](requirements/non-functional/usability/controls/000613_one-ghost-row-holds-message.md) | One ghost row holds the message and shows no bars | replaced |
| [NF/usability/controls/000631](requirements/non-functional/usability/controls/000631_settings-row.md) | A settings row is a row of a row group, 56 px high | approved |
| [NF/usability/controls/000633](requirements/non-functional/usability/controls/000633_note-is-data-state.md) | A note shows a state of the data, not a failed request | approved |
| [NF/usability/controls/000661](requirements/non-functional/usability/controls/000661_list-search-names-the-count.md) | The search field of a list names the count | approved |
| [NF/usability/controls/000662](requirements/non-functional/usability/controls/000662_no-shown-of-total-counter.md) | A list shows no "X von Y" counter | approved |
| [NF/usability/controls/000663](requirements/non-functional/usability/controls/000663_filter-chip-label.md) | A filter chip shows its name, then name and value | approved |
| [NF/usability/controls/000665](requirements/non-functional/usability/controls/000665_empty-detail-pane-text.md) | The empty detail pane says "Kein … geöffnet" | approved |
| [NF/usability/controls/000666](requirements/non-functional/usability/controls/000666_create-wording.md) | A create form has the name of its button | approved |
| [NF/usability/controls/000667](requirements/non-functional/usability/controls/000667_status-filter-is-a-chip.md) | A list filters the status with a chip | approved |
| [NF/usability/controls/000669](requirements/non-functional/usability/controls/000669_linked-section-icon-actions.md) | The actions of a "Verknüpft" section are icon buttons | approved |
| [NF/usability/controls/000671](requirements/non-functional/usability/controls/000671_one-place-per-action.md) | A view shows an action in one place | approved |
| [NF/usability/controls/000675](requirements/non-functional/usability/controls/000675_phone-row-end.md) | A phone list row ends with a menu or with nothing | approved |
| [NF/usability/controls/000678](requirements/non-functional/usability/controls/000678_live-connection-lost-toast.md) | A lost live connection shows as a toast | approved |
| [NF/usability/controls/000700](requirements/non-functional/usability/controls/000700_date-field-relative-shortcut.md) | A date field takes a shortcut relative to today | approved |
| [NF/usability/controls/000701](requirements/non-functional/usability/controls/000701_date-shortcut-resolves-on-commit.md) | A date shortcut becomes the date when the field commits | approved |
| [NF/usability/controls/000702](requirements/non-functional/usability/controls/000702_date-shortcut-month-end.md) | A month or year shortcut stops at the end of the month | approved |
| [NF/usability/controls/000741](requirements/non-functional/usability/controls/000741_load-more-button.md) | A button that loads more rows of a list is centred with a chevron | approved |
| [NF/usability/controls/001082](requirements/non-functional/usability/controls/001082_open-label.md) | A button that opens a file says Öffnen | approved |
| [NF/usability/controls/001305](requirements/non-functional/usability/controls/001305_head-status-chip.md) | The status in the head of a page is a chip | approved |
| [NF/usability/controls/001306](requirements/non-functional/usability/controls/001306_head-meta-chips.md) | The meta line in the head of a detail is a list of chips | approved |
| [NF/usability/controls/001314](requirements/non-functional/usability/controls/001314_press-ripple.md) | A press shows a ripple | approved |
| [NF/usability/controls/001315](requirements/non-functional/usability/controls/001315_segment-ripple.md) | A pressed segment ripples only inside its segment | approved |
| [NF/usability/controls/001330](requirements/non-functional/usability/controls/001330_search-palette-concentric-corner.md) | The search window has a corner concentric with its search bar | approved |
| [NF/usability/controls/001350](requirements/non-functional/usability/controls/001350_head-actions-button-group.md) | The buttons of a head form one connected button group | approved |
| [NF/usability/controls/001351](requirements/non-functional/usability/controls/001351_selected-group-button.md) | A selected button of a group is filled and fully round | approved |
| [NF/usability/controls/001353](requirements/non-functional/usability/controls/001353_confirm-row-button-group.md) | The buttons of a dialog footer form a button group with a filled main action | approved |
| [NF/usability/controls/001354](requirements/non-functional/usability/controls/001354_every-button-in-a-group.md) | Every button of the app stands in a button group | approved |
| [NF/usability/controls/001355](requirements/non-functional/usability/controls/001355_selection-bar-grey-inset.md) | The selection bar in a list is a grey surface with an inset around its actions | approved |
| [NF/usability/controls/001356](requirements/non-functional/usability/controls/001356_public-header-button-group.md) | The buttons of the public header are one button group | approved |
| [NF/usability/controls/001360](requirements/non-functional/usability/controls/001360_empty-list-face.md) | An empty list shows a face in a ring of dots | approved |
| [NF/usability/controls/001361](requirements/non-functional/usability/controls/001361_empty-state-face-motion.md) | The face of an empty state moves until motion is reduced | approved |
| [NF/usability/controls/001362](requirements/non-functional/usability/controls/001362_empty-state-face-very-high-contrast.md) | The face of an empty state is white in very high contrast | approved |
| [NF/usability/controls/001363](requirements/non-functional/usability/controls/001363_empty-state-no-reset.md) | An empty state has no reset button | approved |
| [NF/usability/controls/001364](requirements/non-functional/usability/controls/001364_empty-state-icon-by-context.md) | The icon of an empty state names what is missing | approved |
| [NF/usability/controls/001790](requirements/non-functional/usability/controls/001790_pick-dialog-select-rows.md) | A pick dialog lists its choices as the select sheet does | approved |
| [NF/usability/controls/001791](requirements/non-functional/usability/controls/001791_pick-dialog-empty-centred.md) | The empty state of a pick dialog is centred in the list area | approved |
| [NF/usability/controls/001803](requirements/non-functional/usability/controls/001803_empty-state-face-room-above.md) | The empty-state face has room above and below | approved |
| [NF/usability/controls/001810](requirements/non-functional/usability/controls/001810_long-press-selects-in-every-list.md) | A long press selects in every list with a multiple selection | approved |
| [NF/usability/controls/001811](requirements/non-functional/usability/controls/001811_every-multi-select-list-works-the-same.md) | Every list with a multiple selection works the same | approved |
| [NF/usability/controls/001812](requirements/non-functional/usability/controls/001812_list-head-order-and-more-menu.md) | A list head has one order and the export in the ⋮ menu | approved |
| [NF/usability/controls/001870](requirements/non-functional/usability/controls/001870_open-in-link-filters.md) | A link to a list page opens the list filtered to its source | approved |
| [NF/usability/controls/001875](requirements/non-functional/usability/controls/001875_open-in-link-text-button.md) | An open-in link is a text button | approved |
| [NF/usability/controls/001892](requirements/non-functional/usability/controls/001892_one-filter-chip-size.md) | Every filter chip has the one chip look | approved |
| [NF/usability/controls/001910](requirements/non-functional/usability/controls/001910_field-button-same-height.md) | A button beside a field is as high as the field | approved |
| [NF/usability/controls/001911](requirements/non-functional/usability/controls/001911_dialog-no-footer-close.md) | A dialog has no footer button that only closes it | approved |
| [NF/usability/controls/001920](requirements/non-functional/usability/controls/001920_row-menu-on-hover.md) | The ⋮ of a list row shows only for the row in use | approved |
| [NF/usability/controls/001960](requirements/non-functional/usability/controls/001960_confirm-row-one-height.md) | Every button of a confirm row is as high as a control | approved |
| [NF/usability/controls/001961](requirements/non-functional/usability/controls/001961_meta-line-component.md) | A meta line draws its dots from the kit | approved |
| [NF/usability/controls/001962](requirements/non-functional/usability/controls/001962_row-chevron-component.md) | Every row arrow is app-row-chevron | approved |
| [NF/usability/controls/001963](requirements/non-functional/usability/controls/001963_error-text-component.md) | An error text in a dialog or a form comes from the kit | approved |
| [NF/usability/controls/001964](requirements/non-functional/usability/controls/001964_no-uppercase-text.md) | No uppercase captions or subheadings | approved |
| [NF/usability/controls/001965](requirements/non-functional/usability/controls/001965_fact-list-component.md) | A list of facts comes from one kit component | approved |
| [NF/usability/controls/001977](requirements/non-functional/usability/controls/001977_link-picker-like-global-search.md) | The link picker looks like the global search | approved |
| [NF/usability/controls/001981](requirements/non-functional/usability/controls/001981_no-open-in-row-menu.md) | The ⋮ of a list row has no "Öffnen" | approved |
| [NF/usability/controls/002012](requirements/non-functional/usability/controls/002012_round-back-button.md) | Every back button of a head is a round tonal button | approved |
| [NF/usability/controls/002290](requirements/non-functional/usability/controls/002290_back-closes-dialogs.md) | Back closes an open dialog | approved |
| [NF/usability/controls/002405](requirements/non-functional/usability/controls/002405_load-error-face.md) | A failed load without content shows the empty-state face with the error text | approved |
| [NF/usability/layout/000192](requirements/non-functional/usability/layout/000192_one-geometry.md) | All list and detail pages share one geometry | approved |
| [NF/usability/layout/000193](requirements/non-functional/usability/layout/000193_scroll-edges.md) | A scroll area cuts at the edge of a surface | approved |
| [NF/usability/layout/000194](requirements/non-functional/usability/layout/000194_phone-breakpoint.md) | The phone layout starts below 768 px | approved |
| [NF/usability/layout/000195](requirements/non-functional/usability/layout/000195_bottom-bar.md) | The phone bottom bar is fixed | approved |
| [NF/usability/layout/000196](requirements/non-functional/usability/layout/000196_phone-sheets.md) | The phone opens pickers as bottom sheets | approved |
| [NF/usability/layout/000197](requirements/non-functional/usability/layout/000197_header-actions.md) | A header has a title, at most one action and a menu | approved |
| [NF/usability/layout/000198](requirements/non-functional/usability/layout/000198_floating-actions.md) | Neu and Speichern float at the bottom | approved |
| [NF/usability/layout/000200](requirements/non-functional/usability/layout/000200_surfaces.md) | Surfaces step up | approved |
| [NF/usability/layout/000201](requirements/non-functional/usability/layout/000201_fill-or-centre.md) | Content fills its width or is centred | approved |
| [NF/usability/layout/000202](requirements/non-functional/usability/layout/000202_top-layer.md) | Dialogs and toasts are on the top layer | approved |
| [NF/usability/layout/000215](requirements/non-functional/usability/layout/000215_comments-beside.md) | Comments sit beside the fields | approved |
| [NF/usability/layout/000406](requirements/non-functional/usability/layout/000406_desktop-unchanged.md) | The phone layout does not change the desktop | approved |
| [NF/usability/layout/000407](requirements/non-functional/usability/layout/000407_mehr-and-search.md) | Mehr and Suche are always in reach | approved |
| [NF/usability/layout/000408](requirements/non-functional/usability/layout/000408_bottom-inset.md) | Fixed bottom elements sit above the bottom bar | approved |
| [NF/usability/layout/000409](requirements/non-functional/usability/layout/000409_phone-panes.md) | The phone shows tables as cards | approved |
| [NF/usability/layout/000413](requirements/non-functional/usability/layout/000413_card-mode.md) | A table in card mode keeps its controls in the card head | approved |
| [NF/usability/layout/000414](requirements/non-functional/usability/layout/000414_admin-heading.md) | Admin pages share one heading | approved |
| [NF/usability/layout/000415](requirements/non-functional/usability/layout/000415_balanced-bars.md) | Bars and headers are vertically balanced | approved |
| [NF/usability/layout/000417](requirements/non-functional/usability/layout/000417_antraege-pattern.md) | Work lists follow the Anträge pattern | approved |
| [NF/usability/layout/000451](requirements/non-functional/usability/layout/000451_phone-one-pane.md) | The phone shows one pane at a time | approved |
| [NF/usability/layout/000452](requirements/non-functional/usability/layout/000452_phone-dialog-sheet.md) | A phone dialog is a near-fullscreen sheet | approved |
| [NF/usability/layout/000527](requirements/non-functional/usability/layout/000527_glass-list-head.md) | A list head is solid on a wide screen and glass on a phone | replaced |
| [NF/usability/layout/000531](requirements/non-functional/usability/layout/000531_head-under-sheet.md) | The page head stays in view under an open sheet | approved |
| [NF/usability/layout/000532](requirements/non-functional/usability/layout/000532_stacked-glass.md) | A sheet over a sheet is as opaque as the first one | approved |
| [NF/usability/layout/000567](requirements/non-functional/usability/layout/000567_phone-fab-folds.md) | A phone FAB folds to its icon on scroll | approved |
| [NF/usability/layout/000575](requirements/non-functional/usability/layout/000575_card-sheet-cut-at-edge.md) | The details of a card cut at the lower screen edge | replaced |
| [NF/usability/layout/000580](requirements/non-functional/usability/layout/000580_card-end-clears-bottom-bar.md) | The end of a card keeps room above the bottom bar | approved |
| [NF/usability/layout/000599](requirements/non-functional/usability/layout/000599_glass-head-top-fade.md) | A glass list head fades into the page colour at the top screen edge | replaced |
| [NF/usability/layout/000601](requirements/non-functional/usability/layout/000601_scrollbar-below-glass-head.md) | The scroll bar of a list column starts below its head | approved |
| [NF/usability/layout/000602](requirements/non-functional/usability/layout/000602_composer-bottom-gap.md) | The comment input has the same gap below as at its side | approved |
| [NF/usability/layout/000609](requirements/non-functional/usability/layout/000609_attendance-matrix-row-group.md) | The attendance matrix looks like a row group | approved |
| [NF/usability/layout/000634](requirements/non-functional/usability/layout/000634_admin-record-row.md) | A record row in Verwaltung has one anatomy | approved |
| [NF/usability/layout/000635](requirements/non-functional/usability/layout/000635_discard-with-save.md) | A page with Speichern offers Verwerfen in its header | approved |
| [NF/usability/layout/000660](requirements/non-functional/usability/layout/000660_nav-rail-shows-active-item.md) | The navigation rail shows the active item | approved |
| [NF/usability/layout/000664](requirements/non-functional/usability/layout/000664_list-opens-no-item-by-itself.md) | A list page opens no item by itself | approved |
| [NF/usability/layout/000670](requirements/non-functional/usability/layout/000670_detail-head-icons-and-menu.md) | A detail head has icon buttons and a menu | approved |
| [NF/usability/layout/000672](requirements/non-functional/usability/layout/000672_content-language-in-page-head.md) | The language of a content editor stands in the page head | approved |
| [NF/usability/layout/000673](requirements/non-functional/usability/layout/000673_phone-detail-tabs-packed.md) | The tabs of a phone detail are packed at the start | approved |
| [NF/usability/layout/000674](requirements/non-functional/usability/layout/000674_phone-vote-detail-bar.md) | The phone vote detail uses the bar of the other details | approved |
| [NF/usability/layout/000677](requirements/non-functional/usability/layout/000677_public-page-title-size.md) | A public page has a title of 28 px | approved |
| [NF/usability/layout/000743](requirements/non-functional/usability/layout/000743_week-day-lines-on-pull.md) | The day lines of the week grid stay when the hours are pulled | approved |
| [NF/usability/layout/000745](requirements/non-functional/usability/layout/000745_week-blocks-overlap.md) | A later entry lies on an earlier one in the week view | approved |
| [NF/usability/layout/001016](requirements/non-functional/usability/layout/001016_no-sticky-bar-in-tab-pager.md) | A search bar in a paged tab does not stick | approved |
| [NF/usability/layout/001079](requirements/non-functional/usability/layout/001079_file-viewer-above-everything.md) | The file viewer lies above everything | approved |
| [NF/usability/layout/001081](requirements/non-functional/usability/layout/001081_phone-pdf-system-viewer.md) | A PDF on a phone opens in the system viewer | approved |
| [NF/usability/layout/001084](requirements/non-functional/usability/layout/001084_file-viewer-glass-bar.md) | The file viewer is dark frosted glass | approved |
| [NF/usability/layout/001340](requirements/non-functional/usability/layout/001340_detail-head-equal-inset.md) | A detail head is as far from the top as from the side | approved |
| [NF/usability/layout/001341](requirements/non-functional/usability/layout/001341_dialog-head-equal-inset.md) | A dialog or sheet head is as far from the top as from the side | approved |
| [NF/usability/layout/001440](requirements/non-functional/usability/layout/001440_agenda-pane-split-head.md) | The agenda beside the protocol is a split head over its list | approved |
| [NF/usability/layout/001441](requirements/non-functional/usability/layout/001441_rail-scroll-surface.md) | The scroll part of the navigation rail is a surface | approved |
| [NF/usability/layout/001442](requirements/non-functional/usability/layout/001442_board-own-surface.md) | Each board lies on a surface of its own | approved |
| [NF/usability/layout/001443](requirements/non-functional/usability/layout/001443_agenda-items-split-boxes.md) | The TOPs beside the protocol are split boxes like the agenda head | approved |
| [NF/usability/layout/001481](requirements/non-functional/usability/layout/001481_admin-list-rows.md) | A row of the Verwaltung list is an ordinary list row | approved |
| [NF/usability/layout/001500](requirements/non-functional/usability/layout/001500_list-title-on-search-edge.md) | A wide list column has no visible title and puts its buttons beside the search | approved |
| [NF/usability/layout/001770](requirements/non-functional/usability/layout/001770_calendar-day-row-group.md) | The entries of the picked day are a row group without a frame | approved |
| [NF/usability/layout/001780](requirements/non-functional/usability/layout/001780_calendar-month-segments.md) | Each day of the month grid is a segment of its own | approved |
| [NF/usability/layout/001890](requirements/non-functional/usability/layout/001890_form-head-bar.md) | A form in place of a detail has the head bar of "Antrag bearbeiten" | approved |
| [NF/usability/layout/001891](requirements/non-functional/usability/layout/001891_form-head-cancel-inset.md) | The label of "Abbrechen" in a form head ends at the side inset | approved |
| [NF/usability/layout/001895](requirements/non-functional/usability/layout/001895_scroll-lock-any-close-order.md) | The page scrolls again when the last overlay closes, in any order | approved |
| [NF/usability/layout/001930](requirements/non-functional/usability/layout/001930_pane-page-rail-stays.md) | A pane page scrolls inside itself, so the rail stays in place | approved |
| [NF/usability/layout/001931](requirements/non-functional/usability/layout/001931_wide-list-head-solid.md) | The head of a wide list column stays solid, also on a fast scroll | replaced |
| [NF/usability/layout/001946](requirements/non-functional/usability/layout/001946_calendar-chips-below-search.md) | The Kalender filter chips stand in a row of their own below the search | approved |
| [NF/usability/layout/002010](requirements/non-functional/usability/layout/002010_solid-bars.md) | Bars and heads are solid, and only floating boxes are glass | approved |
| [NF/usability/layout/002011](requirements/non-functional/usability/layout/002011_bar-edge-visible.md) | No resting surface at the edge of a bar has the colour of the bar | approved |
| [NF/usability/layout/002291](requirements/non-functional/usability/layout/002291_footer-on-request.md) | The shell shows the footer only on a screen that asks for it | approved |
| [NF/usability/layout/002420](requirements/non-functional/usability/layout/002420_head-opaque-before-script.md) | A head is opaque before the page notes that content scrolls under it | approved |
| [S/framework/actions/002219](style/framework/actions/002219_action-model.md) | An action is data, and the screen places it | approved |
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
| [S/framework/architecture/002213](style/framework/architecture/002213_style-ratchet.md) | The style lines of an app only fall until they reach zero | approved |
| [S/framework/config/002224](style/framework/config/002224_routes-from-helpers.md) | An app builds the routes of a screen with a kit helper | approved |
| [S/framework/config/002225](style/framework/config/002225_ports.md) | App data reaches the shell only through ports | approved |
| [S/framework/config/002226](style/framework/config/002226_display-settings-in-shell.md) | The display settings and the accessibility menu are part of the shell | approved |
| [S/framework/forms/002222](style/framework/forms/002222_form-definition.md) | A form is built from a definition | approved |
| [S/framework/forms/002255](style/framework/forms/002255_field-def.md) | A field of a form is a FieldDef of a fixed kind | approved |
| [S/framework/forms/002256](style/framework/forms/002256_form-behaviour.md) | A form reports its value, its validity and its dirty state | approved |
| [S/framework/material/002293](style/framework/material/002293_material-inside-wrappers.md) | A kit component may use an M3 component of Angular Material inside | approved |
| [S/framework/material/002294](style/framework/material/002294_material-tokens-from-kit.md) | The M3 system tokens of Material come from the kit tokens | approved |
| [S/framework/material/002295](style/framework/material/002295_material-display-modes.md) | The display modes reach the Material components | approved |
| [S/framework/overlays/002251](style/framework/overlays/002251_dialog.md) | A dialog has a head, a body and a footer group | approved |
| [S/framework/overlays/002252](style/framework/overlays/002252_sheets.md) | Side sheets, bottom sheets and select sheets have one frame | approved |
| [S/framework/overlays/002253](style/framework/overlays/002253_toasts.md) | A toast is sent through the toast service | approved |
| [S/framework/packages/002214](style/framework/packages/002214_entry-points.md) | The kit has six kinds of entry points | approved |
| [S/framework/packages/002215](style/framework/packages/002215_layer-direction.md) | An entry point imports only the layers below it | approved |
| [S/framework/screens/002216](style/framework/screens/002216_screen-anatomy.md) | A screen has a head, a body and fixed places for the rest | approved |
| [S/framework/screens/002217](style/framework/screens/002217_screen-inputs.md) | A screen takes its frame as data and its content as slots | approved |
| [S/framework/screens/002218](style/framework/screens/002218_list-detail-contract.md) | The list/detail screen owns the list, the panes and the URL state | approved |
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
| [S/framework/screens/002257](style/framework/screens/002257_records-screen.md) | The records screen has a fixed interface | approved |
| [S/framework/screens/002258](style/framework/screens/002258_record-section.md) | The record section has a fixed interface | approved |
| [S/framework/screens/002259](style/framework/screens/002259_sections-screen.md) | The sections screen has a fixed interface | approved |
| [S/framework/shell/002260](style/framework/shell/002260_framework-config.md) | provideFramework takes one FrameworkConfig | approved |
| [S/framework/shell/002261](style/framework/shell/002261_port-types.md) | The ports have fixed types | approved |
| [S/framework/shell/002262](style/framework/shell/002262_route-helpers.md) | The route helpers have fixed signatures | approved |
| [S/framework/shell/002263](style/framework/shell/002263_frames.md) | The shell has four frames | approved |
| [S/framework/shell/002264](style/framework/shell/002264_menus.md) | The help, accessibility and account menus come from the shell | approved |
| [S/framework/shell/002292](style/framework/shell/002292_barrier-report-entry.md) | The accessibility menu has an entry to report a barrier | approved |
| [S/framework/state/002220](style/framework/state/002220_load-state.md) | A load state is one type for every view | approved |
| [S/framework/state/002221](style/framework/state/002221_ui-state-in-kit.md) | A kit component holds its UI state and the app holds the data | approved |
| [S/framework/testing/002228](style/framework/testing/002228_tests-in-kit.md) | The kit tests a view, the app tests its adapter | approved |
| [S/framework/testing/002229](style/framework/testing/002229_api-change.md) | A change of a public kit API comes with the change of every app | approved |
| [S/framework/texts/002223](style/framework/texts/002223_kit-catalogue.md) | The texts of the kit have keys that an admin can override | approved |
| [S/framework/types/002230](style/framework/types/002230_screen-head.md) | The head of a screen is a ScreenHead | approved |
| [S/framework/types/002231](style/framework/types/002231_action-type.md) | The Action type has a fixed set of fields | approved |
| [S/framework/types/002232](style/framework/types/002232_list-row.md) | A row of a list is a ListRow | approved |
| [S/framework/types/002233](style/framework/types/002233_filter-sort-search.md) | Filters, sort and search are FilterDef, SortDef and SearchDef | approved |
| [S/framework/types/002234](style/framework/types/002234_load-state-type.md) | LoadState has four cases | approved |
| [S/framework/types/002235](style/framework/types/002235_screen-tab.md) | A tab of a screen is a ScreenTab with a slot | approved |
| [S/framework/types/002236](style/framework/types/002236_route-link.md) | A link is a RouteLink | approved |
| [S/framework/views/002227](style/framework/views/002227_view-contract.md) | Each domain view has a contract spec before it is built | approved |
| [S/framework/views/002270](style/framework/views/002270_graph-view.md) | The graph view takes nodes and edges | approved |
| [S/framework/views/002271](style/framework/views/002271_board-view.md) | The board views take the board, the rows, the list and the tiles | approved |
| [S/framework/views/002272](style/framework/views/002272_calendar-view.md) | The calendar views take the grid, the week, the day list and the entry sheets | approved |
| [S/framework/views/002273](style/framework/views/002273_protocol-view.md) | The protocol views take the TOP sheet and the protocol bar | approved |
| [S/framework/views/002274](style/framework/views/002274_voting-view.md) | The voting views take votes, ballots and a voting port | approved |
| [S/framework/views/002275](style/framework/views/002275_meeting-view.md) | The meeting views take the agenda, the attendance and the dock | approved |
| [S/framework/views/002276](style/framework/views/002276_chat-view.md) | The chat view takes messages, events and a file port | approved |
| [S/framework/views/002277](style/framework/views/002277_flow-editor-view.md) | The flow editor takes a FlowGraph | approved |
| [S/framework/views/002278](style/framework/views/002278_form-editor-view.md) | The form editor edits a FormDef | approved |
| [S/framework/views/002279](style/framework/views/002279_plan-table-view.md) | The plan table takes rows as a tree | approved |
| [S/framework/views/002280](style/framework/views/002280_activity-view.md) | The activity view takes entries | approved |
| [S/frontend/angular/000077](style/frontend/angular/000077_load-bar.md) | Only foreground reads show the load bar | replaced |
| [S/frontend/angular/000395](style/frontend/angular/000395_semantic-tokens.md) | Components use semantic colour tokens | approved |
| [S/frontend/angular/000632](style/frontend/angular/000632_admin-load-state.md) | An admin page shows its load states through app-load-state | approved |
| [S/frontend/angular/000636](style/frontend/angular/000636_no-unused-class.md) | A component stylesheet has no class without a use | approved |
| [S/frontend/angular/000637](style/frontend/angular/000637_admin-container-widths.md) | Container queries in Verwaltung use three named widths | approved |
| [S/specs/sharing/002210](style/specs/sharing/002210_what-lives-in-the-kit.md) | A spec about the look and the behaviour of the UI lives in the kit | approved |
| [S/specs/sharing/002211](style/specs/sharing/002211_shared-numbers.md) | The kit and its apps share one number space | approved |
| [S/specs/sharing/002212](style/specs/sharing/002212_cross-repo-reference.md) | A reference to a spec of another repository names the repository | approved |
