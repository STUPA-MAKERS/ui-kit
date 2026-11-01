import { Directive, TemplateRef, inject, input } from '@angular/core';

/** The context of a page template: the id of its tab, and whether it is the active one. */
export interface TabPageContext {
  $implicit: string;
  active: boolean;
}

/**
 * The content of one tab of an `app-tab-pager`: `<ng-template appTabPage="files">`. A
 * template without an id is the page of every tab that has no template of its own, and
 * gets the id as its context: `<ng-template appTabPage let-id>` (the columns of a board).
 */
@Directive({
  selector: 'ng-template[appTabPage]',
  standalone: true,
})
export class TabPageDirective {
  readonly template = inject<TemplateRef<TabPageContext>>(TemplateRef);
  readonly id = input('', { alias: 'appTabPage' });

  static ngTemplateContextGuard(_dir: TabPageDirective, _ctx: unknown): _ctx is TabPageContext {
    return true;
  }
}
