# Spec migration from STUPA-Workflow to the kit

This list holds every spec of STUPA-Workflow `specs/` that is in force (draft or approved) and
moves to the kit or splits by the rule `S/specs/sharing/002210`. Every other spec stays in the
app. A moved spec keeps its number, its file name and its folder path (002211). The list goes
away in the pull request that does the last move.

Move: 248 · split: 11 · stay: 861

## Move

| Number | Folder | Title | Note |
| --- | --- | --- | --- |
| 000165 | functional/administration/admin | Verwaltung keeps its frame widths | frame widths of the admin screen |
| 001080 | functional/administration/files | A download of a viewable file opens the file viewer | a viewable download opens the file viewer |
| 000131 | functional/applications/applications | Comments open from a header button | comments open from a head button |
| 001185 | functional/applications/applications | The blocks of step 1 have one even spacing | even spacing of the type step |
| 001703 | functional/applications/applications | The bulk result shows success or error per Antrag | bulk result per item |
| 000137 | functional/applications/flow | The flow editor lays out automatically | auto layout of the flow editor |
| 000283 | functional/applications/forms | Section fields make wizard steps | sections make wizard steps |
| 001277 | functional/collaboration/activity | An activity row names the item, the actor, the change and the time | anatomy of an activity row |
| 001425 | functional/collaboration/graph | The graph has filters above the drawing | filters above the graph |
| 001426 | functional/collaboration/graph | The graph builds up piece by piece | graph builds up |
| 001427 | functional/collaboration/graph | The graph does not move with reduced motion | graph reduced motion |
| 001428 | functional/collaboration/graph | The drawing has a text alternative | graph text alternative |
| 001429 | functional/collaboration/graph | A press on a node shows the element and its neighbours | press on a node |
| 001430 | functional/collaboration/graph | A node shows the icon and the colour of its kind | node icon and colour |
| 001433 | functional/collaboration/graph | A drag moves a node of the graph | drag a node |
| 000148 | functional/collaboration/todos | One move sheet | one move sheet |
| 001074 | functional/collaboration/todos | One search field picks Gremien and persons | one picker for groups and persons |
| 001380 | functional/collaboration/todos | The move sheet lists the columns as the select sheet does | move sheet rows |
| 001967 | functional/collaboration/todos | The menu of a board column stands in its top right corner | column menu corner |
| 000146 | functional/finance/budget | The budget legend matches the drawing | chart legend |
| 001020 | functional/finance/budget | The amounts of a plan table end on one edge | amounts on one edge |
| 000726 | functional/meetings/calendar | The Kalender on the phone is a list of days | phone calendar is a day list |
| 000728 | functional/meetings/calendar | The desktop Kalender has a week and a month view | week and month view |
| 000744 | functional/meetings/calendar | A timed entry over several days is a block on each of its days in the week view | multi-day block |
| 000746 | functional/meetings/calendar | The week view shows the whole day from 00:00 to 24:00 | week view 00-24 |
| 001771 | functional/meetings/calendar | The desktop Kalender has no visible title and its buttons end the tools row | calendar head row |
| 000100 | functional/meetings/meetings | An agenda row has a subtitle only for an Antrag | agenda row subtitle |
| 000101 | functional/meetings/meetings | A TOP with an Antrag shows the Antrag as its first row | first row of an item |
| 000607 | functional/meetings/meetings | An agenda row shows no drag handle | no drag handle |
| 000610 | functional/meetings/meetings | A month without a meeting is a narrow column with a dash | empty month column |
| 000611 | functional/meetings/meetings | An attendance cell holds its badges | attendance cell badges |
| 001460 | functional/meetings/meetings | The vote cards of an item are in a side sheet | vote cards in a side sheet |
| 001461 | functional/meetings/meetings | On a phone an open vote takes the place of the text | phone vote replaces text |
| 001800 | functional/meetings/meetings | The linked rows of an item are in a side sheet | linked rows in a side sheet |
| 001801 | functional/meetings/meetings | A tab at the end edge opens the attendance | edge tab |
| 001802 | functional/meetings/meetings | The vote sheet has its add button in the head and an empty state | vote sheet head and empty state |
| 000689 | functional/meetings/protocols | Internal views show a marked segment as marked | marked segment in internal views |
| 000690 | functional/meetings/protocols | The format bar marks a segment for blackout | format bar blackout tool |
| 000863 | functional/meetings/protocols | An embedded PDF shows as a file badge | embedded PDF badge |
| 000873 | functional/meetings/protocols | A toolbar tool inserts a time note | time note tool |
| 000969 | functional/meetings/protocols | The editor blacks out a known name after it is typed | blackout of known names while typing |
| 001304 | functional/meetings/protocols | The protocol state and its actions sit in the meeting head | state and actions in the head |
| 001006 | functional/meetings/voting | The vote card states the result once | vote card result once |
| 001007 | functional/meetings/voting | The vote card has one main action and a menu | vote card main action and menu |
| 000688 | functional/public/public-pages | A black bar has one fixed width and the text colour | black bar width and colour |
| 000490 | non-functional/accessibility/conformance | Every view meets WCAG 2.2 level AA |  |
| 000493 | non-functional/accessibility/conformance | Every shared component has a jest-axe test |  |
| 000217 | non-functional/accessibility/interaction | Controls are reachable by keyboard and named |  |
| 000218 | non-functional/accessibility/interaction | Light and dark themes are both supported |  |
| 000219 | non-functional/accessibility/interaction | Motion follows the reduced motion setting |  |
| 000508 | non-functional/accessibility/interaction | The focus ring is 2 px and has a contrast of 3:1 |  |
| 000509 | non-functional/accessibility/interaction | Sticky bars do not hide the focus |  |
| 000510 | non-functional/accessibility/interaction | A skip link goes to the main content |  |
| 000511 | non-functional/accessibility/interaction | Each page has its own title |  |
| 000512 | non-functional/accessibility/interaction | Focus goes to the heading after navigation |  |
| 000513 | non-functional/accessibility/interaction | A dialog keeps the focus inside |  |
| 000514 | non-functional/accessibility/interaction | Each gesture has a single tap alternative |  |
| 000515 | non-functional/accessibility/interaction | Each drag has an alternative without a drag |  |
| 000516 | non-functional/accessibility/interaction | A target is at least 24 by 24 px |  |
| 000517 | non-functional/accessibility/interaction | A status message is announced |  |
| 000518 | non-functional/accessibility/interaction | The live vote announces its changes |  |
| 000519 | non-functional/accessibility/interaction | A form error is a text next to the field |  |
| 000520 | non-functional/accessibility/interaction | Each page has landmarks and one h1 |  |
| 000522 | non-functional/accessibility/language | The page language follows the UI language |  |
| 000523 | non-functional/accessibility/language | Content in a different language has its lang |  |
| 000499 | non-functional/accessibility/perception | Text has a contrast of 4.5:1 |  |
| 000500 | non-functional/accessibility/perception | Control edges and icons have a contrast of 3:1 |  |
| 000502 | non-functional/accessibility/perception | Colour is not the only sign of a state |  |
| 000503 | non-functional/accessibility/perception | Every view works at a width of 320 px |  |
| 000504 | non-functional/accessibility/perception | User text spacing does not cut text |  |
| 000506 | non-functional/accessibility/perception | A Markdown image has an alternative text |  |
| 000507 | non-functional/accessibility/perception | A chart has a text alternative |  |
| 000593 | non-functional/accessibility/settings | The accessibility menu holds the display settings |  |
| 000594 | non-functional/accessibility/settings | A display setting overrides the system setting |  |
| 000595 | non-functional/accessibility/settings | More contrast raises the contrast of text and borders |  |
| 000596 | non-functional/accessibility/settings | Less transparency makes the glass surfaces opaque |  |
| 000598 | non-functional/accessibility/settings | Very high contrast highlights the fields black on yellow |  |
| 000605 | non-functional/accessibility/settings | Very high contrast shows the app in four colours |  |
| 000606 | non-functional/accessibility/settings | Very high contrast includes the other display settings |  |
| 000608 | non-functional/accessibility/settings | The display reset lines up with the heading and the switches |  |
| 000612 | non-functional/accessibility/settings | The attendance matrix follows very high contrast |  |
| 000614 | non-functional/accessibility/settings | In very high contrast, yellow shows what a person can press |  |
| 000615 | non-functional/accessibility/settings | In very high contrast, the chosen control of a choice is yellow filled |  |
| 000616 | non-functional/accessibility/settings | In very high contrast, the navigation has yellow text and yellow icons |  |
| 000617 | non-functional/accessibility/settings | In very high contrast, every menu is black with yellow rows |  |
| 000618 | non-functional/accessibility/settings | In very high contrast, a choice card has a yellow edge and a yellow circle |  |
| 000619 | non-functional/accessibility/settings | In very high contrast, a row that opens something has a yellow title |  |
| 000620 | non-functional/accessibility/settings | In very high contrast, a switch, a checkbox and a radio button are filled only when on |  |
| 000621 | non-functional/accessibility/settings | In very high contrast, everything on a yellow fill is black |  |
| 000622 | non-functional/accessibility/settings | A heading that a script focuses shows no focus ring |  |
| 000623 | non-functional/accessibility/settings | A script reads the motion setting, not the system |  |
| 000647 | non-functional/accessibility/settings | Accessibility has its own menu |  |
| 000739 | non-functional/accessibility/settings | In very high contrast, a box with a text to copy is a yellow fill |  |
| 001352 | non-functional/accessibility/settings | In very high contrast, a head group is yellow with black gaps |  |
| 001980 | non-functional/accessibility/settings | In very high contrast, a tab bar is one group with a yellow bar under the open tab |  |
| 000220 | non-functional/compatibility/pwa | Zoom is blocked only in the installed app |  |
| 000221 | non-functional/compatibility/pwa | The Android navigation bar has the manifest colour |  |
| 000222 | non-functional/compatibility/pwa | The app shows update and offline bars |  |
| 000411 | non-functional/compatibility/pwa | The status bar follows the theme |  |
| 000578 | non-functional/compatibility/pwa | The offline bar shows when the server is unreachable |  |
| 000579 | non-functional/compatibility/pwa | An unreachable server shows no error toast, and the page loads again |  |
| 000189 | non-functional/performance/loading | The load bar shows only for slow foreground reads | load bar |
| 000191 | non-functional/performance/loading | Search runs as you type | search as you type |
| 000893 | non-functional/performance/loading | A skeleton has the shape of the loaded page | skeleton shape |
| 000203 | non-functional/usability/controls | Every dropdown uses the app popover |  |
| 000204 | non-functional/usability/controls | The whole control is clickable |  |
| 000205 | non-functional/usability/controls | Empty states use one component |  |
| 000206 | non-functional/usability/controls | The UI has no helper texts |  |
| 000208 | non-functional/usability/controls | A separator stands only between two items |  |
| 000209 | non-functional/usability/controls | URLs, IBANs and e-mail addresses are never cut |  |
| 000211 | non-functional/usability/controls | A swipe never deletes |  |
| 000212 | non-functional/usability/controls | A tooltip shows only for cut text |  |
| 000213 | non-functional/usability/controls | Segments have equal width |  |
| 000214 | non-functional/usability/controls | A leading icon is centred on the end cap |  |
| 000399 | non-functional/usability/controls | The design has one accent and plain status text |  |
| 000400 | non-functional/usability/controls | A destructive action is an outlined red button |  |
| 000401 | non-functional/usability/controls | Errors show as a toast |  |
| 000410 | non-functional/usability/controls | A tap tints the whole tile |  |
| 000416 | non-functional/usability/controls | An empty chart is a grey skeleton |  |
| 000529 | non-functional/usability/controls | A menu row is an inset rounded tile |  |
| 000560 | non-functional/usability/controls | Headings and selectors show no counts |  |
| 000561 | non-functional/usability/controls | A segmented control is a pill track |  |
| 000562 | non-functional/usability/controls | A toast shows at the top of a phone and at the bottom end of a wide screen |  |
| 000564 | non-functional/usability/controls | A toast closes by a swipe, by its close button or by its time |  |
| 000565 | non-functional/usability/controls | A toast is a tinted glass card |  |
| 000570 | non-functional/usability/controls | An avatar in a stack covers the one before it |  |
| 000576 | non-functional/usability/controls | A load error shows as a toast with a retry action |  |
| 000581 | non-functional/usability/controls | The add buttons of a card look like its chips with a dashed border |  |
| 000582 | non-functional/usability/controls | An empty "Verknüpft" section shows an empty state |  |
| 000603 | non-functional/usability/controls | Text, icons and counts of a control share one centre line |  |
| 000604 | non-functional/usability/controls | A count in a button is the count plate of the kit button |  |
| 000631 | non-functional/usability/controls | A settings row is a row of a row group, 56 px high |  |
| 000633 | non-functional/usability/controls | A note shows a state of the data, not a failed request |  |
| 000661 | non-functional/usability/controls | The search field of a list names the count |  |
| 000662 | non-functional/usability/controls | A list shows no "X von Y" counter |  |
| 000663 | non-functional/usability/controls | A filter chip shows its name, then name and value |  |
| 000665 | non-functional/usability/controls | The empty detail pane says "Kein … geöffnet" |  |
| 000666 | non-functional/usability/controls | A create form has the name of its button |  |
| 000667 | non-functional/usability/controls | A list filters the status with a chip |  |
| 000669 | non-functional/usability/controls | The actions of a "Verknüpft" section are icon buttons |  |
| 000671 | non-functional/usability/controls | A view shows an action in one place |  |
| 000675 | non-functional/usability/controls | A phone list row ends with a menu or with nothing |  |
| 000678 | non-functional/usability/controls | A lost live connection shows as a toast |  |
| 000700 | non-functional/usability/controls | A date field takes a shortcut relative to today |  |
| 000701 | non-functional/usability/controls | A date shortcut becomes the date when the field commits |  |
| 000702 | non-functional/usability/controls | A month or year shortcut stops at the end of the month |  |
| 000741 | non-functional/usability/controls | A button that loads more rows of a list is centred with a chevron |  |
| 001082 | non-functional/usability/controls | A button that opens a file says Öffnen |  |
| 001305 | non-functional/usability/controls | The status in the head of a page is a chip |  |
| 001306 | non-functional/usability/controls | The meta line in the head of a detail is a list of chips |  |
| 001314 | non-functional/usability/controls | A press shows a ripple |  |
| 001315 | non-functional/usability/controls | A pressed segment ripples only inside its segment |  |
| 001330 | non-functional/usability/controls | The search window has a corner concentric with its search bar |  |
| 001350 | non-functional/usability/controls | The buttons of a head form one connected button group |  |
| 001351 | non-functional/usability/controls | A selected button of a group is filled and fully round |  |
| 001353 | non-functional/usability/controls | The buttons of a dialog footer form a button group with a filled main action |  |
| 001354 | non-functional/usability/controls | Every button of the app stands in a button group |  |
| 001355 | non-functional/usability/controls | The selection bar in a list is a grey surface with an inset around its actions |  |
| 001356 | non-functional/usability/controls | The buttons of the public header are one button group |  |
| 001360 | non-functional/usability/controls | An empty list shows a face in a ring of dots |  |
| 001361 | non-functional/usability/controls | The face of an empty state moves until motion is reduced |  |
| 001362 | non-functional/usability/controls | The face of an empty state is white in very high contrast |  |
| 001363 | non-functional/usability/controls | An empty state has no reset button |  |
| 001364 | non-functional/usability/controls | The icon of an empty state names what is missing |  |
| 001790 | non-functional/usability/controls | A pick dialog lists its choices as the select sheet does |  |
| 001791 | non-functional/usability/controls | The empty state of a pick dialog is centred in the list area |  |
| 001803 | non-functional/usability/controls | The empty-state face has room above and below |  |
| 001810 | non-functional/usability/controls | A long press selects in every list with a multiple selection |  |
| 001811 | non-functional/usability/controls | Every list with a multiple selection works the same |  |
| 001812 | non-functional/usability/controls | A list head has one order and the export in the ⋮ menu |  |
| 001870 | non-functional/usability/controls | A link to a list page opens the list filtered to its source |  |
| 001875 | non-functional/usability/controls | An open-in link is a text button |  |
| 001892 | non-functional/usability/controls | Every filter chip has the one chip look |  |
| 001910 | non-functional/usability/controls | A button beside a field is as high as the field |  |
| 001911 | non-functional/usability/controls | A dialog has no footer button that only closes it |  |
| 001920 | non-functional/usability/controls | The ⋮ of a list row shows only for the row in use |  |
| 001960 | non-functional/usability/controls | Every button of a confirm row is as high as a control |  |
| 001961 | non-functional/usability/controls | A meta line draws its dots from the kit |  |
| 001962 | non-functional/usability/controls | Every row arrow is app-row-chevron |  |
| 001963 | non-functional/usability/controls | An error text in a dialog or a form comes from the kit |  |
| 001964 | non-functional/usability/controls | No uppercase captions or subheadings |  |
| 001965 | non-functional/usability/controls | A list of facts comes from one kit component |  |
| 001977 | non-functional/usability/controls | The link picker looks like the global search |  |
| 001981 | non-functional/usability/controls | The ⋮ of a list row has no "Öffnen" |  |
| 000192 | non-functional/usability/layout | All list and detail pages share one geometry |  |
| 000193 | non-functional/usability/layout | A scroll area cuts at the edge of a surface |  |
| 000194 | non-functional/usability/layout | The phone layout starts below 768 px |  |
| 000195 | non-functional/usability/layout | The phone bottom bar is fixed |  |
| 000196 | non-functional/usability/layout | The phone opens pickers as bottom sheets |  |
| 000197 | non-functional/usability/layout | A header has a title, at most one action and a menu |  |
| 000198 | non-functional/usability/layout | Neu and Speichern float at the bottom |  |
| 000200 | non-functional/usability/layout | Surfaces step up |  |
| 000201 | non-functional/usability/layout | Content fills its width or is centred |  |
| 000202 | non-functional/usability/layout | Dialogs and toasts are on the top layer |  |
| 000215 | non-functional/usability/layout | Comments sit beside the fields |  |
| 000406 | non-functional/usability/layout | The phone layout does not change the desktop |  |
| 000407 | non-functional/usability/layout | Mehr and Suche are always in reach |  |
| 000408 | non-functional/usability/layout | Fixed bottom elements sit above the bottom bar |  |
| 000409 | non-functional/usability/layout | The phone shows tables as cards |  |
| 000413 | non-functional/usability/layout | A table in card mode keeps its controls in the card head |  |
| 000414 | non-functional/usability/layout | Admin pages share one heading |  |
| 000415 | non-functional/usability/layout | Bars and headers are vertically balanced |  |
| 000417 | non-functional/usability/layout | Work lists follow the Anträge pattern |  |
| 000451 | non-functional/usability/layout | The phone shows one pane at a time |  |
| 000452 | non-functional/usability/layout | A phone dialog is a near-fullscreen sheet |  |
| 000527 | non-functional/usability/layout | A list head is solid on a wide screen and glass on a phone |  |
| 000531 | non-functional/usability/layout | The page head stays in view under an open sheet |  |
| 000532 | non-functional/usability/layout | A sheet over a sheet is as opaque as the first one |  |
| 000567 | non-functional/usability/layout | A phone FAB folds to its icon on scroll |  |
| 000580 | non-functional/usability/layout | The end of a card keeps room above the bottom bar |  |
| 000601 | non-functional/usability/layout | The scroll bar of a list column starts below its glass head |  |
| 000602 | non-functional/usability/layout | The comment input has the same gap below as at its side |  |
| 000609 | non-functional/usability/layout | The attendance matrix looks like a row group |  |
| 000634 | non-functional/usability/layout | A record row in Verwaltung has one anatomy |  |
| 000635 | non-functional/usability/layout | A page with Speichern offers Verwerfen in its header |  |
| 000660 | non-functional/usability/layout | The navigation rail shows the active item |  |
| 000664 | non-functional/usability/layout | A list page opens no item by itself |  |
| 000670 | non-functional/usability/layout | A detail head has icon buttons and a menu |  |
| 000672 | non-functional/usability/layout | The language of a content editor stands in the page head |  |
| 000673 | non-functional/usability/layout | The tabs of a phone detail are packed at the start |  |
| 000674 | non-functional/usability/layout | The phone vote detail uses the bar of the other details |  |
| 000677 | non-functional/usability/layout | A public page has a title of 28 px |  |
| 000743 | non-functional/usability/layout | The day lines of the week grid stay when the hours are pulled |  |
| 000745 | non-functional/usability/layout | A later entry lies on an earlier one in the week view |  |
| 001016 | non-functional/usability/layout | A search bar in a paged tab does not stick |  |
| 001079 | non-functional/usability/layout | The file viewer lies above everything |  |
| 001081 | non-functional/usability/layout | A PDF on a phone opens in the system viewer |  |
| 001084 | non-functional/usability/layout | The file viewer is dark frosted glass |  |
| 001340 | non-functional/usability/layout | A detail head is as far from the top as from the side |  |
| 001341 | non-functional/usability/layout | A dialog or sheet head is as far from the top as from the side |  |
| 001440 | non-functional/usability/layout | The agenda beside the protocol is a split head over its list |  |
| 001441 | non-functional/usability/layout | The scroll part of the navigation rail is a surface |  |
| 001442 | non-functional/usability/layout | Each board lies on a surface of its own |  |
| 001443 | non-functional/usability/layout | The TOPs beside the protocol are split boxes like the agenda head |  |
| 001481 | non-functional/usability/layout | A row of the Verwaltung list is an ordinary list row |  |
| 001500 | non-functional/usability/layout | A wide list column has no visible title and puts its buttons beside the search |  |
| 001770 | non-functional/usability/layout | The entries of the picked day are a row group without a frame |  |
| 001780 | non-functional/usability/layout | Each day of the month grid is a segment of its own |  |
| 001890 | non-functional/usability/layout | A form in place of a detail has the head bar of "Antrag bearbeiten" |  |
| 001891 | non-functional/usability/layout | The label of "Abbrechen" in a form head ends at the side inset |  |
| 001895 | non-functional/usability/layout | The page scrolls again when the last overlay closes, in any order |  |
| 001930 | non-functional/usability/layout | A pane page scrolls inside itself, so the rail stays in place |  |
| 001931 | non-functional/usability/layout | The head of a wide list column stays solid, also on a fast scroll |  |
| 001946 | non-functional/usability/layout | The Kalender filter chips stand in a row of their own below the search |  |
| 000395 | style/frontend/angular | Components use semantic colour tokens | semantic colour tokens |
| 000632 | style/frontend/angular | An admin page shows its load states through app-load-state | load states component |
| 000636 | style/frontend/angular | A component stylesheet has no class without a use | no unused class |
| 000637 | style/frontend/angular | Container queries in Verwaltung use three named widths | three container widths |

