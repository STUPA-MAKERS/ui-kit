# @stupa-makers/ui-kit

The STUPA-MAKERS **design system + Angular UI component library**. Extracted from the
STUPA-Workflow platform so the same look & feel can be reused across projects.

- **Design tokens** — one accent colour (green `#72a384`), neutral grey surfaces and two
  signal colours, as CSS custom properties with light/dark themes (`data-theme`). IBM Plex
  Sans and IBM Plex Mono.
- **Breakpoints** — phone (≤ 768px), narrow (769–1199px) and wide (≥ 1200px), as SCSS
  mixins (`_breakpoints.scss`) and as TypeScript constants (`BREAKPOINTS`, `MEDIA`).
- **~60 standalone components** — `OnPush`, accessible (WCAG 2.1 AA, axe-tested), token-driven.
- **Framework-decoupled** — no hard dependency on any host app: i18n and the loading state
  are wired through injection tokens, with built-in DE/EN defaults so the kit works out of
  the box.

> Angular **20+**. Components use the `app-` selector prefix.

## Install

```bash
npm install @stupa-makers/ui-kit
```

Peer dependencies: `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/router`
(the link of `app-list-item`), `rxjs`.

Optional:

- **Tiptap** — only for the `markdown-editor` secondary entry point
  (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extensions`,
  `@tiptap/extension-mathematics`, `@tiptap/extension-table`, `@tiptap/extension-image`,
  `katex`, `tiptap-markdown`).
- **`@angular/service-worker`** — only for the `pwa` secondary entry point.

## Styles

Import the design-system styles once in the app's global stylesheet:

```scss
// e.g. styles.scss
@use '@stupa-makers/ui-kit/styles' as uikit; // fonts + tokens + base reset
```

The self-hosted **IBM Plex Sans** (400/500/600/700) and **IBM Plex Mono** (400/500) fonts
are referenced at the absolute path `/assets/fonts/ibm-plex-*.woff2`, in a `latin` and a
`latin-ext` subset. Copy the kit's font assets into the app's served assets, e.g. in
`angular.json`:

```jsonc
"assets": [
  { "glob": "**/*", "input": "node_modules/@stupa-makers/ui-kit/assets/fonts", "output": "assets/fonts" }
]
```

Switch theme by setting `data-theme="light|dark"` on `<html>`.

Use the breakpoints in a stylesheet with `@use 'breakpoints' as bp;` and
`@include bp.phone { … }` (add `src/styles` to the Sass include paths), and in code with
`mediaQuery(MEDIA.phone)` (a signal) or `matchesMedia(MEDIA.coarse)` (one read).

The styles entry also holds the global loading placeholders (`.skel`, `.skel-text`,
`.skel-box`, `.skel-progress`), the layout box `.page-shell`, the row groups and click rows
(`rowgroup.scss`: `.rowgroup`, `.rowgroup--bg1`, `.rowgroup--bg3`, `.hitrow`) and the
list/detail geometry (`list-detail.scss`: `--ld-list-width`, `--ld-gap`, `.ld-pane`). An app
that loads the partials one by one adds `@include meta.load-css('rowgroup')` and
`@include meta.load-css('list-detail')` and `@include meta.load-css('motion')` at the place in its cascade where they belong. These partials emit no CSS
and are for component stylesheets: `option-menu` (popover and rows of an option list),
`scroll-fade` (`fade-y`, `fade-x` for the `is-fade-start` and `is-fade-end` classes),
`dot-parts` (a meta line "A · B · C" without a dot at a line start), `field`,
`list-pane` (the column, the chips, the scroll area and the hover row menu of a list pane,
and `frame($b)`, the whole frame of a list page with a detail outlet) and
`detail-none-host` (`host`, the host of a route component that shows only
`app-detail-none`).

### Motion

The styles entry loads `motion.scss`. It holds the enter and leave classes for
`animate.enter` / `animate.leave`: `.motion-pop-in`, `.motion-pop-out`, `.motion-rise-in`,
`.motion-fade-in`, `.motion-fade-out`, `.motion-expand-in` and `.motion-expand-out`. It also
holds the route view transitions: while `<html data-motion="section|push|pop">` is set, the
root snapshot fades through (`section`) or slides (`push`, `pop`), and the rail
(`.frame__rail`) and the bottom bar (`.bb`) stay still in groups of their own. They do not
cross-fade, because a cross-fade of their half transparent snapshots shows garbage on some
GPUs: the new picture shows at once, on an opaque ground for the rail. The app sets
`data-motion` from the `onViewTransitionCreated` hook of its router. Every timing comes from
the `--motion-*` and `--ease-*` tokens, and `base.scss` stops the motion when the system asks
for reduced motion.

In code, `reducedMotion()` reads the system wish, and `withViewTransition(update)` runs a
change of the whole page as one cross-fade (at once without the API or with reduced motion).

### Rules of the design system

- One accent colour. `--color-accent` is the fill (main button, switch, progress) with
  `--color-on-accent` on it; `--color-primary` / `--color-accent-text` is the accent as
  text. Everything else is grey.
- A status is coloured text (`app-badge` with a status variant), never a dot or a pill.
  A tag (`app-badge` neutral or accent) is a feature of a thing, not its status.
- A destructive action is an outlined red button (`variant="danger"`).
- Input fields are filled (surface 2, radius 14), without an edge and without a shadow;
  focus draws a 2px accent line inside the field.
- A long name gets an ellipsis (`.ell`) and a `title` with the full text.

## i18n (decoupled)

The kit renders a handful of strings (dialog close, loading, datepicker, diff, the control
names of the patterns, such as "Weitere Aktionen" or "Zur Liste"). A visible text of a
page (a title, a label) is always an input. It
ships **built-in DE/EN defaults** via the `UI_KIT_INTL` injection token, so nothing is
required to get started.

To make the kit follow the host app's locale, provide an intl backed by your own language
signal:

```ts
import { ApplicationConfig } from '@angular/core';
import { UI_KIT_INTL, uiKitIntlFromLang } from '@stupa-makers/ui-kit';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: UI_KIT_INTL,
      // your locale signal must yield 'de' | 'en'
      useFactory: () => uiKitIntlFromLang(inject(MyI18nService).locale),
    },
  ],
};
```

Or pass a factory to `provideUiKit`. It runs in an injection context when the kit first
needs a text, so the order of the providers does not matter:

```ts
provideUiKit({ intl: () => uiKitIntlFromLang(inject(MyI18nService).locale) });
```

Numbers and dates format with `formatLocale()` of the intl, an `Intl` tag. By default it
maps `de` to `de-DE` and `en` to `en-GB` (`UI_KIT_FORMAT_LOCALES`), because bare `en`
gives US order. A host app with its own tag passes it as the third argument:
`uiKitIntlFromLang(locale, undefined, formatLocale)`.

Or override individual strings without writing a service:

```ts
import { provideUiKit } from '@stupa-makers/ui-kit';

