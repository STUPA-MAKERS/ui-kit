import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  contentChild,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { Action } from '../screen/screen.types';
import { showInTopLayer } from '../popover/anchored-popover';
import { SheetBodyDirective, SideSheetComponent } from '../side-sheet/side-sheet.component';

/**
 * The bottom sheet of a control on a phone, in the top layer. A sheet inside a header or a
 * pane with glass or `overflow` would be clipped by that box, so the sheet sits in a
 * `popover="manual"` box that covers the viewport and shows in the top layer after its first
 * render.
 *
 * `<app-layer-sheet [heading]="label()" (openChange)="onSheetOpen($event)">
 *    <ng-template sheetBody>…</ng-template>
 *  </app-layer-sheet>`
 *
 * The host renders it while the sheet is open (`@if`), so `open` starts as `true`; the sheet
 * sets it to `false` when it closes itself (Escape, scrim, close button, drag). A host that
 * binds `open` and keeps the layer until `shown` turns false lets the sheet slide out.
 */
@Component({
  selector: 'app-layer-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, SheetBodyDirective, SideSheetComponent],
  templateUrl: './layer-sheet.component.html',
  styleUrl: './layer-sheet.component.scss',
})
export class LayerSheetComponent {
  readonly open = model(true);
  /** The title of the sheet, also its accessible name. */
  readonly heading = input.required<string>();
  /** The actions of the sheet header (see `app-side-sheet`). */
  readonly actions = input<readonly Action[]>([]);
  readonly action = output<{ readonly key: string }>();
  /** The content scrolls by itself; the body does not (see `app-side-sheet`). */
  readonly contentScrolls = input(false);

  protected readonly body = contentChild.required(SheetBodyDirective);
  private readonly layer = viewChild.required<ElementRef<HTMLElement>>('layer');
  private readonly sheet = viewChild(SideSheetComponent);
  /**
   * True from the opening until the sheet has slid out after its closing (`shown` of
   * `app-side-sheet`). A host that keeps the layer for the leave animation removes it after.
   */
  readonly shown = computed(() => this.sheet()?.shown() ?? false);

  constructor() {
    afterNextRender(() => showInTopLayer(this.layer().nativeElement));
  }
}
