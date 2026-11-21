import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ButtonComponent, type ButtonVariant } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import type { Action } from '../screen/screen.types';
import { focusableIn, lockBodyScroll, trapTab } from '../focus/focus-trap';
import { showInTopLayer } from '../popover/anchored-popover';
import { haptic } from '../util/haptic';

/** A drag down by more than this many pixels closes the phone sheet. */
const DRAG_CLOSE_PX = 120;

let nextId = 0;

/** The body of a data-driven dialog: `<ng-template dialogBody>` (002251). */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[dialogBody]', standalone: true })
export class DialogBodyDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The look of a footer action, as the app's dialogs: the main one filled, a danger one red, the others text. */
export function dialogActionVariant(action: Action): ButtonVariant {
  if (action.kind === 'main') return 'fill';
  return action.kind === 'danger' ? 'danger' : 'text';
}

/**
 * Modaler Dialog. Schließt per Backdrop-Klick, Schließen-Button oder ESC.
 *
 * a11y (T-43, WCAG 2.1.2/2.4.3): Beim Öffnen wandert der Fokus in den Dialog,
 * Tab/Shift+Tab werden im Dialog gefangen (Focus-Trap), beim Schließen kehrt der
 * Fokus auf das auslösende Element zurück. `aria-modal`/`role="dialog"` +
 * `aria-labelledby` sind gesetzt.
 *
 * The backdrop opens in the top layer (popover) where the browser has it. A dialog
 * inside a side sheet is a descendant of the sheet, and the glass of the sheet
 * (`backdrop-filter`) and the fade of its body (`mask-image`) would otherwise make the
 * sheet the box of the dialog and cut the dialog off at the edge of the sheet.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ButtonComponent, IconComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  /**
   * A short line below the title that names the object of the dialog, for example
   * the meeting a new agenda item goes to. Empty: no line. The dialog uses it as its
   * description (`aria-describedby`).
   */
  @Input() subtitle = '';
  @Input() closeLabel = 'Schließen';
  /** The width: 'sm' (35rem, default), 'md' (40rem, a form with two fields side by side), 'lg' (44rem, a chart). */
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';
  @Output() closed = new EventEmitter<void>();

  /** The title in the head of the dialog (002251). */
  @Input() heading = '';
  /** The footer as data: one button group, the main action filled (001353). */
  @Input() actions: readonly Action[] = [];
  /** A footer action without a route was pressed. */
  @Output() readonly action = new EventEmitter<{ readonly key: string }>();
  /** The `dialogBody` slot: the body of the dialog. */
  @ContentChild(DialogBodyDirective) protected bodySlot?: DialogBodyDirective;

  protected readonly variantOf = dialogActionVariant;

  @ViewChild('pane') private pane?: ElementRef<HTMLElement>;

  /** The backdrop goes into the top layer as soon as it is rendered. */
  @ViewChild('backdrop') private set backdrop(ref: ElementRef<HTMLElement> | undefined) {
    showInTopLayer(ref?.nativeElement);
  }

  private readonly uid = nextId++;
  readonly titleId = `app-dialog-title-${this.uid}`;
  readonly subtitleId = `app-dialog-subtitle-${this.uid}`;

  /** Element, das vor dem Öffnen den Fokus hatte — für Restore beim Schließen. */
  private previouslyFocused: HTMLElement | null = null;

  /** Body-Scroll-Sperre: gibt den vorherigen overflow-Wert zurück. */
  private releaseScroll: (() => void) | null = null;
  // Drag-to-dismiss (Mobile-Sheet, #14).
  private dragStartY = 0;
  private dragStartT = 0;
  private dragging = false;
  private dragDy = 0;
  /** The drag is past the way that closes the sheet; the crossing gives one haptic tick. */
  private pastClose = false;

  ngOnChanges(changes: SimpleChanges): void {
    const c = changes['open'];
    // Only a change of `open` moves the focus: a change of the actions (a disabled flag
    // that follows the form) must leave the focus in the field.
    if (!c) return;
    if (c.firstChange) {
      if (this.open) {
        this.captureAndFocus();
        this.lockScroll();
      }
      return;
    }
    if (!c.previousValue && c.currentValue) {
      this.captureAndFocus();
      this.lockScroll();
    } else if (c.previousValue && !c.currentValue) {
      this.restoreFocus();
      this.unlockScroll();
    }
  }

  ngOnDestroy(): void {
    // Falls der Dialog im offenen Zustand zerstört wird: Scroll-Sperre lösen.
    this.unlockScroll();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  /** Tab/Shift+Tab im Dialog halten (Focus-Trap). */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.open) return;
    const pane = this.pane?.nativeElement;
    if (pane) trapTab(event, pane);
  }

  /** A click on the backdrop itself closes the dialog; a click inside the pane does not. */
  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  // --- Drag-to-dismiss (Mobile-Sheet, #14) -----------------------------------
  onDragStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    this.dragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.dragStartT = event.timeStamp;
    this.dragDy = 0;
    this.pastClose = false;
    const pane = this.pane?.nativeElement;
    if (pane) pane.style.transition = 'none';
  }

  onDragMove(event: TouchEvent): void {
    if (!this.dragging) return;
    // Nur nach unten ziehen (kein „Hochziehen").
    this.dragDy = Math.max(0, event.touches[0].clientY - this.dragStartY);
    // A tick when the sheet passes the way that closes it, so the finger feels the point
    // where a release closes. A drag back above it and down again ticks again.
    const past = this.dragDy > DRAG_CLOSE_PX;
    if (past && !this.pastClose) haptic('tick');
    this.pastClose = past;
    const pane = this.pane?.nativeElement;
    if (pane) pane.style.transform = `translateY(${this.dragDy}px)`;
  }

  onDragEnd(event: TouchEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    const pane = this.pane?.nativeElement;
    if (pane) pane.style.transition = '';
    const dt = event.timeStamp - this.dragStartT;
    const velocity = this.dragDy / Math.max(1, dt); // px/ms
    // Flick (schnelle Abwärtsbewegung) ODER deutlicher Weg → schließen.
    if (velocity > 0.5 || this.dragDy > DRAG_CLOSE_PX) {
      this.close();
    } else if (pane) {
      pane.style.transform = '';
    }
  }

  close(): void {
    this.open = false;
    // The pane keeps a swipe offset: the exit animation runs on from where the finger left it.
    this.restoreFocus();
    this.unlockScroll();
    this.closed.emit();
  }

  private lockScroll(): void {
    this.releaseScroll ??= lockBodyScroll();
  }

  private unlockScroll(): void {
    this.releaseScroll?.();
    this.releaseScroll = null;
  }

  /** Vorherigen Fokus merken und Fokus in den Dialog setzen (nach Render). */
  private captureAndFocus(): void {
    this.previouslyFocused = (document.activeElement as HTMLElement) ?? null;
    queueMicrotask(() => {
      const pane = this.pane?.nativeElement;
      if (!pane) return;
      (focusableIn(pane)[0] ?? pane).focus();
    });
  }

  private restoreFocus(): void {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (target && typeof target.focus === 'function') target.focus();
  }
}
