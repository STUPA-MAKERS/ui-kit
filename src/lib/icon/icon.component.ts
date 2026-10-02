import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { type IconName, type IconShape, iconShapes } from './icons';

export type { IconName, IconShape } from './icons';

/** Drawn for a name the set does not know: a plain circle, so the gap is visible. */
const UNKNOWN: readonly IconShape[] = [{ t: 'circle', cx: '12', cy: '12', r: '9' }];

/**
 * Icon component. Draws a line icon of the design system as inline SVG, selected by a
 * stable, semantic `name` (see `icons.ts`). The icon is decorative (`aria-hidden`): the
 * accessible name comes from the control around it. `currentColor` follows the text
 * colour, so the icon follows the theme.
 *
 * The rendered `<svg>` carries `data-icon="<name>"` for tests and styles.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  private readonly _name = signal<IconName>('sun');

  @Input() set name(value: IconName) {
    this._name.set(value);
  }
  get name(): IconName {
    return this._name();
  }
  /** Edge length in px. */
  @Input() size = 18;
  /** Line width on the 24px grid. */
  @Input() strokeWidth = 1.7;

  protected readonly shapes = computed(() => iconShapes(this._name()) ?? UNKNOWN);
}
