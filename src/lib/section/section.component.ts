import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
 * - `meta` shows quiet text beside the title: a count ("3", "8 von 24") or a short tag.
 * - `required` marks the title with the star of a required field, for a section that
 *   the user must fill (for example the files of an application).
 * - `hideHeading` keeps the title for screen readers only, for a layout where the
 *   surrounding view already names the content. An action stays visible.
 * - `headingId` sets the id of the title, when a link or a script on the page needs it.
 * - An element with `sectionAction` goes at the end of the title row. The row then has
 *   the height of a small control, so the action does not push the content down.
 * - The title is inset by `--section-inset` (default `--space-1`), so a list whose rows
 *   have a wider inset can align the title with them.
 * - The content stacks with `--section-gap` (default `--space-3`, the gap between form
 *   fields). The title sits `--space-2` above the content.
 */
@Component({
  selector: 'app-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'titleId()',
  },
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  /** The title of the section. */
  readonly heading = input.required<string>();
  /** The heading level of the title. */
  readonly level = input<2 | 3 | 4>(3);
  /** Quiet text beside the title, for example a count. `null` shows none. */
  readonly meta = input<string | number | null>(null);
  /** Mark the title as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Show the title to screen readers only. */
  readonly hideHeading = input(false, { transform: booleanAttribute });
  /** The id of the title. Without one, the section makes its own. */
  readonly headingId = input<string | null>(null);

  private readonly ownId = `section-${nextId++}`;
  protected readonly titleId = computed(() => this.headingId() ?? this.ownId);
}
