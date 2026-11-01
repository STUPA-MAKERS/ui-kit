import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Where a nav mark shows.
 *
 * - `visual`: on the icon of the rail or the bar, a badge or a dot. Hide it from screen
 *   readers (`aria-hidden`).
 * - `text`: after the label, the same information as hidden text, so a link reads
 *   "Tasks 8 open" and not "8 open Tasks".
 * - `count`: at the end of a row of the "More" sheet, the count alone in the flow. Hide it
 *   from screen readers like `visual`.
 */
export type NavMarkPart = 'visual' | 'text' | 'count';

/** The context of a nav mark template. */
export interface NavMarkContext {
  /** The key of the entry. */
  readonly $implicit: string;
  readonly part: NavMarkPart;
}

/**
 * A mark per navigation entry, for example the count of open tasks or a dot while a meeting
 * runs. Put it in `app-shell`; the rail and the bar render it once per entry and part.
 *
 * ```html
 * <app-shell …>
 *   <ng-template appNavMark let-key let-part="part"><app-nav-mark [key]="key" [part]="part" /></ng-template>
 * </app-shell>
 * ```
 */
@Directive({ selector: 'ng-template[appNavMark]', standalone: true })
export class NavMarkDirective {
  readonly template = inject<TemplateRef<NavMarkContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: NavMarkDirective, _ctx: unknown): _ctx is NavMarkContext {
    return true;
  }
}
