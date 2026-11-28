import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  ButtonGroupComponent,
  CheckboxComponent,
  CONTENT_LANGUAGES,
  ContentLangState,
  EmptyStateComponent,
  fallbackChain,
  I18nInputComponent,
  type I18nMap,
  IconComponent,
  InputComponent,
  langFieldLabel,
  MEDIA,
  mediaQuery,
  MetaLineComponent,
  MoveButtonsComponent,
  registerUiKitTexts,
  RowMenuComponent,
  type RowMenuItem,
  type RowMenuSection,
  scrollBehavior,
  ScrollFadeDirective,
  SelectFieldComponent,
  type SelectOption,
  setI18n,
  SheetBodyDirective,
  SideSheetComponent,
  UI_KIT_INTL,
  type UiKitTextKey,
  UiKitTranslatePipe,
  type UiKitFormEditorTextKey,
  TabsComponent,
  type TabItem,
} from '@stupa-makers/ui-kit';
import type {
  ComputedFormat,
  FieldHints,
  FieldType,
  FormEditorPage,
  FormFieldDef,
  SignatureRow,
} from './form-editor.types';
import {
  COMPUTED_FORMATS,
  FIELD_TYPES,
  PROMOTE_TARGETS,
  type QuestionGroup,
  type QuestionPos,
  blankField,
  blankOption,
  duplicateKeys,
  fundingProblem,
  participantsProblem,
  validateFormField,
} from './form-field.util';
import { type RuleDraft, menuTarget, movedTo, resolveI18n, ruleProblem, withoutKey } from './form-editor.util';
import { UI_KIT_FORM_EDITOR_TEXTS } from './form-editor.texts';

/**
 * Visible order of the question types in the "add question" menu. `section` is **not** a
 * selectable type. Group containers model the sections, and the marker stays the
 * serialization primitive.
 */
const TYPE_MENU: readonly FieldType[] = FIELD_TYPES.filter((t) => t !== 'section');

/** The height of the type menu (nine rows of two types), for the side it opens on. */
const TYPE_MENU_HEIGHT = 9 * 36 + 16;
/** The width in px of the type menu (27.5rem): it opens to the left of the + of the section. */
const TYPE_MENU_WIDTH = 440;

/** Stable address of a question: group index and question index inside the group. */
type QPos = QuestionPos;

/** A setting of a field that is on while it is not stored as `false` (app spec 003004). */
type DefaultOnKey = 'capAtCost';

/** The hint texts of a `positions` field, in the order of the panel (app spec 003010). */
const POSITION_HINTS: readonly { readonly key: keyof FieldHints; readonly label: UiKitTextKey }[] = [
  { key: 'below', label: 'admin.form.hint.below' },
  { key: 'placeholderValue', label: 'admin.form.hint.placeholderValue' },
  { key: 'placeholderLabel', label: 'admin.form.hint.placeholderLabel' },
  { key: 'placeholderDuplicate', label: 'admin.form.hint.placeholderDuplicate' },
  { key: 'useNoOffers', label: 'admin.form.hint.useNoOffers' },
  { key: 'noOffers', label: 'admin.form.hint.noOffers' },
  { key: 'noFileTitle', label: 'admin.form.hint.noFileTitle' },
  { key: 'noFileBody', label: 'admin.form.hint.noFileBody' },
];

/** The tabs of the editor and their labels, in their order. */
const PAGE_TABS: readonly { readonly id: FormEditorPage; readonly label: UiKitFormEditorTextKey }[] = [
  { id: 'questions', label: 'admin.form.questions' },
  { id: 'form', label: 'admin.form.formCard' },
  { id: 'rules', label: 'admin.forms.rules.title' },
  { id: 'versions', label: 'admin.form.versions' },
];

