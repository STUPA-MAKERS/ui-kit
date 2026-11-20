import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * A meta line: parts with a middle dot between two of them ("Offen · 19.10. · AStA",
 * app spec 001961). The page gives each part as an element; the line draws the dots, so a
 * part behind `@if` brings its dot along and no dot stands alone at the start, at the end
 * or twice in a row.
 *
 * The dot is decorative: a screen reader reads the parts without it. The line stays in the
 * inline flow of its place, and the dot stands outside the box of its part, so a part with an
 * edge does not frame the dot.
 *
 * ```html
 * <app-meta-line>
 *   <app-status-text kind="warn">Offen</app-status-text>
 *   <time class="mono">19.10.</time>
 *   @if (gremium()) {
 *     <span>{{ gremium() }}</span>
 *   }
 * </app-meta-line>
 * ```
 *
 * The line takes the font and the colour of its place (a list row subtitle, a caption).
 */
@Component({
  selector: 'app-meta-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ml' },
  template: '<span class="ml__parts"><ng-content /></span>',
  styleUrl: './meta-line.component.scss',
})
export class MetaLineComponent {}
