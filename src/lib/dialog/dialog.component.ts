import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { focusableIn, lockBodyScroll, trapTab } from '../focus/focus-trap';

let nextId = 0;

/**
 * Modaler Dialog. Schließt per Backdrop-Klick, Schließen-Button oder ESC.
 *
 * a11y (T-43, WCAG 2.1.2/2.4.3): Beim Öffnen wandert der Fokus in den Dialog,
 * Tab/Shift+Tab werden im Dialog gefangen (Focus-Trap), beim Schließen kehrt der
 * Fokus auf das auslösende Element zurück. `aria-modal`/`role="dialog"` +
 * `aria-labelledby` sind gesetzt.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  /**
   * A short line below the title that names the object of the dialog, for example
   * the meeting a new agenda item goes to. Empty: no line. The dialog uses it as its
   * description (`aria-describedby`).
   */
  @Input() subtitle = '';
  @Input() closeLabel = 'Schließen';
  /**
   * Breite: 'md' (35rem, Default), 'form' (40rem, Formulare mit zwei Feldern
   * nebeneinander) oder 'lg' (44rem, z. B. Charts).
   */
  @Input() size: 'md' | 'form' | 'lg' = 'md';
  @Output() closed = new EventEmitter<void>();

  @ViewChild('pane') private pane?: ElementRef<HTMLElement>;

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

  ngOnChanges(changes: SimpleChanges): void {
    const c = changes['open'];
    if (!c || c.firstChange) {
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

  onBackdrop(_event: MouseEvent): void {
    this.close();
  }

  // --- Drag-to-dismiss (Mobile-Sheet, #14) -----------------------------------
  onDragStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    this.dragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.dragStartT = event.timeStamp;
    this.dragDy = 0;
    const pane = this.pane?.nativeElement;
    if (pane) pane.style.transition = 'none';
  }

  onDragMove(event: TouchEvent): void {
    if (!this.dragging) return;
    // Nur nach unten ziehen (kein „Hochziehen").
    this.dragDy = Math.max(0, event.touches[0].clientY - this.dragStartY);
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
    if (velocity > 0.5 || this.dragDy > 120) {
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