providers: [provideUiKit({ messages: { en: { loading: 'Please wait…' } } })];
```

## Loading state (decoupled)

`app-load-bar` (a thin bar at the top edge, the quiet choice) and `app-loading-overlay` read
the `UI_KIT_LOADING` token. By default the token is the kit's `LoadingService`: it counts the
GET requests that pass `loadingInterceptor`, shows after 300 ms and stays at least 400 ms.
Register the interceptor as the outermost one:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from '@stupa-makers/ui-kit';

providers: [provideHttpClient(withInterceptors([loadingInterceptor /* , the others */]))];
```

Only GET requests count. A background read opts out with `{ context: skipLoading() }`
(`SKIP_LOADING`); `quietly(() => …)` starts reads that never count (a read ahead), and
`visibly(() => …)` makes reads count although they opt out (the reload of a pull to
refresh). Without the interceptor nothing counts and the bar never shows.

A host app with a loading service of its own binds the token to it:

```ts
import { UI_KIT_LOADING } from '@stupa-makers/ui-kit';

providers: [{ provide: UI_KIT_LOADING, useFactory: () => ({ visible: inject(MyLoadingService).visible }) }];
```

## Theme

`ThemeService` keeps the preference (`system`, `light`, `dark`) in `localStorage`, writes the
theme in effect to `data-theme` on `<html>`, writes the page background to every
`<meta name="theme-color">` and links the manifest of that theme. `init()` once at app
start; `setPreference()` and `toggle()` cross-fade the page; `setPageDefault()` sets the
theme of `system` while one page shows. Configure it per app:

```ts
providers: [
  provideUiKit({
    theme: {
      storageKey: 'ap.theme', // default 'ui-kit.theme'
      manifest: { light: 'manifest.webmanifest', dark: 'manifest-dark.webmanifest' }, // null: keep the link
      background: { light: '#f6f7f5', dark: '#101211' }, // default: --color-bg of the tokens
    },
  }),
];
```

