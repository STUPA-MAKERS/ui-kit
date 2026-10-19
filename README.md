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
`@include meta.load-css('list-detail')` at the place in its cascade where they belong. These partials emit no CSS
and are for component stylesheets: `option-menu` (popover and rows of an option list),
`scroll-fade` (`fade-y`, `fade-x` for the `is-fade-start` and `is-fade-end` classes),
`dot-parts` (a meta line "A · B · C" without a dot at a line start) and `field`.

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

Numbers and dates format with `formatLocale()` of the intl, an `Intl` tag. By default it
maps `de` to `de-DE` and `en` to `en-GB` (`UI_KIT_FORMAT_LOCALES`), because bare `en`
gives US order. A host app with its own tag passes it as the third argument:
`uiKitIntlFromLang(locale, undefined, formatLocale)`.

Or override individual strings without writing a service:

```ts
import { provideUiKit } from '@stupa-makers/ui-kit';

providers: [provideUiKit({ messages: { en: { loading: 'Please wait…' } } })];
```

## Loading overlay (decoupled)

`LoadingOverlayComponent` reads the `UI_KIT_LOADING` token (defaults to never-visible). Bind
it to the host app's loading service:

```ts
import { UI_KIT_LOADING } from '@stupa-makers/ui-kit';

providers: [{ provide: UI_KIT_LOADING, useFactory: () => ({ visible: inject(LoadingService).visible }) }];
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
row, date block, person avatar and avatar stack, select field (`app-select`, the kit's own
option list with a popover or a bottom sheet, never the native list), filter chip
(`app-filter-select`), range chip (`app-range-chip`, `currency` input), search pill with
`liveSearch()`, file drop zone, drop overlay and `appFileDrop`. Directives `appScrollFade`,
`appTruncated`, `appLongPress`, `appPressSelect`; helpers `downloadBlob`, `formatBytes`,
`keyParts` and the `capitalize` pipe.

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

## Develop

```bash
npm ci
npm run build   # ng-packagr → dist/ (Angular Package Format, incl. markdown-editor secondary entry)
npm test        # jest + @testing-library/angular + axe
npm run lint
```

## License

[GPL-3.0-or-later](./LICENSE). The bundled IBM Plex fonts are under the SIL Open Font
License (see `src/assets/fonts/IBM-Plex-Sans-OFL-LICENSE.txt` and
`src/assets/fonts/IBM-Plex-Mono-OFL-LICENSE.txt`).
