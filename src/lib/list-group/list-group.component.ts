import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * A group of rows in a list pane with its head, for example the month "September 2026"
 * above the applications of that month, or "Saved" above the presets.
 *
 * The head is the name of the group and nothing else. It shows no count of the rows: the
 * rows themselves show how many there are. The caller projects the rows:
 *
 * ```html
 * <app-list-group [label]="group.label">
 *   <div class="apps__rows" [class.rowgroup]="!split()" role="list">…</div>
 * </app-list-group>
 * ```
 *
 * With a `label`, the group is a region that its head names. Without one (`null` or an
 * empty text), the group has no head and no role. `skeleton` shows a placeholder bar of
 * that width in place of the head, while the list loads.
 *
 * The head sits closer to the top in the first group of the list, and the inline padding
 * follows the rows: `space-4` beside the cards of a split pane, `space-1` above a row
 * group on a phone.
 */
@Component({
  selector: 'app-list-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "label() && !skeleton() ? 'region' : null",
    '[attr.aria-labelledby]': 'label() && !skeleton() ? headId : null',
  },
  templateUrl: './list-group.component.html',
  styleUrl: './list-group.component.scss',
})
export class ListGroupComponent {
  /** The name of the group. `null` or empty: no head. */
  readonly label = input<string | null>(null);
  /** The colour of the head: `accent`, or `warn` for a group that waits for somebody. */
  readonly tone = input<'accent' | 'warn'>('accent');
  /** A CSS width such as `7rem`: a placeholder bar in place of the head. */
  readonly skeleton = input<string | null>(null);

  protected readonly headId = `list-group-${nextId++}`;

  /**
   * The head sticks over its rows (on a phone below a sticky search bar): it has moved
   * down from the top of its group. Only then is it glass with a fade below it
   * (`lg__head--stuck`); at rest the glass would blur the first row into the head.
   */
  protected readonly stuck = signal(false);
  /**
   * The stuck head sits right under the sticky search bar and is not pushed away by the
   * end of its group. Only then does its glass reach up behind the bar
   * (`lg__head--under`), so bar and head are one glass surface without a seam between them.
   */
  protected readonly under = signal(false);

  private readonly head = viewChild<ElementRef<HTMLElement>>('head');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let frame = 0;
    const check = () => {
      frame = 0;
      const head = this.head()?.nativeElement;
      if (!head) {
        this.stuck.set(false);
        this.under.set(false);
        return;
      }
      const own = head.getBoundingClientRect();
      const group = host.getBoundingClientRect();
      const stuck = own.top - group.top > 0.5;
      this.stuck.set(stuck);
      // At the end of its group the next group pushes the head up: its foot is then at
      // the foot of the group, and it no longer sits right under the bar.
      this.under.set(stuck && group.bottom - own.bottom > 0.5);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    });
  }
}
