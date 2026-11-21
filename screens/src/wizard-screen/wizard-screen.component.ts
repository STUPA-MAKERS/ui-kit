import { _IdGenerator } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  ButtonGroupComponent,
  ConfirmDialogComponent,
  FieldGroupComponent,
  FieldRowComponent,
  IconComponent,
  ListDetailBarComponent,
  ListDetailNavDirective,
  SectionComponent,
  StepperComponent,
  ToastService,
  markdownToSafeHtml,
  UI_KIT_INTL,
  type FieldDef,
  type FormDef,
  type ScreenHead,
  type Step,
} from '@stupa-makers/ui-kit';

import { FormComponent, type FormValue } from '../form/form.component';
import { injectWidthClass } from '../width';

/** A step of the form: its name in the stepper, its title, and the sections it shows. */
export interface WizardStep {
  readonly key: string;
  /** The name in the stepper ("Angaben"). */
  readonly label: string;
  /** The title of the step in the sheet. */
  readonly title: string;
  /** The keys of the sections of the `FormDef` that the step shows, in their order. */
  readonly sections: readonly string[];
}

/** A group of options of the choice step (STUPA-Workflow:001181, 002282). */
export interface WizardChoiceGroup {
  readonly key: string;
  /** Without a label the options stand alone. */
  readonly label?: string;
  /** Markdown, always visible under the label (lists, bold, links; no images). */
  readonly text?: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

/** The choice step before the form, for example the Antragsart. */
export interface WizardIntro {
  readonly key: string;
  readonly label: string;
  readonly title: string;
  readonly groups: readonly WizardChoiceGroup[];
  /** The value the page keeps; Weiter needs one. */
  readonly chosen: string | null;
}

/** The summary step after the form ("Prüfen & absenden"). */
export interface WizardReview {
  readonly key: string;
  readonly label: string;
  readonly title: string;
  /** The second line in the stepper ("Zusammenfassung"). */
  readonly hint?: string;
}

/** "Entwurf verwerfen" in the footer, with its question. */
export interface WizardDiscard {
  readonly label: string;
  readonly title: string;
  readonly body: string;
}

/** The submit button that takes the place of Weiter on the last step. */
export interface WizardSubmit {
  readonly label: string;
  readonly busy?: boolean;
  readonly disabled?: boolean;
}

/** The way out on a phone: the back arrow of the bar ("Zur Startseite"). */
export interface WizardLeave {
  readonly label: string;
}

/** A block of the page below the fields of one step (Folgeantrag, Kontakt, ALTCHA). */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenWizardStep]', standalone: true })
export class ScreenWizardStepDirective {
  readonly key = input.required<string>({ alias: 'screenWizardStep' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

interface ShownStep {
  readonly key: string;
  readonly kind: 'intro' | 'form' | 'review';
  readonly label: string;
  readonly title: string;
  readonly sections: readonly string[];
}

/** One line of the summary: the label of a field and its value as text. */
interface ReviewRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}

/** A section of the summary. */
interface ReviewSection {
  readonly key: string;
  readonly label: string;
  readonly rows: readonly ReviewRow[];
}

/**
 * The wizard screen (§S/framework/screens/002243), the frame of "Antrag stellen": the title
 * and the stepper on the left, the sheet of the step with "Schritt n von m" and its title,
 * the kit form of the step's sections, and Zurück, Weiter and the submit button in the
 * footer of the sheet. A choice step can come first, a summary last. Weiter checks the
 * fields of the step; the step is in the URL (`step`, counted from 1).
 *
 * On a phone the stepper goes, the sheet takes the width, and with `leave` the bar at the
 * top shows the back arrow and the title.
 */
@Component({
  selector: 'app-wizard-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ButtonComponent,
    ButtonGroupComponent,
    ConfirmDialogComponent,
    FieldGroupComponent,
    FieldRowComponent,
    FormComponent,
    IconComponent,
    ListDetailBarComponent,
    ListDetailNavDirective,
    SectionComponent,
    StepperComponent,
  ],
  templateUrl: './wizard-screen.component.html',
  styleUrl: './wizard-screen.component.scss',
})
export class WizardScreenComponent {
  readonly head = input.required<ScreenHead>();
  // Not required: the screen reads the form before its template binds the inputs.
  readonly form = input<FormDef>({ sections: [] });
  readonly steps = input<readonly WizardStep[]>([]);
  readonly value = input<FormValue>({});
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly intro = input<WizardIntro | null>(null);
  readonly review = input<WizardReview | null>(null);
  readonly submit = input.required<WizardSubmit>();
  readonly discard = input<WizardDiscard | null>(null);
  /** The note under the stepper ("Entwurf in diesem Tab gespeichert"); null shows none. */
  readonly saved = input<string | null>(null);
  readonly leave = input<WizardLeave | null>(null);
  /** The step to start on, counted from 0; the `step` of the URL wins. */
  readonly step = input(0);

