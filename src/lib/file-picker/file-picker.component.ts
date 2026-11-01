import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * The hidden file input behind a button of the page ("Datei wählen", "Logo ersetzen").
 * It renders no box: the page places its own button and calls `open()`.
 *
 * `<app-file-picker #picker accept=".age" (picked)="upload($event)" />`
 * `<app-button (click)="picker.open()">Importieren</app-button>`
 *
 * After each choice the input forgets its value, so the same file can be chosen again
 * (after an error, or to upload it once more). A cancelled dialog emits nothing.
 */
@Component({
  selector: 'app-file-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-picker.component.html',
  styleUrl: './file-picker.component.scss',
})
export class FilePickerComponent {
  /** The `accept` filter of the file dialog (".pdf,image/*"). */
  readonly accept = input('');
  readonly multiple = input(false);
  readonly disabled = input(false);
  /** The chosen files, at least one. */
  readonly picked = output<File[]>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  /** Open the file dialog of the browser. */
  open(): void {
    if (this.disabled()) return;
    this.field().nativeElement.click();
  }

  protected onChange(): void {
    const el = this.field().nativeElement;
    const files = Array.from(el.files ?? []);
    el.value = '';
    if (files.length) this.picked.emit(files);
  }
}
