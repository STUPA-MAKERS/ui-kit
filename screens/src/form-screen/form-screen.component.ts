import { _IdGenerator } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FabComponent,
  FabGroupComponent,
  IconComponent,
  ListDetailNav,
  UI_KIT_INTL,
  UnsavedChanges,
  type FormDef,
  type IconName,
  type ListDetailTask,
  type ScreenHead,
} from '@stupa-makers/ui-kit';

import { FormComponent, type FormValue } from '../form/form.component';
import { injectWidthClass } from '../width';

/** The submit button of a form screen. §S/framework/screens/002242 */
export interface FormScreenSubmit {
  readonly label: string;
  readonly busy?: boolean;
}

/** "Verwerfen" in the head while there are changes (000635). */
export interface FormScreenDiscard {
  readonly label: string;
}

/** A note above the form. */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenFormTop]', standalone: true })
export class ScreenFormTopDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * The form screen (§S/framework/screens/002242): the head bar of "Antrag bearbeiten" (001890)
 * with the icon, the title and "Abbrechen", the kit form, and "Speichern" floating at the
 * bottom while there are changes (000198). A navigation away from changes asks first.
 *
 * ```html
 * <app-form-screen [head]="{ title: 'Buchung anlegen' }" icon="swap" [form]="def"
 *   [value]="value()" [errors]="errors()" [submit]="{ label: 'Buchung anlegen', busy: saving() }"
 *   (valueChange)="value.set($event)" (submit)="save($event)" (cancel)="close()" />
 * ```
 *
 * After `submit`, the page saves; when `busy` ends without server errors, the form takes the
 * value as saved. In the one-view layout the head docks in the bar of the layout as a task.
 */
@Component({
  selector: 'app-form-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ButtonComponent,
    ConfirmDialogComponent,
    FabComponent,
    FabGroupComponent,
    FormComponent,
    IconComponent,
  ],
  templateUrl: './form-screen.component.html',
  styleUrl: './form-screen.component.scss',
})
export class FormScreenComponent {
  readonly head = input.required<ScreenHead>();
  /** The icon of the thing for a new one, the pen for an edit (001890). */
  readonly icon = input<IconName>('edit');
  readonly subtitle = input<string>('');
  readonly form = input.required<FormDef>();
  readonly value = input<FormValue>({});
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly submit = input.required<FormScreenSubmit>();
  readonly discard = input<FormScreenDiscard | null>(null);

  readonly valueChange = output<FormValue>();
  /** The person pressed the submit button and the form is valid. */
  readonly submitted = output<FormValue>({ alias: 'submit' });
  /** "Verwerfen": the page sets the saved value again. */
  readonly discarded = output<void>({ alias: 'discard' });
  /** "Abbrechen": the page closes the form; it asks first while there are changes. */
  readonly cancelled = output<void>({ alias: 'cancel' });

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly nav = inject(ListDetailNav, { optional: true });
  private readonly unsaved = inject(UnsavedChanges);
  protected readonly top = contentChild(ScreenFormTopDirective);
  protected readonly kitForm = viewChild.required(FormComponent);
  protected readonly titleId = inject(_IdGenerator).getId('app-form-screen-title-');

  /** The form has changes the page has not saved. */
  protected readonly dirty = computed(() => this.kitForm().dirty());
  protected readonly busy = computed(() => !!this.submit().busy);
  /** On a phone "Verwerfen" floats beside "Speichern", so the head keeps room for the title. */
  protected readonly phone = computed(() => this.width() === 'phone');
  private readonly width = injectWidthClass();
  /** The bar of the one-view layout shows the title and "Abbrechen". */
  protected readonly docked = computed(() => !!this.nav?.active());

  /** The question before leaving; it resolves with the answer. */
  protected readonly leaving = signal<((leave: boolean) => void) | null>(null);
  /** The last submit has not met a change or a server error since. */
  private readonly sent = signal(false);
  private latest: FormValue = {};

  constructor() {
    this.holdWhileDirty();
    this.takeSavedValue();
    this.dockInLayoutBar();
  }

  protected onValue(value: FormValue): void {
    this.latest = value;
    this.sent.set(false);
    this.valueChange.emit(value);
  }

  protected onSubmit(): void {
    if (this.busy() || !this.kitForm().showErrors()) return;
    this.sent.set(true);
    this.submitted.emit(this.latest);
  }

  protected onDiscard(): void {
    this.discarded.emit();
    queueMicrotask(() => this.kitForm().markPristine());
  }

  protected async onCancel(): Promise<void> {
    if (this.dirty() && !(await this.ask())) return;
    this.release?.();
    this.release = null;
    this.cancelled.emit();
  }

  protected answer(leave: boolean): void {
    this.leaving()?.(leave);
    this.leaving.set(null);
  }

  private ask(): Promise<boolean> {
    return new Promise((resolve) => this.leaving.set(resolve));
  }

  private release: (() => void) | null = null;

  /** Hold a place in `UnsavedChanges` while there are changes, so the route guard asks. */
  private holdWhileDirty(): void {
    effect((onCleanup) => {
      const hold = this.dirty() && !this.busy() && !(this.sent() && !this.hasErrors());
      if (!hold) return;
      const release = untracked(() => this.unsaved.hold(() => this.ask()));
      this.release = release;
      onCleanup(() => {
        release();
        if (this.release === release) this.release = null;
      });
    });
  }

  private hasErrors(): boolean {
    return Object.keys(this.errors()).length > 0;
  }

  /** When `busy` ends without server errors, the form takes the value as saved. */
  private takeSavedValue(): void {
    const wasBusy = signal(false);
    effect(() => {
      const busy = this.busy();
      const errors = this.errors();
      untracked(() => {
        if (wasBusy() && !busy && Object.keys(errors).length === 0) this.kitForm().markPristine();
        wasBusy.set(busy);
      });
    });
  }

  /** In the one-view layout the bar of the layout shows the title and "Abbrechen". */
  private dockInLayoutBar(): void {
    const nav = this.nav;
    if (!nav) return;
    effect((onCleanup) => {
      if (!this.docked()) return;
      const task: ListDetailTask = {
        title: this.head().title,
        cancelLabel: this.intl.translate('confirm.cancel'),
        cancel: () => void this.onCancel(),
      };
      untracked(() => nav.task.set(task));
      onCleanup(() => {
        if (nav.task() === task) nav.task.set(null);
      });
    });
  }
}
