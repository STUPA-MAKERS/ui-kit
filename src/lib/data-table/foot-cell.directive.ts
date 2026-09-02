import { Directive, Input, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` as the FOOTER cell of one column of the
 * {@link DataTableComponent}: `<ng-template appFootCell="amount">…`.
 *
 * Per column rather than one projected `<tr>`, for the same reason `appCell` is per
 * column: a caller writing the whole row has to keep its cell count in step with the
 * column list by hand, and a mismatch is invisible until the table is on screen.
 *
 * A column with no footer template gets an empty cell, so a total can sit under the one
 * column it belongs to without the caller filling in the rest.
 */
@Directive({ selector: '[appFootCell]', standalone: true })
export class FootCellDirective {
  /** Column key this template renders the footer cell for. */
  @Input('appFootCell') key = '';
  readonly tpl = inject<TemplateRef<Record<string, never>>>(TemplateRef);
}
