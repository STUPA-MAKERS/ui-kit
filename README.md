# @stupa-makers/ui-kit

The STUPA-MAKERS **design system + Angular UI component library**. Extracted from the
STUPA-Workflow platform so the same look & feel can be reused across projects.

- **Design tokens** — one accent colour (green `#72a384`), neutral grey surfaces and two
  signal colours, as CSS custom properties with light/dark themes (`data-theme`). IBM Plex
  Sans and IBM Plex Mono.
- **Breakpoints** — phone (≤ 768px), narrow (769–1199px) and wide (≥ 1200px), as SCSS
  mixins (`_breakpoints.scss`) and as TypeScript constants (`BREAKPOINTS`, `MEDIA`).
- **~25 standalone components** — `OnPush`, accessible (WCAG 2.1 AA, axe-tested), token-driven.
- **Framework-decoupled** — no hard dependency on any host app: i18n and the loading state
  are wired through injection tokens, with built-in DE/EN defaults so the kit works out of
  the box.

> Angular **20+**. Components use the `app-` selector prefix.

## Install

```bash
npm install @stupa-makers/ui-kit
```

Peer dependencies: `@angular/common`, `@angular/core`, `@angular/forms`, `rxjs`.

Optional:

- **Tiptap** — only for the `markdown-editor` secondary entry point
  (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `tiptap-markdown`).

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
`window.matchMedia(MEDIA.phone)`.

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

The kit renders a handful of strings (dialog close, loading, datepicker, filter, diff). It
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
select / checkbox / currency / time), switch, segmented control, tabs, date picker & range,
line icons (inline SVG), card, badge (tag or status text), stepper, dialog, table & sortable
data-table (with filter bar), toast service, loading overlay, and a generic config/field diff
renderer.

```ts
import { ButtonComponent, DataTableComponent, ToastService } from '@stupa-makers/ui-kit';
```

The Markdown (Tiptap) editor lives in a **secondary entry point** so Tiptap stays out of the
main bundle:

```ts
import { MarkdownEditorComponent } from '@stupa-makers/ui-kit/markdown-editor';
```

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
