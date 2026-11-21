import { _IdGenerator } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FormField,
  applyEach,
  disabled,
  form,
  hidden,
  required,
  validate,
  type FieldTree,
  type SchemaPath,
} from '@angular/forms/signals';
import {
  ButtonComponent,
  CheckboxComponent,
  CurrencyInputComponent,
  DateRangeComponent,
  DatepickerComponent,
  ErrorTextComponent,
  FilePickerComponent,
  IconComponent,
  InputComponent,
  SelectFieldComponent,
  SwitchComponent,
  TextareaComponent,
  TimeInputComponent,
  UI_KIT_INTL,
  UI_KIT_UPLOAD,
  type FieldDef,
  type FormDef,
  type SelectFieldOption,
  type TreeOption,
  type UiKitTextKey,
  type UploadedFile,
} from '@stupa-makers/ui-kit';
import { MarkdownEditorComponent } from '@stupa-makers/ui-kit/markdown-editor';

import {
  cleanValue,
  emptyRow,
  fieldError,
  sameValue,
  valueFields,
  withDefaults,
  type FieldError,
} from './form.rules';

/** The value of a form: one entry for each field key. */
export type FormValue = Record<string, unknown>;

/** A field left by the person in a section with `autosave`. §S/framework/forms/002256 */
export interface FormCommit {
  readonly key: string;
  readonly value: unknown;
}

type Tree = FieldTree<FormValue>;
type AnyPath = SchemaPath<unknown>;

const INPUT_TYPE: Partial<Record<FieldDef['kind'], string>> = {
  text: 'text',
  email: 'email',
  url: 'url',
  iban: 'text',
  number: 'number',
};

/**
 * The form of the kit (§S/framework/forms/002222): it builds every field of a `FormDef` from
 * the fields of the kit, on Angular signal forms. The app gives the definition, the value and
 * the server errors by field key; the form checks required, limits and formats itself and
 * reports the value, `valid` and `dirty` (§S/framework/forms/002256).
 *
 * ```html
 * <app-form #f [form]="def()" [value]="value()" [errors]="errors()"
 *   (valueChange)="value.set($event)" />
 * <app-button (click)="f.showErrors() && save()">Speichern</app-button>
 * ```
 *
 * A field shows its own error after the person left it or after `showErrors()`; a server
 * error shows until the field changes. `showErrors()` moves the focus to the first field with
 * an error (000519).
 */