## Components

Buttons (fill / tonal / outlined / text / danger / fab, round icon buttons; the older names
primary / secondary / ghost / danger-outline / success stay as aliases), inputs (text /
select / checkbox / currency / time), switch, segmented control (auto, equal or filling
segments, an optional count per segment), tabs, date picker & range,
line icons (inline SVG), card, badge (tag or status text), stepper (horizontal, or vertical
with a hint per step and done steps as buttons), dialog (title and an
optional subtitle that names the object), table & sortable
data-table, toast service, loading overlay, and a generic config/field diff
renderer.

Patterns of the pages: list row (`app-list-item`, a router link or a button), list/detail
layout (`app-list-detail`), side sheet and phone bottom sheet (`app-side-sheet`), sheet bar,
row menu (⋮), selection bar, confirm dialog, empty state with ghost rows, skeleton, note,
status text (`StatusKind`), share bar (`app-seg-bar`), sticky bar, field group and field
row, page header (`app-page-header`), floating main action (`app-fab`), empty detail pane
(`app-detail-none`), date block, person avatar and avatar stack, select field (`app-select`, the kit's own
option list with a popover or a bottom sheet, never the native list), filter chip
(`app-filter-select`), range chip (`app-range-chip`, `currency` input), search pill with
`liveSearch()`, file drop zone, drop overlay and `appFileDrop`. Directives `appScrollFade`,
`appTruncated`, `appLongPress`, `appPressSelect`; helpers `downloadBlob`, `formatBytes`,
`keyParts` and the `capitalize` pipe.

The page header has the inputs `title`, `subtitle`, `meta`, `flush`, `rail`, `pane`,
`display`, `titleId` and `titleTag`, and three slots: `[crumbs]` above the title (the
crumb trail of the app, for example its own `app-breadcrumbs`), `[heading]` beside the title
and `[actions]` at the end. A `pane` header and a header below the bar of a one-view page
do not show the crumbs. `app-fab` emits `activate`; `iconOnly` shows only the icon (the
label becomes the accessible name and the tooltip) and `tone="neutral"` gives the quiet
look. `app-fab-group` puts several fabs side by side at the bottom end, above the phone bar
(for example Save and Reset); a fab in a group gives its place to the group. To open a
route from a fab, use the `link` input of the `shell` entry (below) or navigate in the
handler.

`PageFrame` holds the page frame state that pages and the shell share: while `fill()` is
true, the page fills the height of the frame and only its panes scroll.

The avatar draws initials. A host app with person images provides `UI_KIT_AVATAR_SOURCE`
(`url(principal, px)`, `markFailed(principal)`), for example a Gravatar proxy.

Building blocks: a link in the button look (`a[appButton]`), copy button (`copyText`), chip
with an × and a chip group (radio group), move buttons (`moveItem`), file picker, autocomplete
(combobox), textarea box, locked field, highlight (`highlight`), and an infinite-scroll
sentinel (`appInfiniteScroll`). Helpers for code: `trapTab`, `focusableIn` and
`lockBodyScroll` for an overlay; `watchAnchoredPopover`, `placeBelow`, `anchorOutOfView`
and `showInTopLayer` for a popover at an anchor; the signals `nowSignal`, `elementSize`
(`observeElementSize`) and `mediaQuery`.

```ts
import { ButtonComponent, DataTableComponent, ToastService } from '@stupa-makers/ui-kit';
```

The Markdown (Tiptap) editor lives in a **secondary entry point** so Tiptap stays out of the
main bundle:

```ts
import { MarkdownEditorComponent } from '@stupa-makers/ui-kit/markdown-editor';
```

The editor has no toolbar of its own. A consumer that shows one calls
`toggleFormat(format)` on the component (`'heading'`, `'bold'`, `'italic'`,
`'bulletList'`) and reads `activeFormats()` to show a format as pressed. The heading is
level 2, because level 1 is the heading of the document.

GFM tables round-trip through the editor with their column alignment (`:--`, `:-:`,
`--:`). A cell holds one line of inline text: a line break in a cell is saved as a space,
and a merged cell is saved as its text plus empty cells. `insertTable(rows, cols)` and
`tableCommand('addRowAfter' | 'addColumnAfter' | 'deleteRow' | 'deleteColumn' |
'deleteTable')` serve a toolbar; `inTable()` says whether the cursor is in a table.

