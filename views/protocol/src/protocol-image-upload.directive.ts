import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { from, of } from "rxjs";
import { catchError, concatMap, finalize, map } from "rxjs/operators";
import { registerUiKitTexts, UI_KIT_INTL } from "@stupa-makers/ui-kit";
import {
  PROTOCOL_API,
  PROTOCOL_IMAGE_TYPES,
  protocolImage,
} from "./protocol-api";
import { UI_KIT_PROTOCOL_TEXTS } from "./protocol.texts";

/**
 * Image upload for a Markdown `<textarea>`. A paste or a drop of image files (PNG, JPEG,
 * GIF, WebP) uploads each file through the `PROTOCOL_API` port and inserts
 * `![alt](<path>)` at the caret. Before the upload, a dialog asks for the
 * alternative text of each file (app spec 000506); a cancelled file is not uploaded. A
 * placeholder holds the place while the upload runs. On an error the placeholder goes away and the port names the cause.
 * `pick()` opens a file dialog for an explicit "insert image" button.
 *
 * The directive writes the textarea value and then dispatches an `input` event, so
 * `ngModel` and `(input)` bindings get the new text. Files upload one after the other,
 * so parallel requests do not trip the rate limit (429). Without the port it uploads nothing.
 */
@Directive({
  selector: "textarea[appProtocolImageUpload]",
  standalone: true,
  exportAs: "protocolImageUpload",
  host: {
    "(paste)": "onPaste($event)",
    "(dragover)": "onDragOver($event)",
    "(drop)": "onDrop($event)",
  },
})
export class ProtocolImageUploadDirective {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_PROTOCOL_TEXTS);

  private readonly el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
  private readonly api = inject(PROTOCOL_API, { optional: true });
  private readonly i18n = inject(UI_KIT_INTL);
  private readonly destroyRef = inject(DestroyRef);

  /** The number of the last placeholder, so each placeholder of this field is unique. */
  private placeholderSeq = 0;

  /** The number of uploads that still run. */
  readonly uploading = signal(0);

  /** Open the file dialog of the browser for image files. */
  pick(): void {
    if (this.locked()) return;
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", PROTOCOL_IMAGE_TYPES.join(","));
    input.toggleAttribute("multiple", true);
    input.addEventListener("change", () =>
      this.upload(Array.from(input.files ?? [])),
    );
    input.click();
  }

  onPaste(event: ClipboardEvent): void {
    const files = imagesOf(event.clipboardData?.files);
    if (!files.length || this.locked()) return;
    event.preventDefault();
    this.upload(files);
  }

  onDragOver(event: DragEvent): void {
    if (
      Array.from(event.dataTransfer?.items ?? []).some((i) =>
        isImageType(i.type),
      )
    ) {
      event.preventDefault();
    }
  }

  onDrop(event: DragEvent): void {
    const files = imagesOf(event.dataTransfer?.files);
    if (!files.length || this.locked()) return;
    event.preventDefault();
    this.upload(files);
  }

  /**
   * Ask for the alt text of each image file, then upload them and insert a reference for
   * each. Other files are ignored.
   */
  upload(files: readonly File[]): void {
    const images = files.filter((f) => isImageType(f.type));
    const api = this.api;
    if (!images.length || this.locked() || !api) return;
    void api.imageAlts(images).then((picked) => this.send(picked));
  }

  private send(picked: readonly { file: File; alt: string }[]): void {
    const api = this.api;
    if (!picked.length || this.locked() || !api) return;
    const slots = picked.map(({ file, alt }) => ({
      file,
      alt,
      mark: this.insertPlaceholder(),
    }));
    this.uploading.update((n) => n + slots.length);
    from(slots)
      .pipe(
        concatMap((slot) =>
          from(api.uploadImage(slot.file)).pipe(
            map((src) => protocolImage(slot.alt, src)),
            catchError(() => of("")),
            map((text) => this.replace(slot.mark, text)),
            finalize(() => this.uploading.update((n) => n - 1)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** A read-only or disabled textarea takes no image: the text must not change. */
  private locked(): boolean {
    const area = this.el.nativeElement;
    return area.readOnly || area.disabled;
  }

  /** Put a unique placeholder over the selection. It sits on a line of its own. */
  private insertPlaceholder(): string {
    const area = this.el.nativeElement;
    this.placeholderSeq = this.placeholderSeq + 1;
    const mark = `![${this.i18n.translate("markdown.image.uploading")} #${this.placeholderSeq}]()`;
    const value = area.value;
    const start = area.selectionStart ?? value.length;
    const end = area.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const tail = after.startsWith("\n") ? "" : "\n";
    const text = `${lead}${mark}${tail}`;
    this.write(before + text + after, before.length + text.length);
    return mark;
  }

  /**
   * Replace the placeholder. When the placeholder is gone, the result is dropped: the user
   * deleted it or the textarea now shows another text, and the image must not go into
   * that text.
   */
  private replace(mark: string, text: string): void {
    const area = this.el.nativeElement;
    const value = area.value;
    const at = value.indexOf(mark);
    if (at < 0) return;
    const after = at + mark.length;
    const end = !text && value[after] === "\n" ? after + 1 : after;
    this.write(value.slice(0, at) + text + value.slice(end), at + text.length);
  }

  private write(value: string, caret: number | null): void {
    const area = this.el.nativeElement;
    Reflect.set(area, "value", value);
    if (caret !== null && document.activeElement === area) {
      area.setSelectionRange(caret, caret);
    }
    area.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function isImageType(type: string): boolean {
  return PROTOCOL_IMAGE_TYPES.includes(type);
}

function imagesOf(list: FileList | null | undefined): readonly File[] {
  return Array.from(list ?? []).filter((f) => isImageType(f.type));
}