@Component({
  selector: 'app-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    FormField,
    ButtonComponent,
    CheckboxComponent,
    CurrencyInputComponent,
    DateRangeComponent,
    DatepickerComponent,
    ErrorTextComponent,
    FilePickerComponent,
    IconComponent,
    InputComponent,
    MarkdownEditorComponent,
    SelectFieldComponent,
    SwitchComponent,
    TextareaComponent,
    TimeInputComponent,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  readonly form = input.required<FormDef>();
  readonly value = input<FormValue>({});
  /** Errors of the server by field key; each shows until its field changes. */
  readonly errors = input<Readonly<Record<string, string>>>({});

  /** The whole value after each change, without hidden fields. */
  readonly valueChange = output<FormValue>();
  /** A field of an `autosave` section that the person left with a new value. */
  readonly commit = output<FormCommit>();

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly upload = inject(UI_KIT_UPLOAD);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly uid = inject(_IdGenerator).getId('app-form-');

  private readonly fields = computed(() => valueFields(this.form()));

  /** The model of signal forms; it follows the input value, and keeps itself on an echo. */
  protected readonly model = linkedSignal<FormValue, FormValue>({
    source: () => withDefaults(this.fields(), this.value()),
    computation: (incoming, previous) =>
      previous && sameValue(previous.value, incoming) ? previous.value : incoming,
  });

  /** The keys and kinds of the fields; the tree is built again only when they change. */
  private readonly shape = computed(() => shapeOf(this.fields()), { equal: (a, b) => a === b });

  protected readonly tree: Signal<Tree> = computed(() => {
    this.shape();
    return untracked(() =>
      form(this.model, (p) => this.rules(p as unknown as Record<string, AnyPath>, []), {
        injector: this.injector,
      }),
    );
  });

  /** All fields are valid (hidden and disabled fields do not count). */
  readonly valid = computed(() => this.tree()().valid());
  /** The person changed a field since the start or since `markPristine()`. */
  readonly dirty = computed(() => this.tree()().dirty());

  /** After `showErrors()`, every field shows its error. */
  private readonly showAll = signal(false);

  /** The server errors and the values they were given for. */
  private readonly serverErrors = linkedSignal<
    Readonly<Record<string, string>>,
    { readonly errors: Readonly<Record<string, string>>; readonly at: FormValue }
  >({
    source: () => this.errors(),
    computation: (errors) => ({ errors, at: untracked(() => this.model()) }),
  });

  private readonly uploading = signal<ReadonlySet<string>>(new Set());
  private readonly uploadErrors = signal<Readonly<Record<string, string>>>({});
  private readonly committed = signal<Readonly<Record<string, unknown>>>({});

  constructor() {
    effect(() => {
      const model = this.model();
      const fields = this.fields();
      const incoming = untracked(() => withDefaults(fields, this.value()));
      if (!sameValue(model, incoming)) this.valueChange.emit(cleanValue(fields, model));
    });
    this.watchAutosaveSections();
  }

  /**
   * Show every error and move the focus to the first field with one. Returns whether the
   * form is valid, so a submit reads `f.showErrors() && save()`.
   */
  showErrors(): boolean {
    this.showAll.set(true);
    if (this.valid() && !this.firstErrorKey()) return true;
    const key = this.firstErrorKey();
    if (key) queueMicrotask(() => this.focusField(key));
    return false;
  }

  /** The current value is the new start: `dirty` is false and no field shows an error. */
  markPristine(): void {
    this.tree()().reset();
    this.showAll.set(false);
  }

  // ---------------------------------------------------------------- template helpers

  protected fieldId(key: string, path: readonly (string | number)[] = []): string {
    return [this.uid, ...path, key].join('-');
  }

  protected errorId(key: string, path: readonly (string | number)[] = []): string {
    return `${this.fieldId(key, path)}-error`;
  }

  protected inputType(field: FieldDef): string {
    return INPUT_TYPE[field.kind] ?? 'text';
  }

  /** The text of the error that the field shows now, or `''`. */
  protected errorText(
    field: FieldDef,
    tree: Tree,
    path: readonly (string | number)[] = [],
  ): string {
    const state = tree[field.key]?.();
    if (!state) return '';
    const value = state.value();
    if (path.length === 0) {
      const server = this.serverErrors();
      const text = server.errors[field.key];
      if (text && sameValue(server.at[field.key], this.model()[field.key])) return text;
      const upload = this.uploadErrors()[field.key];
      if (upload) return upload;
    }
    if (!this.showAll() && !state.touched()) return '';
    const error = fieldError(field, value);
    return error ? this.message(error) : '';
  }

  protected message(error: FieldError): string {
    return this.intl.translate(`form.${error.kind}` as UiKitTextKey, error.params as never);
  }

  protected visible(field: FieldDef): boolean {
    return field.visible !== false;
  }

  protected touch(tree: Tree, key: string): void {
    tree[key]?.().markAsTouched();
  }

  protected setValue(tree: Tree, key: string, value: unknown): void {
    const state = tree[key]?.();
    if (!state) return;
    state.value.set(value);
    state.markAsDirty();
  }

  protected treeOptions(field: FieldDef): readonly SelectFieldOption[] {
    if (field.kind !== 'tree-select') return [];
    const walk = (nodes: readonly TreeOption[], depth: number): SelectFieldOption[] =>
      nodes.flatMap((n) => {
        const group = !!n.children?.length;
        const option: SelectFieldOption = {
          value: n.value,
          label: `${'\u2003'.repeat(depth)}${n.label}`,
          disabled: group && !!field.leavesOnly,
        };
        return [option, ...(group ? walk(n.children ?? [], depth + 1) : [])];
      });
    return walk(field.tree, 0);
  }

  protected has(tree: Tree, key: string, option: string): boolean {
    const v = tree[key]?.().value();
    return Array.isArray(v) && v.includes(option);
  }

  protected toggleOption(tree: Tree, key: string, option: string, on: boolean): void {
    const v = tree[key]?.().value();
    const list = Array.isArray(v) ? (v as string[]) : [];
    const next = on
      ? [...list.filter((x) => x !== option), option]
      : list.filter((x) => x !== option);
    this.setValue(tree, key, next);
    this.touch(tree, key);
  }

  protected rows(tree: Tree, key: string): readonly Tree[] {
    const node = tree[key] as unknown as { length?: number } & Record<number, Tree>;
    const v = tree[key]?.().value();
    const n = Array.isArray(v) ? v.length : 0;
    return Array.from({ length: n }, (_, i) => node[i]);
  }

  protected addRow(tree: Tree, field: FieldDef): void {
    if (field.kind !== 'repeat') return;
    const v = tree[field.key]?.().value();
    const list = Array.isArray(v) ? v : [];
    this.setValue(tree, field.key, [...list, emptyRow(field.fields)]);
  }

  protected removeRow(tree: Tree, field: FieldDef, index: number): void {
    const v = tree[field.key]?.().value();
    const list = Array.isArray(v) ? v : [];
    this.setValue(
      tree,
      field.key,
      list.filter((_, i) => i !== index),
    );
    this.touch(tree, field.key);
  }

  protected canAdd(tree: Tree, field: FieldDef): boolean {
    if (field.kind !== 'repeat' || field.disabled) return false;
    const v = tree[field.key]?.().value();
    return field.max === undefined || (Array.isArray(v) ? v.length : 0) < field.max;
  }

  protected canRemove(tree: Tree, field: FieldDef): boolean {
    if (field.kind !== 'repeat' || field.disabled) return false;
    const v = tree[field.key]?.().value();
    return field.min === undefined || (Array.isArray(v) ? v.length : 0) > field.min;
  }

  protected files(tree: Tree, key: string): readonly UploadedFile[] {
    const v = tree[key]?.().value();
    return Array.isArray(v) ? (v as UploadedFile[]) : [];
  }

  protected isUploading(key: string): boolean {
    return this.uploading().has(key);
  }

  protected canUpload(field: FieldDef): boolean {
    return this.upload !== null && !field.disabled && !this.isUploading(field.key);
  }

  protected async pickFiles(tree: Tree, field: FieldDef, picked: File[]): Promise<void> {
    if (field.kind !== 'file' || !this.upload) return;
    const tooLarge = field.maxBytes !== undefined && picked.some((f) => f.size > field.maxBytes!);
    if (tooLarge) {
      this.uploadErrors.update((e) => ({
        ...e,
        [field.key]: this.intl.translate('form.tooLarge'),
      }));
      return;
    }
    this.uploadErrors.update(({ [field.key]: _gone, ...rest }) => rest);
    this.remember(field.key);
    this.uploading.update((s) => new Set([...s, field.key]));
    try {
      const done = await Promise.all(picked.map((f) => this.upload!(f)));
      const list = field.multiple ? [...this.files(tree, field.key), ...done] : done.slice(0, 1);
      this.setValue(tree, field.key, list);
      this.touch(tree, field.key);
      this.commitIfAutosave(field.key);
    } catch {
      this.uploadErrors.update((e) => ({
        ...e,
        [field.key]: this.intl.translate('form.uploadFailed'),
      }));
    } finally {
      this.uploading.update((s) => new Set([...s].filter((k) => k !== field.key)));
    }
  }

  protected removeFile(tree: Tree, key: string, index: number): void {
    this.remember(key);
    this.setValue(
      tree,
      key,
      this.files(tree, key).filter((_, i) => i !== index),
    );
    this.commitIfAutosave(key);
  }

  /** The focus left a top-level field: mark it touched, and commit it in an autosave section. */
  protected leave(event: FocusEvent, key: string): void {
    const box = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && box.contains(event.relatedTarget)) return;
    this.touch(this.tree(), key);
    this.commitIfAutosave(key);
  }

  // ---------------------------------------------------------------- internals

  /** The rules of signal forms for the fields at a path; they read the current definition. */
  private rules(p: Record<string, AnyPath>, repeatPath: readonly string[]): void {
    const defs = this.defsAt(
      untracked(() => this.fields()),
      repeatPath,
    );
    defs.forEach((def) => {
      const key = def.key;
      const current = (): FieldDef | undefined =>
        this.defsAt(this.fields(), repeatPath).find((f) => f.key === key);
      const path = p[key];
      hidden(path, () => current()?.visible === false);
      disabled(path, () => !!current()?.disabled);
      // The required mark of the kit fields reads this rule through `[formField]`.
      required(path, { when: () => !!current()?.required });
      validate(path, ({ value }) => {
        const f = current();
        const error = f ? fieldError(f, value()) : null;
        return error ? { kind: error.kind } : undefined;
      });
      if (def.kind === 'repeat') {
        applyEach(path as SchemaPath<readonly unknown[]>, (row) =>
          this.rules(row as unknown as Record<string, AnyPath>, [...repeatPath, key]),
        );
      }
    });
  }

  private defsAt(fields: readonly FieldDef[], repeatPath: readonly string[]): readonly FieldDef[] {
    return repeatPath.reduce<readonly FieldDef[]>((list, key) => {
      const f = list.find((x) => x.key === key);
      return f?.kind === 'repeat' ? f.fields : [];
    }, fields);
  }

  private firstErrorKey(): string | null {
    const model = this.model();
    const server = this.serverErrors();
    const hit = this.fields().find((f) => {
      if (server.errors[f.key] && sameValue(server.at[f.key], model[f.key])) return true;
      if (fieldError(f, model[f.key])) return true;
      if (f.kind !== 'repeat') return false;
      const rows = Array.isArray(model[f.key]) ? (model[f.key] as FormValue[]) : [];
      return rows.some((row) => f.fields.some((sub) => fieldError(sub, row[sub.key])));
    });
    return hit?.key ?? null;
  }

  private focusField(key: string): void {
    const box = this.host.nativeElement.querySelector(`[data-field="${CSS.escape(key)}"]`);
    const target = box?.querySelector<HTMLElement>(
      'input:not([type=hidden]):not([disabled]), textarea, select, button, [contenteditable=true], [tabindex="0"]',
    );
    target?.focus();
  }

  private sectionOf(key: string): FormDef['sections'][number] | undefined {
    return this.form().sections.find((s) => s.fields.some((f) => f.key === key));
  }

  /** The value of a field of an autosave section before the person starts on it. */
  protected remember(key: string): void {
    if (!this.sectionOf(key)?.autosave || key in this.committed()) return;
    const value = cleanValue(this.fields(), this.model())[key];
    this.committed.update((c) => ({ ...c, [key]: value }));
  }

  private commitIfAutosave(key: string): void {
    if (!this.sectionOf(key)?.autosave || !(key in this.committed())) return;
    const value = cleanValue(this.fields(), this.model())[key];
    if (sameValue(this.committed()[key], value)) return;
    this.committed.update((c) => ({ ...c, [key]: value }));
    this.commit.emit({ key, value });
  }

  /** A section with `autosave` commits its changed fields when it leaves the page (000850). */
  private watchAutosaveSections(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    afterRenderEffect((onCleanup) => {
      const sections = this.form().sections.filter((s) => s.autosave);
      if (!sections.length) return;
      const observer = new IntersectionObserver((entries) =>
        entries
          .filter((entry) => !entry.isIntersecting)
          .forEach((entry) => {
            const key = (entry.target as HTMLElement).dataset['section'];
            const section = sections.find((s) => s.key === key);
            section?.fields.forEach((f) => f.kind !== 'display' && this.commitIfAutosave(f.key));
          }),
      );
      sections
        .map((s) => this.host.nativeElement.querySelector(`[data-section="${CSS.escape(s.key)}"]`))
        .forEach((el) => el && observer.observe(el));
      onCleanup(() => observer.disconnect());
    });
  }
}

function shapeOf(fields: readonly FieldDef[]): string {
  return fields
    .map((f) => `${f.key}:${f.kind}${f.kind === 'repeat' ? `(${shapeOf(f.fields)})` : ''}`)
    .join(',');
}