## Split

| Number | Folder | Title | Note |
| --- | --- | --- | --- |
| 000169 | functional/administration/files | Attachments can be dropped | kit: the drop zone; app: the upload and its checks |
| 001181 | functional/applications/applications | Step 1 shows the Antragsarten by group with the group text | kit: the type step shows groups with a text; app: the groups |
| 001691 | functional/applications/applications | The visibility switch names who reads the comment | kit: the composer switch names its readers from inputs; app: who reads |
| 001462 | functional/meetings/meetings | The vote sheet opens by itself for a voter | kit: the side sheet has an open input; app: open it for a voter |
| 000967 | functional/public/public-pages | The public variants show a blackout block as one bar | kit: a blackout block is one bar on screen; app: the same in the PDF |
| 000501 | non-functional/accessibility/perception | An admin accent colour keeps the contrast | kit: the accent clamp keeps 3:1 and 4.5:1; app: the admin field of the accent |
| 000496 | non-functional/accessibility/statement | Every page links to the accessibility statement | kit: the shell has a link slot to the statement; app: the URL of the statement |
| 001280 | non-functional/performance/loading | The Gremien list shows its skeleton until the logos have loaded | kit: a list with images keeps its skeleton until the images load; app: nothing (the Gremien list uses it) |
| 002000 | non-functional/performance/loading | A list reads the details of a row ahead only on a sign of intent | kit: the list reports a sign of intent; app: the read ahead |
| 000931 | non-functional/usability/controls | Back closes the dialogs of the Haushalt | kit: Back closes every open dialog; app: no Haushalt part left |
| 000199 | non-functional/usability/layout | The footer shows only on start and public pages | kit: the shell shows the footer on a screen that asks for it; app: which pages ask |

