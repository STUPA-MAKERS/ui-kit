import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/**
 * A titled section of a detail sheet, a form or a settings page: the title in the accent
 * colour, an optional action at the end of the title row, and the content below.
 *
 * Every page uses this one look for its section titles, so the size, the colour, the
 * inset of the title and the space below it are the same everywhere. A page sets no own
 * title style.
 *
 * ```html
 * <app-section heading="Unterbuchungen">
 *   <app-button sectionAction variant="text" size="sm">Unterbuchung hinzufügen</app-button>
 *   <div class="rowgroup">…</div>
 * </app-section>
 * ```
 *
 * - The title is an `h3` (`level` changes it), and the host is a `group` named by it, so
 *   the fields of a form section are grouped for screen readers like a `fieldset`.
 * - An element with `sectionAction` goes at the end of the title row. The row then has
 *   the height of a small control, so the action does not push the content down.
 * - The content stacks with `--section-gap` (default `--space-3`, the gap between form
 *   fields). The title sits `--space-2` above the content.
 */
@Component({
  selector: 'app-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'headingId',
  },
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  /** The title of the section. */
  readonly heading = input.required<string>();
  /** The heading level of the title. */
  readonly level = input<2 | 3 | 4>(3);

  protected readonly headingId = `section-${nextId++}`;
}
