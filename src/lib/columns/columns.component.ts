import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Two columns of a detail body that wrap below each other when they do not fit: the main
 * column (`[main]`, 1.4 parts, at least 22.5rem) and the side column (`[side]`, 1 part, at
 * least 20rem), for example the rule text and its references in the spec explorer. Each column
 * stacks its sections. §S/framework/screens/002797
 *
 * ```html
 * <app-columns>
 *   <ng-container ngProjectAs="[main]">…</ng-container>
 *   <ng-container ngProjectAs="[side]">…</ng-container>
 * </app-columns>
 * ```
 */
@Component({
  selector: 'app-columns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cols__col cols__col--main"><ng-content select="[main]" /></div>
    <div class="cols__col cols__col--side"><ng-content select="[side]" /></div>
  `,
  styleUrl: './columns.component.scss',
})
export class ColumnsComponent {}
