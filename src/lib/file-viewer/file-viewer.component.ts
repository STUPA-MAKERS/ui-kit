import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { IconComponent } from '../icon/icon.component';
import { UI_KIT_INTL } from '../intl/intl';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { type FileViewerItem, type FileViewerKind, fileViewerKind } from './file-viewer.types';

export type { FileViewerItem, FileViewerKind } from './file-viewer.types';

/** Load state of the shown image or PDF. */
type LoadState = 'loading' | 'ready' | 'error';

/** A horizontal swipe navigates when it is longer than this and mostly horizontal. */
const SWIPE_MIN_PX = 50;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Full-screen viewer for images and PDFs, in the look of the Nextcloud viewer: a dark
 * backdrop over the whole viewport, a top bar with the file name in the centre and the
 * close button at the right, the file below it.
 *
 * - An image is centred and scaled down to fit (`object-fit: contain`).
 * - A PDF fills the area below the bar in an `<iframe>`; the browser brings its own
 *   PDF toolbar.
 * - Any other file shows an icon, its name and the content of `[viewerFallback]`
 *   (for example a download link).
 *
 * With more than one item, chevron buttons at the left and right edge, the arrow keys and
 * a horizontal swipe move through the list. Navigation stops at the ends.
 * Escape and the close button close the viewer.
 *
 * Content with the attribute `viewerActions` goes into the top bar, left of the close
 * button (for example a download button).
 *
 * **Trusted URLs.** The viewer does not sanitize. It gives `url` to `<img>` as it is and
 * marks it as a trusted resource URL for the `<iframe>` (`bypassSecurityTrustResourceUrl`).
 * Callers pass only same-origin API URLs that the backend serves, never a URL from user
 * input or file content.
 *
 * a11y: `role="dialog"`, `aria-modal`, named by the file name. Focus moves to the close
 * button on open, Tab stays in the viewer (also around a PDF iframe), and focus returns to
 * the trigger on close. The page behind does not scroll while the viewer is open.
 *
 * ```html
 * <app-file-viewer [items]="files" [(index)]="current" [(open)]="viewerOpen">
 *   <a viewerActions class="..." [href]="files[current].url" download>Download</a>
 * </app-file-viewer>
 * ```
 */
@Component({
  selector: 'app-file-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, UiKitTranslatePipe],
  templateUrl: './file-viewer.component.html',
  styleUrl: './file-viewer.component.scss',
  host: { '(document:keydown)': 'onDocumentKeydown($event)' },
})
export class FileViewerComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly injector = inject(Injector);
  private readonly intl = inject(UI_KIT_INTL);

  /** The files to show. */
  readonly items = input<readonly FileViewerItem[]>([]);
  /** Index of the shown file; two-way bindable. Out-of-range values are clamped. */
  readonly index = model(0);
  /** Whether the viewer is shown; two-way bindable. */
  readonly open = model(false);
  /** Emits when the user closes the viewer (close button or Escape). */
  readonly closed = output<void>();

  private readonly pane = viewChild<ElementRef<HTMLElement>>('pane');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  /** The shown index, clamped to the list. */
  protected readonly position = computed(() => {
    const count = this.items().length;
    if (count === 0) return 0;
    return Math.min(Math.max(0, Math.trunc(this.index()) || 0), count - 1);
  });
  protected readonly current = computed<FileViewerItem | null>(
    () => this.items()[this.position()] ?? null,
  );
  protected readonly kind = computed<FileViewerKind>(() => {
    const item = this.current();
    return item ? fileViewerKind(item) : 'other';
  });
  protected readonly multiple = computed(() => this.items().length > 1);
  protected readonly hasPrevious = computed(() => this.position() > 0);
  protected readonly hasNext = computed(() => this.position() < this.items().length - 1);

  /** Iframe source: the caller's URL, marked as trusted (see the class doc). */
  protected readonly pdfUrl = computed<SafeResourceUrl | null>(() => {
    const item = this.current();
    return item && this.kind() === 'pdf'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(item.url)
      : null;
  });

  /** Back to 'loading' for every new file. */
  protected readonly state = linkedSignal<string | undefined, LoadState>({
    source: () => this.current()?.url,
    computation: () => 'loading',
  });

  /** "2 von 5", announced to screen readers on navigation. */
  protected readonly positionText = computed(() => {
    this.intl.lang();
    return this.intl.translate('viewer.position', {
      n: this.position() + 1,
      total: this.items().length,
    });
  });

  /** Native tooltip for the name, only while it is cut off. */
  protected titleTooltip: string | null = null;

  private previouslyFocused: HTMLElement | null = null;
  private prevBodyOverflow: string | null = null;
  private touchX = 0;
  private touchY = 0;
  private touching = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      untracked(() => (isOpen ? this.onOpened() : this.onClosed()));
    });
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  previous(): void {
    if (this.hasPrevious()) this.index.set(this.position() - 1);
  }

  next(): void {
    if (this.hasNext()) this.index.set(this.position() + 1);
  }

  protected onLoad(): void {
    this.state.set('ready');
  }

  protected onError(): void {
    this.state.set('error');
  }

  /** Escape, arrows and the focus trap. Listens on the document, like the dialog. */
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open() || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapTab(event);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (this.isTextEntry(event.target)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') this.previous();
    else this.next();
  }

  protected onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) {
      this.touching = false;
      return;
    }
    this.touching = true;
    this.touchX = event.touches[0].clientX;
    this.touchY = event.touches[0].clientY;
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (!this.touching) return;
    this.touching = false;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - this.touchX;
    const dy = touch.clientY - this.touchY;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) this.next();
    else this.previous();
  }

  /** Show the full name as a tooltip only when the ellipsis cuts it. */
  protected updateTitleTooltip(el: HTMLElement): void {
    this.titleTooltip = el.scrollWidth > el.clientWidth ? (this.current()?.name ?? null) : null;
  }

  /** Focus sentinels around the pane: keep Tab inside, also when it leaves an iframe. */
  protected wrapFocus(to: 'first' | 'last'): void {
    const focusables = this.focusables();
    const target = to === 'first' ? focusables[0] : focusables[focusables.length - 1];
    (target ?? this.pane()?.nativeElement)?.focus();
  }

  private trapTab(event: KeyboardEvent): void {
    const pane = this.pane()?.nativeElement;
    if (!pane) return;
    const focusables = this.focusables();
    if (focusables.length === 0) {
      event.preventDefault();
      pane.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === pane)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    const pane = this.pane()?.nativeElement;
    if (!pane) return [];
    return Array.from(pane.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.classList.contains('fv__sentinel'),
    );
  }

  private isTextEntry(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  private onOpened(): void {
    if (this.previouslyFocused === null && typeof document !== 'undefined') {
      this.previouslyFocused = (document.activeElement as HTMLElement | null) ?? null;
    }
    this.lockScroll();
    afterNextRender(
      () => {
        (this.closeButton()?.nativeElement ?? this.pane()?.nativeElement)?.focus();
      },
      { injector: this.injector },
    );
  }

  private onClosed(): void {
    this.unlockScroll();
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (target && typeof target.focus === 'function') target.focus();
  }

  private lockScroll(): void {
    if (this.prevBodyOverflow !== null || typeof document === 'undefined') return;
    this.prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (this.prevBodyOverflow === null) return;
    document.body.style.overflow = this.prevBodyOverflow;
    this.prevBodyOverflow = null;
  }
}