/**
 * The body of the form editor of STUPA-Workflow, built around explicit **question groups**: a
 * copy of the columns of `app-form-editor` (002278). The app keeps the page: the load, the save,
 * the header and the versions, which it projects as `[formVersions]` at the end of the side
 * column. The parent provides `ContentLangState`.
 *
 * Each group is one wizard step. The group title is the step heading. On save the groups
 * serialize back into the flat `fields[]` list, with a leading `section` marker per group.
 *
 * The view has four tabs (app spec 003132):
 *
 * - "Fragen": every group one below the other. The head of a group ("Abschnitt n · Titel")
 *   holds + (the menu of every question type, a bottom sheet on a phone) and ⋮ (move or
 *   delete the group). Under the group title follows one card per question with type, key,
 *   required, the labels and help texts, the options of its type (choice options, cost
 *   positions, the expression of a computed field) and the "Erweiterte Optionen" (PII,
 *   metric, validation, visibleIf). The selected question has an accent outline.
 * - "Formular": the form settings (title, description, budget, comparison offers).
 * - "Regeln": the rules across fields.
 * - "Versionen": the versions that the app projects.
 *
 * The actions of a card head stop their click, because a click that reaches the card would select
 * the old place again after a move. The menu of the question types sits outside the scrolling
 * columns, so their edges and fades do not cut it.
 */
