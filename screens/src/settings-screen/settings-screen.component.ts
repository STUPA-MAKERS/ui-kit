import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FabComponent,
  IconComponent,
  NoteComponent,
  PageHeaderComponent,
  EmptyStateComponent,
  SectionComponent,
  SkeletonComponent,
  SwitchComponent,
  ToastService,
  UI_KIT_INTL,
  type Action,
  type IconName,
  type NoteKind,
  type RouteLink,
  type ScreenHead,
} from '@stupa-makers/ui-kit';

/** One row of a settings group (000631): a switch, a link, a value or an action. */
export interface SettingsRow {
  readonly key: string;
  readonly label: string;
  /** The line under the label (the hint of a switch). */
  readonly meta?: string;
  readonly control: 'switch' | 'link' | 'value' | 'action';
  /** A switch: on or off. A value row: the text at the end. */
  readonly value?: boolean | string;
  readonly link?: RouteLink;
  readonly action?: Action;
  readonly disabled?: boolean;
}

/** A row group of the settings screen; without a label it stands without a heading. */
export interface SettingsGroup {
  readonly key: string;
  readonly label?: string;
  readonly rows: readonly SettingsRow[];
  /** The group shows in every state of the screen, and its slot carries its own load state
   * (gesperrte Absender of Hilfe & Tickets). */
  readonly always?: boolean;
}

/** What the screen shows: the skeleton, the groups, the missing right, or a load error. */
export type SettingsState =
  | { readonly state: 'loading'; readonly skeleton?: SettingsSkeleton }
  | { readonly state: 'ready' }
  | { readonly state: 'forbidden'; readonly message: string }
  | { readonly state: 'error'; readonly message: string; readonly retry: () => void };

/** Loading as a plain skeleton instead of the groups: grey lines or grey rows. */
export interface SettingsSkeleton {
  readonly variant: 'lines' | 'rows';
  readonly count: number;
}

/** A note under the head, for example a failed save of a page that saves at once. */
export interface SettingsNotice {
  readonly kind: NoteKind;
  readonly text: string;
}

/** What a ready screen without groups shows. */
export interface SettingsEmpty {
  readonly icon: IconName;
  readonly heading: string;
}

/** A page that saves on Speichern: the changes are a draft until then. */
export interface SettingsSave {
  readonly dirty: boolean;
  readonly busy?: boolean;
  /** The draft is not valid: the FAB stays but cannot save (a field shows its error). */
  readonly disabled?: boolean;
}

/** A custom body for one group, built with kit components (Wiki-Adresse, gesperrte Absender). */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenGroup]', standalone: true })
export class ScreenGroupDirective {
  readonly key = input.required<string>({ alias: 'screenGroup' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The loading body of one slot group: the slot itself only shows once the data is there. */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenSkeleton]', standalone: true })
export class ScreenSkeletonDirective {
  readonly key = input.required<string>({ alias: 'screenSkeleton' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * The settings screen (002244): a copy of the settings pages of STUPA-Workflow (Benachrichtigungen,
 * Funktionen, Hilfe & Tickets). The title, then one row group per group; a switch row toggles on
 * a press of the whole row. Without `save`, each change goes out at once; with `save`, the head
 * shows Verwerfen and a FAB saves while there are changes.
 */
@Component({
  selector: 'app-settings-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    ButtonComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    FabComponent,
    IconComponent,
    NoteComponent,
    PageHeaderComponent,
    SectionComponent,
    SkeletonComponent,
    SwitchComponent,
  ],
  templateUrl: './settings-screen.component.html',
  styleUrl: './settings-screen.component.scss',
})
export class SettingsScreenComponent {
  readonly head = input.required<ScreenHead>();
  readonly groups = input<readonly SettingsGroup[]>([]);
  readonly state = input<SettingsState>({ state: 'ready' });
  /** `null`: each change goes out at once. */
  readonly save = input<SettingsSave | null>(null);
  /** A note under the head, in every state. */
  readonly notice = input<SettingsNotice | null>(null);
  /** Shown when the screen is ready and has no groups; `null` shows nothing. */
  readonly empty = input<SettingsEmpty | null>(null);

  readonly changed = output<{ readonly key: string; readonly value: boolean }>({ alias: 'change' });
  readonly acted = output<{ readonly key: string }>({ alias: 'action' });
  readonly saved = output<void>({ alias: 'save' });
  readonly discarded = output<void>({ alias: 'discard' });

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly toasts = inject(ToastService);
  private readonly slots = contentChildren(ScreenGroupDirective);
  private readonly skeletons = contentChildren(ScreenSkeletonDirective);

  protected readonly ready = computed(() => this.state().state === 'ready');
  protected readonly dirty = computed(() => this.ready() && !!this.save()?.dirty);
  /** The groups that follow the state of the screen, and those that show in every state. */
  protected readonly stateGroups = computed(() => this.groups().filter((g) => !g.always));
  protected readonly alwaysGroups = computed(() => this.groups().filter((g) => g.always));
  /** Loading as a plain skeleton, as `app-load-state` of the app draws it without a template. */
  protected readonly skeleton = computed(() => {
    const s = this.state();
    return s.state === 'loading' ? (s.skeleton ?? null) : null;
  });
  protected readonly forbidden = computed(() => {
    const s = this.state();
    return s.state === 'forbidden' ? s.message : null;
  });
  /** The action that waits for its confirm question. */
  protected readonly asking = signal<Action | null>(null);
  /** The id of the error toast while it shows. */
  private readonly errorToast = signal<number | null>(null);

  constructor() {
    this.toastOnError();
  }

  protected slotOf(key: string): TemplateRef<unknown> | null {
    return this.slots().find((s) => s.key() === key)?.template ?? null;
  }

  protected skeletonOf(key: string): TemplateRef<unknown> | null {
    return this.skeletons().find((s) => s.key() === key)?.template ?? null;
  }

  protected toggle(row: SettingsRow, value: boolean): void {
    this.changed.emit({ key: row.key, value });
  }

  protected run(row: SettingsRow): void {
    if (row.disabled || row.action?.disabled) return;
    if (row.action?.confirm) {
      this.asking.set(row.action);
      return;
    }
    this.acted.emit({ key: row.action?.key ?? row.key });
  }

  protected confirmed(): void {
    const action = this.asking();
    this.asking.set(null);
    if (action) this.acted.emit({ key: action.key });
  }

  protected cancelled(): void {
    this.asking.set(null);
  }

  protected onSave(): void {
    const save = this.save();
    if (save?.busy || save?.disabled) return;
    this.saved.emit();
  }

  /** A load error is a toast with Erneut versuchen, as `app-load-error` of the app shows it. */
  private toastOnError(): void {
    const hide = (): void => {
      const id = this.errorToast();
      if (id !== null) this.toasts.dismiss(id);
      this.errorToast.set(null);
    };
    effect(() => {
      const s = this.state();
      untracked(() => {
        if (s.state !== 'error') return hide();
        if (this.errorToast() !== null) return;
        this.errorToast.set(
          this.toasts.show({
            text: s.message,
            action: { key: 'retry', label: this.intl.translate('note.retry'), icon: 'reload' },
            kind: 'error',
            sticky: true,
            closed: (how) => {
              this.errorToast.set(null);
              if (how === 'action') s.retry();
            },
          }),
        );
      });
    });
    inject(DestroyRef).onDestroy(hide);
  }
}