An image shows only with the canonical path `![alt](/api/media/images/<uuid>)`. Any other
image reference stays unchanged in the Markdown and shows its alt text; the editor never
loads another source. With the `imageUpload` input (`(file) => Promise<{ src, alt }>`), a
paste or a drop of PNG, JPEG, GIF or WebP files uploads them and inserts the images;
`pickImage()` opens the file dialog and `insertImage(src, alt)` inserts a stored image.
The uploader reports its own errors; a rejected promise inserts nothing.

Links `[label](target)` keep their target. `setLink(href)` and `unsetLink()` serve a
toolbar; `setLink` accepts only `http:`, `https:`, `mailto:`, a path (`/antraege/123`)
and an anchor (`#top`).

A vote callout (`> [!abstimmung] **Frage**` and a tally line) shows as one card: a
caption, the question, the counts and a bar of the counts. The Markdown holds no time, no
majority rule and no result, so the consumer can give them through the `voteInfo` input, a
function from the question to `VoteCalloutInfo` (`caption`, `result` with `label` and
`tone`, `labels` of the counts). The cards render again when the function changes. Without
it the caption is the kind of the callout and the card names no result.

## App shell

The frame of an app lives in the **`shell`** secondary entry point, because it needs the
router:

```ts
import { ShellComponent, provideRouteMotion } from '@stupa-makers/ui-kit/shell';

provideRouter(routes, provideRouteMotion());
```

```html
<app-shell
  [frame]="frame()"
  [nav]="nav"
  [barKeys]="['start', 'applications', 'meetings', 'tasks']"
  [brand]="{ home: '/dashboard', label: 'STUPA', mark: { light: 'mark.svg', dark: 'mark-dark.svg' } }"
  [keyboardOpen]="keyboardOpen()"
  (search)="palette.open()"
>
  <ng-template appNavMark let-key let-part="part">…</ng-template>
  <app-help-menu shellRailTools />
  <app-account-menu shellAccount variant="auto" [name]="me().name" (logout)="logout()" />
  <app-help-items shellMore />
  <app-public-header shellPublicHeader />
  <app-footer shellFooter />
  <app-install-prompt shellPrompts />
  <app-command-palette shellOverlays … />
</app-shell>
```

- `frame` is `'rail'` (signed in: the rail on a wide screen, the bottom bar on a phone),
  `'public'` (header and footer), `'bare'` (only the page) or `'pending'` (the session is
  not known yet, so only the page shows). An entry of `nav` is a `ShellNavItem`
  (`key`, `path`, `label`, `icon`, `place: 'main' | 'end'`, `exact?`); `barKeys` are the
  entries of the phone bar, and the rest go into the "More" sheet.
- An `appNavMark` template draws a mark on an entry. Its context is the key and the part
  (`visual` on the icon, `text` for screen readers, `count` beside the label).
- The route data `wide`, `fab`, `footer`, `fill` and `chrome: false` set the page width, the
  room for a fab, the footer, the fill and a page without chrome. A fill page (route data
  `fill` or `PageFrame.fill`) is one screen high, so only its panes scroll; on a phone it
  ends above the bottom bar. It shows no footer, and an empty `[shellFooter]` leaves no box.
- The shell shows the skip link, the load bar and the toasts. The toasts sit at the bottom
  end; on a phone they sit above the bottom bar (`--app-bottom-inset`, which an app sets
  to 0 when it hides the bar for the keyboard). `[shellPrompts]` takes prompts of the app
  in every frame (an install or unlock prompt). On a phone the frame starts with
  `app-toast-bar`: a toast with `phonePlacement: 'top'` (the update and offline notices of
  the `pwa` entry) shows there as a full-width bar, and the page moves down by its height.
  `[shellOverlays]` shows only in the `rail` frame (rail and bottom bar).
- Slots: `[shellRailTools]` (above the account in the rail), `[shellAccount]` (the rail
  and the "More" sheet), `[shellMore]` (the "More" sheet), `[shellPublicHeader]`,
  `[shellFooter]`, `[shellPrompts]`, `[shellOverlays]`, `[shellRailEnd]` and
  `[shellBarEnd]` (an own entry at the end of the rail and the bar, in the look of
  `app-rail-button` and `app-bar-button`) and `[shellMain]` (shown before the outlet).
  An app entry of its own can use the mixins `rail-item` and `bar-item` of
  `@use '@stupa-makers/ui-kit/styles/nav-items'`.