  readonly valueChange = output<FormValue>();
  readonly stepChange = output<number>();
  /** The person picked an option of the choice step. */
  readonly choice = output<string>();
  /** The submit button: the form is valid. */
  readonly submitted = output<FormValue>({ alias: 'submit' });
  /** The person confirmed "Entwurf verwerfen". */
  readonly discarded = output<void>({ alias: 'discard' });
  /** The back arrow of the bar on a phone. */
  readonly left = output<void>({ alias: 'leave' });

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });
  protected readonly kitForm = viewChild.required(FormComponent);
  private readonly slots = contentChildren(ScreenWizardStepDirective);
  protected readonly titleId = inject(_IdGenerator).getId('app-wizard-step-');

  /** The rendered Markdown text of each group, by key. */
  protected readonly groupHtml = computed(
    () =>
      new Map(
        (this.intro()?.groups ?? [])
          .filter((g) => g.text?.trim())
          .map((g) => [
            g.key,
            markdownToSafeHtml(g.text ?? '', { headingOffset: 0, imageSrc: null }),
          ]),
      ),
  );

  private readonly width = injectWidthClass();
  protected readonly phone = computed(() => this.width() === 'phone');
  /** The own bar of a phone: the back arrow and the title. */
  protected readonly bar = computed(() => this.phone() && this.leave() !== null);

  protected readonly confirmDiscard = signal(false);
  private latest: FormValue = {};

  /** Every step in order: the choice, the form steps, the summary. */
  protected readonly shown = computed<readonly ShownStep[]>(() => {
    const intro = this.intro();
    const review = this.review();
    return [
      ...(intro ? [{ ...intro, kind: 'intro' as const, sections: [] }] : []),
      ...this.steps().map((s) => ({ ...s, kind: 'form' as const })),
      ...(review ? [{ ...review, kind: 'review' as const, sections: [] }] : []),
    ];
  });

  protected readonly active = linkedSignal(() => this.clamp(this.step()));
  protected readonly current = computed(() => this.shown()[this.active()] ?? null);
  protected readonly last = computed(() => this.active() >= this.shown().length - 1);

  /** The steps of the stepper, each with the line below its name. */
  protected readonly stepperSteps = computed<Step[]>(() =>
    this.shown().map((s) => ({ label: s.label, hint: this.hintOf(s) })),
  );

  /** "Schritt 2 von 4 · Förderantrag": after the choice its option follows the count. */
  protected readonly stepLine = computed(() => {
    const line = this.intl.translate('wizard.stepOf', {
      n: this.active() + 1,
      total: this.shown().length,
    });
    const chosen = this.active() > 0 ? this.chosenLabel() : '';
    return chosen ? `${line} · ${chosen}` : line;
  });

  /** The sections the form shows now: those of a form step, none on the other steps. */
  protected readonly only = computed(() => this.current()?.sections ?? []);

  protected readonly slot = computed(() => {
    const key = this.current()?.key;
    return this.slots().find((s) => s.key() === key) ?? null;
  });

  protected readonly summary = computed<readonly ReviewSection[]>(() => {
    const value = this.value();
    const byKey = new Map(this.form().sections.map((s) => [s.key, s]));
    return this.steps().flatMap((step) =>
      step.sections.flatMap((key) => {
        const section = byKey.get(key);
        if (!section) return [];
        const rows = section.fields.flatMap((f) => reviewRows(f, value[f.key], this.yesNo()));
        return rows.length ? [{ key, label: section.label ?? step.label, rows }] : [];
      }),
    );
  });

  constructor() {
    this.followUrl();
  }

  protected onValue(value: FormValue): void {
    this.latest = value;
    this.valueChange.emit(value);
  }

  protected pick(value: string): void {
    this.choice.emit(value);
  }

  protected goTo(index: number): void {
    if (index < this.active()) this.move(index);
  }

  protected prev(): void {
    if (this.active() > 0) this.move(this.active() - 1);
  }

  /** Weiter: the choice needs a pick, a form step checks its fields. */
  protected next(): void {
    const step = this.current();
    if (!step) return;
    if (step.kind === 'intro' && !this.intro()?.chosen) return;
    if (step.kind === 'form' && !this.kitForm().showErrors(step.sections)) {
      this.toast.show({ text: this.intl.translate('wizard.invalid'), kind: 'error' });
      return;
    }
    this.move(this.active() + 1);
  }

  /** The submit button: every form step must be valid; the first one with an error opens. */
  protected onSubmit(): void {
    if (this.submit().busy) return;
    const bad = this.shown().findIndex(
      (s) => s.kind === 'form' && !this.kitForm().showErrors(s.sections),
    );
    if (bad >= 0) {
      this.toast.show({ text: this.intl.translate('wizard.invalid'), kind: 'error' });
      if (bad !== this.active()) this.move(bad);
      return;
    }
    this.submitted.emit(this.latest);
  }

  protected onDiscard(): void {
    this.confirmDiscard.set(false);
    this.discarded.emit();
  }

  protected checked(value: string): boolean {
    return this.intro()?.chosen === value;
  }

  private chosenLabel(): string {
    const intro = this.intro();
    if (!intro?.chosen) return '';
    const option = intro.groups.flatMap((g) => g.options).find((o) => o.value === intro.chosen);
    return option?.label ?? '';
  }

  private hintOf(step: ShownStep): string | null {
    if (step.kind === 'intro') return this.chosenLabel() || null;
    if (step.kind === 'review') return this.review()?.hint ?? null;
    const byKey = new Map(this.form().sections.map((s) => [s.key, s.label]));
    const labels = step.sections.map((k) => byKey.get(k)).filter((l): l is string => !!l);
    return labels.length ? labels.join(', ') : null;
  }

  private yesNo(): readonly [string, string] {
    return [this.intl.translate('wizard.yes'), ''];
  }

  private clamp(index: number): number {
    return Math.max(0, Math.min(index, Math.max(0, this.shown().length - 1)));
  }

  private move(index: number): void {
    const to = this.clamp(index);
    this.active.set(to);
    this.stepChange.emit(to);
    void this.router?.navigate([], {
      relativeTo: this.route,
      queryParams: { step: to + 1 },
      queryParamsHandling: 'merge',
    });
    queueMicrotask(() => window.scrollTo({ top: 0 }));
  }

  /** The `step` of the URL (from 1) sets the step, also on the back button of the browser. */
  private followUrl(): void {
    const route = this.route;
    if (!route) return;
    const fromUrl = signal<number | null>(null);
    const sub = route.queryParamMap.subscribe((q) => {
      const n = Number(q.get('step'));
      fromUrl.set(Number.isInteger(n) && n > 0 ? n - 1 : null);
    });
    effect((onCleanup) => {
      onCleanup(() => sub.unsubscribe());
    });
    effect(() => {
      const n = fromUrl();
      if (n === null) return;
      untracked(() => {
        // A step after a choice that has none yet cannot open from the URL.
        const blocked = this.intro() !== null && !this.intro()?.chosen && n > 0;
        this.active.set(this.clamp(blocked ? 0 : n));
      });
    });
  }
}

