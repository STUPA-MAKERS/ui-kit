import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { frameReader } from '../util/frame-read';

/** The scroll direction: `x` for a strip, `y` for a list. */
export type ScrollFadeAxis = 'x' | 'y';

/**
 * Fade the ends of a scrolling strip or list, but only where content is hidden.
 *
 * A hidden scrollbar leaves a hard cut as the only cue that a strip scrolls at all, and a
 * half-sliced label reads as a rendering fault rather than "there is more".
 *
 * A pure-CSS mask cannot do this. Two static gradients fade both ends always, whatever
 * the scroll position, and a width media query cannot know whether a strip overflows —
 * that depends on how much room its siblings took, not on the viewport. So the state is
 * measured and written back as two classes:
 *
 * * `is-fade-start` — content is hidden to the left (`x`) or above (`y`)
 * * `is-fade-end` — content is hidden to the right (`x`) or below (`y`)
 *
 * A strip that fits carries neither and is not masked at all, so its first and last item
 * stay sharp. A host whose overflow on the axis is `visible` does not scroll and carries
 * neither either, because a mask on it would cut off what overflows.
 *
 * The axis is the value of the attribute: `appScrollFade` or `appScrollFade="x"` for a
 * horizontal strip, `appScrollFade="y"` for a vertical list. The page styles the mask.
 *
 * Neither the scroll nor a change of the rows runs the change detection or reads the
 * layout in the middle of a render (app specs 002160, 002161): the scroll listener is a
 * plain DOM listener, and a change of the rows measures once in the next animation frame,
 * after the render wrote the DOM. Reason: a list writes its rows in many small steps, and a
 * read after each step made the browser lay out the whole page again and again while a
 * new page came in.
 */
@Directive({
  selector: '[appScrollFade]',
  standalone: true,
})
export class ScrollFadeDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The scroll direction. An empty attribute means `x`. */
  readonly axis = input<ScrollFadeAxis, ScrollFadeAxis | '' | null | undefined>('x', {
    alias: 'appScrollFade',
    transform: (v) => (v === 'y' ? 'y' : 'x'),
  });

  constructor() {
    const host = this.el.nativeElement;
    // A resize changes what fits, and so does a nav item appearing after a permission
    // loads. Observing the element covers both without a window listener.
    const observer = new ResizeObserver(() => this.measure());
    // Rows that appear or go away (a search, an expanded branch) change the scroll height
    // but not the size of the host, so the resize observer does not see them.
    const later = frameReader(
      () => this.read(),
      (fades) => this.write(fades),
    );
    const mutations = new MutationObserver(() => later.schedule());
    const scrolled = (): void => this.measure();
    afterNextRender({
      read: () => {
        observer.observe(host);
        mutations.observe(host, { childList: true, subtree: true });
        host.addEventListener('scroll', scrolled, { passive: true });
        this.measure();
      },
    });
    inject(DestroyRef).onDestroy(() => {
      later.cancel();
      observer.disconnect();
      mutations.disconnect();
      host.removeEventListener('scroll', scrolled);
    });
  }

  /** Read the scroll position and write the two classes. Cheap enough to run on scroll. */
  protected measure(): void {
    this.write(this.read());
  }

  /** The ends that hide content, or null where the host does not scroll on its axis. */
  private read(): { start: boolean; end: boolean } | null {
    const el = this.el.nativeElement;
    // A box that does not scroll on this axis (`overflow: visible`, for example a layout
    // that only scrolls at another width) hides nothing: a mask would only clip it.
    const style = getComputedStyle(el);
    if ((this.axis() === 'y' ? style.overflowY : style.overflowX) === 'visible') return null;
    // A sub-pixel layout leaves a fraction of a pixel over on a strip that visibly fits.
    const slack = 1;
    const y = this.axis() === 'y';
    const max = y ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const pos = y ? el.scrollTop : el.scrollLeft;
    return { start: pos > slack, end: pos < max - slack };
  }

  private write(fades: { start: boolean; end: boolean } | null): void {
    const el = this.el.nativeElement;
    el.classList.toggle('is-fade-start', fades?.start ?? false);
    el.classList.toggle('is-fade-end', fades?.end ?? false);
  }
}