- For a small app: `searchable = false` removes the search entries, `more = false` removes
  "More" (put every entry into `barKeys`), and `outlet = false` removes the router outlet,
  so the app can show its own content in `[shellMain]` (for example a sign-in gate).
  `morePaths` are the paths that mark "More" as active.

The parts also work alone: `app-nav-rail`, `app-bottom-bar` (model `moreOpen`, slots
`[more]` and `[moreAccount]`; a click on a link or a button in `[more]` closes the sheet,
and the content can close it with `ShellMoreSheet.close()`) and `app-account-menu` (inputs `variant`, `name`, `avatarId`,
`languages`, `language`, `dark`; outputs `languageChange`, `darkChange`, `logout`,
`navigated`; slot `[accountItems]` for links such as `a.am__item`).

`app-command-palette` with the `CommandPalette` service is the search dialog: inputs
`groups` (`PaletteGroup` of `PaletteRow`: `id`, `icon`, `title`, `subtitle?`, `link?`,
`status?`, `archived?`), model `query`, `loading`, `truncated`; output `pick(row)`. A row
with a `link` opens it. `searchShortcutKeys()` of the main entry names the shortcut.

List pages: `injectListDetailPage(layout, { param })` gives `selectedId` and `split` and
sets `PageFrame.fill` while the panes sit side by side. `app-list-none` is the empty
child route (`data: { none: ListNoneData }`) and reads `LIST_PAGE_STATE`;
`LIST_NONE_TEXT` translates the texts of the route data. `app-fab[link]` opens a route and then does not emit `activate`.

Route motion: `provideRouteMotion()` (view transitions with `onRouteViewTransition`),
`routeMotion`, `routePath`, `RouteMotion` and `watchUAVisualTransitions(window)`, which an
app calls once at start so a back that the browser animated is not animated twice.

The texts of the shell are `shell.*`, `account.*` and `palette.*` of `UI_KIT_INTL`.

## PWA helpers

The helpers of an installed web app live in the **`pwa`** secondary entry point, so
`@angular/service-worker` stays an optional peer:

```ts
import {
  IS_INSTALLED_APP,
  OfflineService,
  SwUpdateService,
  lockInstalledAppZoom,
} from '@stupa-makers/ui-kit/pwa';
```

`SwUpdateService.init()` checks for a new version 1 second after the start, every 5
minutes and on focus. A second `init()` does nothing, and the checks stop when the root
injector goes. When a new version is ready, it shows the notice `pwa.updateReady` with a
reload icon (named `pwa.reload`) and no close button. On a phone it is a green bar at the
top of the frame and the whole bar reloads; on a wider screen it is a toast and the icon
reloads. The reload activates the update and then reloads the page. A broken cache
(`unrecoverable`) reloads at once.

`OfflineService` follows the connection (`online()`, from `navigator.onLine` and the
`online` and `offline` events). After `init()` it shows `pwa.offline` with the `cloud-off`
icon at the end of the row while the browser is offline: a red bar at the top on a phone, a toast on a wider
screen. It has no close button and goes away when the connection comes back. Both bars
show at once, the offline bar first.

`IS_INSTALLED_APP` (and `isInstalledApp(window)`) tells the installed app from a browser
tab, and `lockInstalledAppZoom(document, installed)` stops the page zoom in the installed
app only.

The toasts of the kit support these notices: `showAction` takes `actionIcon` (the action
as an icon at the end), `closable: false` and `phonePlacement: 'top'`; `showNotice` shows
a notice with an `icon` (`iconPosition: 'start' | 'end'`) that stays until `dismiss(id)`.
The icons of the notices are 18px; the buttons keep their 32px box. The colours of the bar are the
custom properties `--toast-bar-accent-bg` / `-fg` and `--toast-bar-danger-bg` / `-fg` of
`app-toast-bar`.

## Develop

```bash
npm ci
npm run build   # ng-packagr → dist/ (Angular Package Format, incl. the markdown-editor and pwa secondary entries)
npm test        # jest + @testing-library/angular + axe
npm run lint
```

## License

[GPL-3.0-or-later](./LICENSE). The bundled IBM Plex fonts are under the SIL Open Font
License (see `src/assets/fonts/IBM-Plex-Sans-OFL-LICENSE.txt` and
`src/assets/fonts/IBM-Plex-Mono-OFL-LICENSE.txt`).