/** The lines of the summary for one field: none when it is empty or only text. */
function reviewRows(
  field: FieldDef,
  value: unknown,
  yesNo: readonly [string, string],
): readonly ReviewRow[] {
  if (field.visible === false || field.kind === 'display') return [];
  if (field.kind === 'repeat') {
    const rows = Array.isArray(value) ? (value as FormValue[]) : [];
    return rows.flatMap((row, i) => {
      const parts = field.fields
        .map((sub) => display(sub, row[sub.key], yesNo))
        .filter((t) => t !== '');
      return parts.length
        ? [{ key: `${field.key}-${i}`, label: `${field.label} ${i + 1}`, value: parts.join(' · ') }]
        : [];
    });
  }
  const text = display(field, value, yesNo);
  return text === '' ? [] : [{ key: field.key, label: field.label, value: text }];
}

/** The value of a field as text for the summary. */
function display(field: FieldDef, value: unknown, yesNo: readonly [string, string]): string {
  if (value === null || value === undefined || value === '') return '';
  switch (field.kind) {
    case 'checkbox':
    case 'switch':
      return value ? yesNo[0] : '';
    case 'select':
      return field.options.find((o) => o.value === value)?.label ?? String(value);
    case 'multi-select': {
      const picked = Array.isArray(value) ? (value as unknown[]) : [];
      return field.options
        .filter((o) => picked.includes(o.value))
        .map((o) => o.label)
        .join(', ');
    }
    case 'file':
      return (Array.isArray(value) ? (value as { name: string }[]) : [])
        .map((f) => f.name)
        .join(', ');
    case 'money':
      return typeof value === 'number'
        ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
        : String(value);
    case 'date-range': {
      const r = value as { start?: string; end?: string };
      return r.start && r.end ? `${r.start} – ${r.end}` : '';
    }
    case 'repeat':
      return '';
    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}