## Stay in the app although in a kit folder

| Number | Folder | Title | Why |
| --- | --- | --- | --- |
| 000491 | non-functional/accessibility/conformance | Every route passes an axe check in both themes | axe run over the routes of the app |
| 000492 | non-functional/accessibility/conformance | The template lint has the accessibility rules | template lint of the app |
| 000524 | non-functional/accessibility/documents | The protocol PDF is tagged as PDF/UA-1 | PDF/UA of the protocol PDF: typst, not the kit |
| 000525 | non-functional/accessibility/documents | Each mail has a plain text part | mail text part: backend |
| 000521 | non-functional/accessibility/interaction | The login and the captcha need no cognitive test | login and captcha flow of the app |
| 000495 | non-functional/accessibility/statement | A public page holds the accessibility statement | content of the public statement page |
| 000497 | non-functional/accessibility/statement | A user can report a barrier as a ticket | ticket report: business logic |
| 000668 | non-functional/usability/controls | The fiscal year is chosen with a chip | the fiscal year as content of a filter |
| 000676 | non-functional/usability/controls | Verwaltung says "Tickets" | a concrete word of the app |
| 001313 | non-functional/usability/layout | The pool substitutes are an own row group | which groups the attendance shows: content |
| 001480 | non-functional/usability/layout | Verwaltung and Konto are ordinary list/detail pages | which screen the app picks for Verwaltung and Konto |
| 001482 | non-functional/usability/layout | The form editor and the flow editor open without the list | which screen the app picks for the editors |