@Component({
  selector: 'app-form-editor-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SheetBodyDirective,
    TabsComponent,
    MetaLineComponent,
    MoveButtonsComponent,
    I18nInputComponent,
    EmptyStateComponent,
    FormsModule,
    UiKitTranslatePipe,
    ButtonComponent,
    ButtonGroupComponent,
    CheckboxComponent,
    SelectFieldComponent,
    IconComponent,
    InputComponent,
    RowMenuComponent,
    SideSheetComponent,
    ScrollFadeDirective,
  ],
  templateUrl: './form-editor-view.component.html',
  styleUrl: './form-editor-view.component.scss',
})
export class FormEditorViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_FORM_EDITOR_TEXTS);

  /** `n` placeholders for the fields of a skeleton card. */
  protected skeletonFields(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  protected readonly contentLang = inject(ContentLangState);
  private readonly languages = inject(CONTENT_LANGUAGES);
  private readonly i18n = inject(UI_KIT_INTL);
  protected readonly langFieldLabel = langFieldLabel;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Phone: the type menu is a bottom sheet. */
  protected readonly phone = mediaQuery(MEDIA.phone);

  /** The first read runs: the skeleton of the three columns shows. */
  readonly loading = input(false);
  /** The preview of the form instead of the editor. */
  readonly preview = input(false);
  /** "Mit Budget" shows only while the app has its budget on (app spec 000761). */
  readonly budgetOn = input(true);

  /** Editor state: questions grouped into titled containers, one per wizard step. */
  readonly groups = model<readonly QuestionGroup[]>([]);
  readonly title = model<I18nMap>({ de: '', en: '' });
  readonly description = model<I18nMap>({ de: '', en: '' });
  /** "With budget": the application may select a pot (application_type.has_budget). */
  readonly hasBudget = model(false);
  /** The signature rows of the Antrag PDF, in order; an empty list gives none (app specs 003005, 003009). */
  readonly signatureRows = model<readonly SignatureRow[]>([]);
  /** "Anhang Pflicht": an Antrag of this type needs a file (app spec 001732). */
  readonly attachmentRequired = model(false);
  /** Comparison-offers rule: required + minimum count. */
  readonly cmpRequired = model(false);
  readonly cmpMinCount = model(2);
  /** The rules across fields (app spec 001670); the logic stays text while it is typed. */
  readonly rules = model<readonly RuleDraft[]>([]);
  /** The selected question: its card has an outline. */
  readonly selected = model<QPos | null>(null);
  /**
   * The open tab (app spec 003132): all groups with their questions, the settings of the form,
   * its rules or its versions.
   */
  readonly page = model<FormEditorPage>('questions');

  /** The tabs under the title of the page. */
  protected readonly pageTabs = computed<readonly TabItem[]>(() => {
    this.i18n.lang();
    return PAGE_TABS.map((t) => ({ id: t.id, label: this.i18n.translate(t.label) }));
  });
  /** The questions tab is open. */
  protected readonly onQuestions = computed(() => this.page() === 'questions');

  protected readonly severityOptions: SelectOption[] = (['block', 'warn'] as const).map((v) => ({
    value: v,
    label: this.i18n.translate(`admin.forms.rules.${v}`),
  }));
  /** The problem of each rule as a text key, or null. */
  protected readonly ruleErrors = computed(() => this.rules().map(ruleProblem));
  /**
   * Which cards show their advanced options (⋯). The key is "gi:qi". A change of the
   * structure (move, drop, delete, duplicate) re-keys it, see `restructure`.
   */
  protected readonly expanded = signal<Record<string, boolean>>({});
  /** Open "add question" type menu per group: the group index, or null for none. */
  protected readonly typeMenuGroup = signal<number | null>(null);
  /** Where the type menu opens: under its button, or above it near the window bottom. */
  protected readonly menuPos = signal<{ left: number; top: number | null; bottom: number | null }>(
    { left: 0, top: 0, bottom: null },
  );
  /**
   * Raw edit strings of the JsonLogic fields: "gi:qi" maps to {visibleIf, compute}. A
   * change of the structure re-keys it, the same as `expanded`.
   */
  private readonly rawLogic = signal<Record<string, { visibleIf?: string; compute?: string }>>({});
  /** The "Frage hinzufügen" button that opened the type menu. Escape gives it the focus. */
  private menuOpener: HTMLElement | null = null;
  /** Closes the type menu on a scroll. Only one is registered at a time. */
  private readonly closeOnScroll = (): void => this.closeTypeMenu(false);

  protected readonly typeMenu = TYPE_MENU;
  protected readonly fieldTypeOptions: SelectOption[] = TYPE_MENU.map((t) => ({
    value: t,
    label: this.i18n.translate(`admin.form.type.${t}` as UiKitTextKey),
  }));
  /** Valid promote targets as a dropdown. It lists the server-evaluated values only. */
  protected readonly promoteTargetOptions: SelectOption[] = PROMOTE_TARGETS.map((v) => ({
    value: v,
    label: this.i18n.translate(`admin.form.metric.${v}` as UiKitTextKey),
  }));

  /** The display formats of a computed field (app spec 002963). */
  protected readonly formatOptions: SelectOption[] = COMPUTED_FORMATS.map((v) => ({
    value: v,
    label: this.i18n.translate(`admin.form.format.${v}` as UiKitTextKey),
  }));

  /** Flat view of the question fields, without markers. The key and validation checks use it. */
  private readonly flatQuestions = computed(() => this.groups().flatMap((g) => g.fields));

  protected readonly duplicates = computed(() => duplicateKeys(this.flatQuestions()));
  /** The form-level problem of the requested funding field, or null. */
  protected readonly fundingIssue = computed(
    () => fundingProblem(this.flatQuestions()) ?? participantsProblem(this.flatQuestions()),
  );
  /** Validation errors per question, indexed by "gi:qi". */
  protected readonly fieldErrors = computed(
    (): Readonly<Record<string, readonly string[]>> =>
      Object.fromEntries(
        this.groups().flatMap((g, gi) =>
          g.fields.map((f, qi) => [`${gi}:${qi}`, validateFormField(f).errors]),
        ),
      ),
  );

  protected typeLabel(type: FieldType): string {
    return this.i18n.translate(`admin.form.type.${type}` as UiKitTextKey);
  }

  protected resolved(map: I18nMap | undefined): string {
    return map ? resolveI18n(map, this.languages.current()) : '';
  }

  /**
   * The help text of an info field in the preview, or '' when it has none or when it only
   * repeats the label. The wizard shows such an info text once: no bold label over the
   * same text (the preview follows the same rule).
   */
  protected infoHelp(field: FormFieldDef): string {
    const help = this.resolved(field.help).trim();
    return help && help !== this.resolved(field.label).trim() ? help : '';
  }

  /** The description that a reader of the content language gets while its field is empty. */
  protected readonly descFallback = computed(() => {
    const map = this.description();
    return fallbackChain(this.contentLang.lang()).slice(1).map((code) => map[code]).find(Boolean) ?? '';
  });

  protected setDescription(lang: string, value: string): void {
    this.description.update((d) => setI18n(d, lang, value));
  }

  /** Replace one group and poke the signal. */
  private patchGroup(gi: number, fn: (g: QuestionGroup) => QuestionGroup): void {
    this.groups.update((list) => list.map((g, i) => (i === gi ? fn(g) : g)));
  }

  private patchQuestion(pos: QPos, fn: (f: FormFieldDef) => FormFieldDef): void {
    this.patchGroup(pos.gi, (g) => ({
      ...g,
      fields: g.fields.map((f, i) => (i === pos.qi ? fn(f) : f)),
    }));
  }

  protected setGroupTitle(gi: number, title: I18nMap): void {
    this.patchGroup(gi, (g) => ({ ...g, title }));
  }

  protected addGroup(): void {
    this.groups.update((list) => [...list, { title: { de: '', en: '' }, fields: [] }]);
    this.page.set('questions');
    this.selected.set(null);
  }

  protected removeGroup(gi: number): void {
    this.restructure(() => this.groups.update((list) => list.filter((_, i) => i !== gi)));
    const sel = this.selected();
    if (sel?.gi === gi) this.selected.set(null);
    else if (sel && sel.gi > gi) this.selected.set({ gi: sel.gi - 1, qi: sel.qi });
  }

  protected moveGroup(gi: number, dir: -1 | 1): void {
    this.reorderGroup(gi, gi + dir);
  }

  private reorderGroup(from: number, to: number): void {
    const len = this.groups().length;
    if (to < 0 || to >= len || from === to) return;
    this.restructure(() =>
      this.groups.update((list) => movedTo(list, from, to)),
    );
    const place = (i: number): number => {
      if (i === from) return to;
      if (from < to && i > from && i <= to) return i - 1;
      if (from > to && i >= to && i < from) return i + 1;
      return i;
    };
    const sel = this.selected();
    if (sel) this.selected.set({ gi: place(sel.gi), qi: sel.qi });
  }

  /** Open a tab of the tab bar. */
  protected setPage(id: string | null): void {
    const tab = PAGE_TABS.find((t) => t.id === id);
    if (tab) this.page.set(tab.id);
  }

  /**
   * Select a question: open the questions tab and outline its card. `scroll` brings the card
   * into view (after a move or a new question); a click into the card itself does not move the
   * page.
   */
  protected selectQuestion(pos: QPos, scroll = true): void {
    this.page.set('questions');
    this.selected.set(pos);
    if (scroll) this.scrollToCard(pos);
  }

  /**
   * Open or close the type menu of a group at its button. The menu opens below the
   * button, or above it when the space below is too small for it.
   *
   * On a phone the menu is a bottom sheet, so a scroll inside the sheet must not close it.
   * Elsewhere a scroll closes the menu before it can drift away from its button.
   */
  protected toggleTypeMenu(gi: number, event: Event): void {
    if (this.typeMenuGroup() === gi) {
      this.closeTypeMenu(false);
      return;
    }
    const button = (event.currentTarget as HTMLElement | null) ?? null;
    this.menuOpener = button;
    const rect = button?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      const left = Math.max(8, rect.right - TYPE_MENU_WIDTH);
      this.menuPos.set(
        below < TYPE_MENU_HEIGHT
          ? { left, top: null, bottom: window.innerHeight - rect.top + 4 }
          : { left, top: rect.bottom + 4, bottom: null },
      );
    }
    this.typeMenuGroup.set(gi);
    if (this.phone()) return;
    window.removeEventListener('scroll', this.closeOnScroll, { capture: true });
    window.addEventListener('scroll', this.closeOnScroll, { capture: true, once: true });
    setTimeout(() => this.menuItems()[0]?.focus({ preventScroll: true }));
  }

  /** Close the type menu. With `refocus`, the button that opened it gets the focus again. */
  protected closeTypeMenu(refocus: boolean): void {
    if (this.typeMenuGroup() === null) return;
    this.typeMenuGroup.set(null);
    window.removeEventListener('scroll', this.closeOnScroll, { capture: true });
    if (refocus) {
      const opener = this.menuOpener;
      (opener?.querySelector<HTMLElement>('button') ?? opener)?.focus({ preventScroll: true });
    }
  }

  /** The type buttons of the open menu (wide and tablet only). */
  private menuItems(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.fe__menu .fe__menu-item'),
    );
  }

  /**
   * Keyboard in the type menu: the arrow keys, Home and End move between the types. Tab
   * closes the menu and gives the focus back to its button.
   */
  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.menuItems();
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Tab') {
      event.preventDefault();
      this.closeTypeMenu(true);
      return;
    }
    const next = menuTarget(event.key, at, items.length);
    if (next === null) return;
    event.preventDefault();
    items[next]?.focus({ preventScroll: true });
  }

  /** Escape closes the open type menu, wherever the focus is, and focuses its button. */
  @HostListener('document:keydown.escape')
  protected onDocumentEscape(): void {
    if (this.typeMenuGroup() === null || this.phone()) return;
    this.closeTypeMenu(true);
  }

  /** A press outside the type menu and its buttons closes the menu. */
  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.typeMenuGroup() === null || this.phone()) return;
    const target = event.target as Element | null;
    if (target?.closest('.fe__menu, .fe__addBtn')) return;
    this.closeTypeMenu(false);
  }

  /** A click or the focus in a card selects its question, without a scroll. */
  protected focusCard(pos: QPos): void {
    if (!this.isSelected(pos.gi, pos.qi)) this.selectQuestion(pos, false);
  }

  protected isSelected(gi: number, qi: number): boolean {
    const sel = this.selected();
    return !!sel && sel.gi === gi && sel.qi === qi;
  }

  /** Scroll the card of a question into view once it is rendered. */
  private scrollToCard(pos: QPos): void {
    setTimeout(() => {
      const card = this.host.nativeElement.querySelector<HTMLElement>(
        `[data-q="${pos.gi}:${pos.qi}"]`,
      );
      card?.scrollIntoView?.({ block: 'nearest', behavior: scrollBehavior() });
    });
  }

  /** An action of the ⋮ menu of a group. */
  protected onGroupMenu(gi: number, item: RowMenuItem): void {
    if (item.id === 'up') this.moveGroup(gi, -1);
    else if (item.id === 'down') this.moveGroup(gi, 1);
    else if (item.id === 'delete') this.removeGroup(gi);
  }

  /** The ⋮ menu of a group: move it up or down (not past an edge) and delete it. */
  protected groupMenu(gi: number): RowMenuSection[] {
    const last = this.groups().length - 1;
    const up: RowMenuItem = {
      id: 'up',
      label: this.i18n.translate('admin.form.moveGroupUp'),
      icon: 'up',
    };
    const down: RowMenuItem = {
      id: 'down',
      label: this.i18n.translate('admin.form.moveGroupDown'),
      icon: 'down',
    };
    const move = [...(gi > 0 ? [up] : []), ...(gi < last ? [down] : [])];
    return [
      { items: move },
      {
        items: [
          { id: 'delete', label: this.i18n.translate('admin.form.deleteGroup'), icon: 'trash', danger: true },
        ],
      },
    ];
  }

  /** The heading of a group on its card: "Abschnitt 2 · Kosten". */
  protected groupHeading(group: QuestionGroup, gi: number): string {
    const step = this.i18n.translate('admin.form.groupStep', { n: gi + 1 });
    const title = this.resolved(group.title);
    return title ? `${step} · ${title}` : step;
  }

  protected addQuestion(gi: number, type: FieldType): void {
    this.patchGroup(gi, (g) => ({ ...g, fields: [...g.fields, blankField(type, '')] }));
    this.closeTypeMenu(false);
    const qi = (this.groups()[gi]?.fields.length ?? 1) - 1;
    this.selectQuestion({ gi, qi });
  }

  protected removeQuestion(pos: QPos): void {
    this.restructure(() =>
      this.patchGroup(pos.gi, (g) => ({
        ...g,
        fields: g.fields.filter((_, i) => i !== pos.qi),
      })),
    );
    const sel = this.selected();
    if (sel?.gi !== pos.gi) return;
    if (sel.qi === pos.qi) this.selected.set(null);
    else if (sel.qi > pos.qi) this.selected.set({ gi: sel.gi, qi: sel.qi - 1 });
  }

  protected duplicateQuestion(pos: QPos): void {
    this.restructure(() =>
      this.patchGroup(pos.gi, (g) => {
        const clone: FormFieldDef = structuredClone(g.fields[pos.qi]);
        const copy: FormFieldDef = { ...clone, key: clone.key ? `${clone.key}_copy` : '' };
        return {
          ...g,
          fields: [...g.fields.slice(0, pos.qi + 1), copy, ...g.fields.slice(pos.qi + 1)],
        };
      }),
    );
    this.selectQuestion({ gi: pos.gi, qi: pos.qi + 1 });
  }

  /** Move a question inside its group. At an edge it moves into the neighboring group. */
  protected moveQuestion(pos: QPos, dir: -1 | 1): void {
    const groups = this.groups();
    const group = groups[pos.gi];
    if (!group) return;
    const target = pos.qi + dir;
    if (target >= 0 && target < group.fields.length) {
      this.restructure(() =>
        this.patchGroup(pos.gi, (g) => ({ ...g, fields: movedTo(g.fields, pos.qi, target) })),
      );
      this.follow(pos, { gi: pos.gi, qi: target });
      return;
    }
    const ngi = pos.gi + dir;
    if (ngi < 0 || ngi >= groups.length) return;
    this.restructure(() =>
      this.groups.update((list) => {
        const moved = list[pos.gi].fields[pos.qi];
        return list.map((g, gi) => {
          if (gi === pos.gi) return { ...g, fields: g.fields.filter((_, qi) => qi !== pos.qi) };
          if (gi !== ngi) return { ...g, fields: [...g.fields] };
          return { ...g, fields: dir === -1 ? [...g.fields, moved] : [moved, ...g.fields] };
        });
      }),
    );
    this.follow(pos, { gi: ngi, qi: dir === -1 ? groups[ngi].fields.length : 0 });
  }

  /**
   * Run a change of the structure (a move, drop, delete or duplicate of questions or
   * groups) and re-key the per-question editor state ("gi:qi") to the new places.
   *
   * The change keeps the question objects, so each old key goes to the place where its
   * object is now. The state of a deleted question goes away. A copy starts without state.
   */
  private restructure(change: () => void): void {
    const before = this.groups();
    change();
    const now = new Map(
      this.groups().flatMap((g, gi) => g.fields.map((f, qi) => [f, `${gi}:${qi}`] as const)),
    );
    const placeOf = (key: string): string | undefined => {
      const [gi, qi] = key.split(':').map(Number);
      const field = before[gi]?.fields[qi];
      return field ? now.get(field) : undefined;
    };
    const rekey = <T>(map: Record<string, T>): Record<string, T> =>
      Object.fromEntries(
        Object.entries(map).flatMap(([key, value]) => {
          const to = placeOf(key);
          return to !== undefined ? [[to, value] as const] : [];
        }),
      );
    this.expanded.update(rekey);
    this.rawLogic.update(rekey);
  }

  /** The selection follows a moved question to its new place. */
  private follow(from: QPos, to: QPos): void {
    if (this.isSelected(from.gi, from.qi)) this.selectQuestion(to);
  }

  protected onTypeChange(pos: QPos, type: FieldType): void {
    this.patchQuestion(pos, (f) => this.adaptToType(f, type));
  }

  private adaptToType(field: FormFieldDef, type: FieldType): FormFieldDef {
    const needsOption = (type === 'select' || type === 'multiselect') && !field.options?.length;
    const next: FormFieldDef = {
      ...field,
      type,
      ...(needsOption ? { options: [blankOption()] } : {}),
      ...(type === 'computed' && !field.compute ? { compute: { var: '' } } : {}),
    };
    if (type === 'number' || type === 'currency') return next;
    return withoutKey(withoutKey(next, 'isPromoted'), 'promoteTarget');
  }

  /** Metric toggle: prefill a valid promote target when the user turns it on. */
  protected onPromotedToggle(pos: QPos, checked: boolean): void {
    this.patchQuestion(pos, (f) => {
      const next = { ...f, isPromoted: checked };
      if (!checked) return withoutKey(next, 'promoteTarget');
      return { ...next, promoteTarget: next.promoteTarget || PROMOTE_TARGETS[0] };
    });
  }

  /** A computed field that is the amount of the Antrag (app spec 002843). */
  protected isAmount(field: FormFieldDef): boolean {
    return !!field.isPromoted && field.promoteTarget === 'amount';
  }

  /** Amount switch of a computed field: on sets the amount as its target, off removes both. */
  protected onAmountToggle(pos: QPos, checked: boolean): void {
    this.patchQuestion(pos, (f) =>
      checked
        ? { ...f, isPromoted: true, promoteTarget: 'amount' }
        : withoutKey(withoutKey(f, 'isPromoted'), 'promoteTarget'),
    );
  }

  /** Format select of a computed field: `number` is the default and removes the key. */
  protected setFormat(pos: QPos, format: ComputedFormat): void {
    this.patchQuestion(pos, (f) =>
      format === 'number' ? withoutKey(f, 'format') : { ...f, format },
    );
  }

  protected addOption(pos: QPos): void {
    this.patchQuestion(pos, (f) => ({ ...f, options: [...(f.options ?? []), blankOption()] }));
  }

  /** Set fields of one question; the template binds its edits here instead of writing in place. */
  protected setQuestion(pos: QPos, patch: Partial<FormFieldDef>): void {
    this.patchQuestion(pos, (f) => ({ ...f, ...patch }));
  }

  /** Set the label of one option of a question. */
  protected setOptionLabel(pos: QPos, oi: number, label: I18nMap): void {
    this.patchQuestion(pos, (f) => ({
      ...f,
      options: (f.options ?? []).map((o, k) => (k === oi ? { ...o, label } : o)),
    }));
  }

  protected removeOption(pos: QPos, oi: number): void {
    this.patchQuestion(pos, (f) => ({
      ...f,
      options: (f.options ?? []).filter((_, k) => k !== oi),
    }));
  }

  /** Poke the signal so the computed values, such as the validation, recompute. */
  protected touch(): void {
    this.groups.update((list) => [...list]);
  }

  protected toggleExpanded(pos: QPos): void {
    const k = `${pos.gi}:${pos.qi}`;
    this.expanded.update((m) => ({ ...m, [k]: !m[k] }));
  }

  protected isExpanded(pos: QPos): boolean {
    return !!this.expanded()[`${pos.gi}:${pos.qi}`];
  }

  protected errorsFor(gi: number, qi: number): readonly string[] {
    return this.fieldErrors()[`${gi}:${qi}`] ?? [];
  }

  protected isChoice(type: FieldType): boolean {
    return type === 'select' || type === 'multiselect';
  }

  protected isPositions(type: FieldType): boolean {
    return type === 'positions';
  }

  /** Numeric types: they accept min and max, and they can be promoted. */
  protected isNumeric(type: FieldType): boolean {
    return type === 'number' || type === 'currency';
  }

  /** Text types: the length and pattern validation applies. */
  protected isText(type: FieldType): boolean {
    return type === 'text' || type === 'textarea';
  }

  protected setVal(
    pos: QPos,
    key: 'min' | 'max' | 'minLen' | 'maxLen' | 'pattern' | 'minOffers' | 'minPositions',
    value: string,
  ): void {
    const numeric = key !== 'pattern';
    this.patchQuestion(pos, (f) => {
      const current = f.validation ?? {};
      const validation =
        value === ''
          ? withoutKey(current, key)
          : { ...current, [key]: numeric ? Number(value) : value };
      return { ...f, validation: validation as FormFieldDef['validation'] };
    });
  }

  /** Opt-out of comparison offers. Allowed is the default, so only `false` is stored. */
  protected setAllowNoOffers(pos: QPos, allowed: boolean): void {
    this.patchQuestion(pos, (f) => {
      const current = f.validation ?? {};
      const validation = allowed
        ? withoutKey(current, 'allowNoOffers')
        : { ...current, allowNoOffers: false };
      return { ...f, validation: validation as FormFieldDef['validation'] };
    });
  }

  /** Change one signature row (app spec 003005). */
  protected setSignatureRow(index: number, patch: Partial<SignatureRow>): void {
    this.signatureRows.update((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  protected addSignatureRow(): void {
    this.signatureRows.update((rows) => [...rows, { label: '', signer: '' }]);
  }

  protected removeSignatureRow(index: number): void {
    this.signatureRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  /** Move a signature row one place up (-1) or down (1). */
  protected moveSignatureRow(index: number, by: -1 | 1): void {
    this.signatureRows.update((rows) => {
      const to = index + by;
      if (to < 0 || to >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  /** The hint texts of a `positions` field (app spec 003010). */
  protected readonly positionHints = POSITION_HINTS;

  /**
   * Set one hint text of a `positions` field (app spec 003010). A text without any language
   * goes, and so do the hints without any text, so an empty hint stays unset.
   */
  protected setHint(pos: QPos, key: keyof FieldHints, text: Record<string, string>): void {
    this.patchQuestion(pos, (f) => {
      const current = f.validation ?? {};
      const filled = Object.values(text).some((t) => t.trim() !== '');
      const hints = filled ? { ...current.hints, [key]: text } : withoutKey({ ...current.hints }, key);
      const validation = Object.keys(hints).length > 0 ? { ...current, hints } : withoutKey(current, 'hints');
      return { ...f, validation: validation as FormFieldDef['validation'] };
    });
  }

  /**
   * A switch that is on by default (app spec 003004). Only `false` is stored, so a form
   * without the setting keeps the default.
   */
  protected setDefaultOn(pos: QPos, key: DefaultOnKey, on: boolean): void {
    this.patchQuestion(pos, (f) => {
      const current = f.validation ?? {};
      const validation = on ? withoutKey(current, key) : { ...current, [key]: false };
      return { ...f, validation: validation as FormFieldDef['validation'] };
    });
  }

  protected onLogicInput(pos: QPos, kind: 'visibleIf' | 'compute', raw: string): void {
    const k = `${pos.gi}:${pos.qi}`;
    this.rawLogic.update((m) => ({ ...m, [k]: { ...m[k], [kind]: raw } }));
    const trimmed = raw.trim();
    this.patchQuestion(pos, (f) => {
      if (trimmed === '') return withoutKey(f, kind);
      try {
        return { ...f, [kind]: JSON.parse(trimmed) as Record<string, unknown> };
      } catch {
        return f;
      }
    });
  }

  protected logicRaw(
    gi: number,
    qi: number,
    kind: 'visibleIf' | 'compute',
    current?: Record<string, unknown>,
  ): string {
    const raw = this.rawLogic()[`${gi}:${qi}`]?.[kind];
    if (raw !== undefined) return raw;
    return current ? JSON.stringify(current) : '';
  }

  /** The field is a number field, and another number field already holds the participants. */
  protected participantsTaken(field: FormFieldDef): boolean {
    return this.flatQuestions().some(
      (f) => f !== field && f.type === 'number' && f.validation?.participants === true,
    );
  }

  /** The switch "Teilnehmerzahl" of a number field (app spec 001631). */
  protected setParticipants(pos: QPos, on: boolean): void {
    this.patchQuestion(pos, (f) => {
      const current = f.validation ?? {};
      const validation = on ? { ...current, participants: true } : withoutKey(current, 'participants');
      return { ...f, validation: validation as FormFieldDef['validation'] };
    });
  }

  /** The root "Wurzel" of a cost-centre picker, a path key such as QSM (app spec 001680). */
  protected setRootPath(pos: QPos, value: string): void {
    this.patchQuestion(pos, (f) => {
      const current = f.validation ?? {};
      const validation = value.trim() ? { ...current, rootPath: value } : withoutKey(current, 'rootPath');
      return { ...f, validation: validation as FormFieldDef['validation'] };
    });
  }

  protected addRule(): void {
    this.rules.update((list) => [...list, { logic: '', message: { de: '', en: '' }, severity: 'block' }]);
  }

  protected removeRule(index: number): void {
    this.rules.update((list) => list.filter((_, i) => i !== index));
  }

  protected moveRule(index: number, dir: -1 | 1): void {
    const to = index + dir;
    this.rules.update((list) => (to < 0 || to >= list.length ? list : movedTo(list, index, to)));
  }

  protected setRule(index: number, patch: Partial<RuleDraft>): void {
    this.rules.update((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
}
