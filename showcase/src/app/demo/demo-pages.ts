import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CheckboxComponent,
  InputComponent,
  FactsComponent,
  PageHeaderComponent,
  SectionComponent,
  SwitchComponent,
  type Action,
  type FilterDef,
  type ListGroup,
  type ListRow,
  type LoadState,
  type ScreenHead,
  type ScreenTab,
  type SideSheetDef,
} from '@stupa-makers/ui-kit';
import {
  DetailScreenComponent,
  ListDetailScreenComponent,
  ScreenCommentsDirective,
  ScreenSheetDirective,
  ScreenTabDirective,
  FormScreenComponent,
  WizardScreenComponent,
  SettingsScreenComponent,
  PublicScreenComponent,
  ScreenBodyDirective,
  ScreenGroupDirective,
  type SettingsGroup,
  type SettingsState,
  type WizardDiscard,
  type WizardIntro,
  type WizardReview,
  type WizardStep,
  type FormValue,
  StatusScreenComponent,
  type StatusKind,
} from '@stupa-makers/ui-kit/screens';
import { FrameworkShellComponent } from '@stupa-makers/ui-kit/shell';

import { DEMO_APPLY, DEMO_FORM, DEMO_ROWS, demoFrame } from './demo-config';

/** The demo app: the framework shell with the config of `demoConfig()`. */
@Component({
  selector: 'sc-demo-frame',
  imports: [FrameworkShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-framework-shell (action)="onAction($event)" />`,
})
export class DemoFrame {
  protected onAction(key: string): void {
    if (key === 'signIn') demoFrame.set('rail');
    else console.info(`[showcase] action ${key}`);
  }
}

/** A start page from kit parts: the page header, a section with facts and one with controls. */
@Component({
  selector: 'sc-demo-start',
  imports: [
    PageHeaderComponent,
    SectionComponent,
    FactsComponent,
    CheckboxComponent,
    SwitchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <app-page-header
        title="Start"
        subtitle="Die Shell des Frameworks mit einer Demo-Konfiguration"
      />
      <app-section heading="Überblick" [level]="2">
        <dl appFacts [card]="true">
          <div>
            <dt>Offene Anträge</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Nächste Sitzung</dt>
            <dd>26.11.2026, 18:00</dd>
          </div>
          <div>
            <dt>Haushaltsjahr</dt>
            <dd>2026</dd>
          </div>
        </dl>
      </app-section>
      <app-section heading="Benachrichtigungen" [level]="2">
        <app-switch [checked]="true">E-Mail bei neuen Anträgen</app-switch>
        <app-switch>E-Mail bei Kommentaren</app-switch>
        <app-switch [checked]="true" [disabled]="true">Sitzungseinladungen (Pflicht)</app-switch>
        <app-switch [disabled]="true" hint="Nur für Mitglieder">Abstimmungen</app-switch>
        <app-checkbox [indeterminate]="true">Alle Gremien</app-checkbox>
        <app-checkbox>AStA</app-checkbox>
        <app-checkbox hint="Gilt für alle Fachschaften">Fachschaften</app-checkbox>
      </app-section>
    </div>
  `,
})
export class DemoStartPage {}

/** The list page: the list/detail screen of the kit with data only, no template or style. */
@Component({
  selector: 'sc-demo-list',
  imports: [ListDetailScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-list-detail-screen
      [head]="{ title: 'Anträge' }"
      [rows]="rows()"
      [search]="{ placeholder: 'Anträge durchsuchen' }"
      [filters]="filters"
      [actions]="actions"
      [selection]="selection"
      [none]="{ heading: 'Kein Antrag geöffnet', icon: 'file' }"
      (query)="query.set($event.search)"
      (action)="onAction($event.key, $event.ids)"
    />
  `,
})
export class DemoListPage {
  protected readonly query = signal('');
  protected readonly filters: readonly FilterDef[] = [
    {
      key: 'state',
      label: 'Status',
      kind: 'single',
      value: null,
      options: [
        { value: '', label: 'Alle' },
        { value: 'accent', label: 'In Prüfung' },
        { value: 'warn', label: 'Rückfrage' },
      ],
    },
  ];
  protected readonly actions: readonly Action[] = [
    { key: 'create', label: 'Antrag erfassen', kind: 'main', priority: 'fab' },
    { key: 'export', label: 'Exportieren', icon: 'download', priority: 'menu' },
  ];
  protected readonly selection = {
    actions: [
      { key: 'transition', label: 'Status ändern', icon: 'flow' },
      { key: 'message', label: 'Nachricht senden', icon: 'mail' },
    ],
  } as const;
  protected readonly rows = computed<LoadState<readonly ListGroup[]>>(() => {
    const q = this.query().trim().toLowerCase();
    const rows: readonly ListRow[] = DEMO_ROWS.filter(
      (r) => !q || r.title.toLowerCase().includes(q),
    ).map((r) => ({
      id: r.id,
      title: r.title,
      meta: [r.sub],
      status: { label: r.status, kind: r.kind },
      link: { commands: ['/demo/applications', r.id] },
    }));
    return rows.length
      ? { state: 'ready', data: [{ key: 'open', label: 'Offen', rows }] }
      : {
          state: 'empty',
          heading: 'Keine Anträge gefunden',
          icon: 'searchOff',
        };
  });

  protected onAction(key: string, ids?: readonly string[]): void {
    console.info(`[showcase] action ${key}`, ids ?? []);
  }
}

/** The detail: the detail screen of the kit with data and slots, no style of its own. */
@Component({
  selector: 'sc-demo-detail',
  imports: [
    DetailScreenComponent,
    ScreenTabDirective,
    ScreenSheetDirective,
    ScreenCommentsDirective,
    FactsComponent,
    SectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (row(); as r) {
      <app-detail-screen
        [head]="head()"
        [state]="{ state: 'ready', data: r }"
        [tabs]="tabs"
        [actions]="actions"
        [sheets]="sheets"
        [comments]="{ open: false, label: 'Kommentare' }"
        (action)="onAction($event.key)"
      >
        <ng-template screenTab="data">
          <app-section heading="Angaben" [level]="2">
            <dl appFacts>
              <div>
                <dt>Antragsteller</dt>
                <dd>{{ r.sub }}</dd>
              </div>
              <div>
                <dt>Betrag</dt>
                <dd class="num">{{ r.amount }}</dd>
              </div>
              <div>
                <dt>Eingegangen</dt>
                <dd>{{ r.date }}</dd>
              </div>
            </dl>
          </app-section>
        </ng-template>
        <ng-template screenTab="history">
          <app-section heading="Verlauf" [level]="2">
            <dl appFacts>
              <div>
                <dt>{{ r.date }}</dt>
                <dd>Eingereicht</dd>
              </div>
            </dl>
          </app-section>
        </ng-template>
        <ng-template screenSheet="votes"><p>Noch keine Abstimmung.</p></ng-template>
        <ng-template screenComments><p>Noch keine Kommentare.</p></ng-template>
      </app-detail-screen>
    }
  `,
})
export class DemoDetailPage {
  readonly id = input('');
  protected readonly row = computed(() => DEMO_ROWS.find((r) => r.id === this.id()));
  protected readonly head = computed<ScreenHead>(() => {
    const r = this.row();
    return r
      ? {
          title: r.title,
          kicker: `Antrag A-00${r.id}`,
          status: { label: r.status, kind: r.kind },
          meta: [{ label: r.sub, icon: 'users' }, { label: r.date }],
        }
      : { title: '' };
  });
  protected readonly tabs: readonly ScreenTab[] = [
    { key: 'data', label: 'Antrag' },
    { key: 'history', label: 'Verlauf' },
  ];
  protected readonly actions: readonly Action[] = [
    { key: 'edit', label: 'Bearbeiten', icon: 'edit', priority: 'head' },
    { key: 'pdf', label: 'PDF herunterladen', icon: 'download', priority: 'menu' },
    { key: 'archive', label: 'Archivieren', icon: 'archive', priority: 'menu' },
  ];
  protected readonly sheets: readonly SideSheetDef[] = [
    { key: 'votes', label: 'Abstimmungen', icon: 'vote', mark: 'new' },
  ];

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected onAction(key: string): void {
    if (key === 'edit') {
      void this.router.navigate(['edit'], { relativeTo: this.route });
      return;
    }
    console.info(`[showcase] detail action ${key}`);
  }
}

/**
 * "Antrag bearbeiten" in place of the detail, as in the app: the form screen in the detail
 * pane, the same title and no subtitle or note.
 */
@Component({
  selector: 'sc-demo-edit',
  imports: [FormScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-screen
      [head]="{ title: 'Antrag bearbeiten' }"
      [form]="form()"
      [value]="value()"
      [submit]="{ label: 'Speichern', busy: saving() }"
      (valueChange)="value.set($event)"
      (submit)="save($event)"
      (cancel)="close()"
    />
  `,
})
export class DemoEditPage {
  readonly id = input('');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly row = computed(() => DEMO_ROWS.find((r) => r.id === this.id()));
  protected readonly value = signal<FormValue>({});
  protected readonly saving = signal(false);
  protected readonly form = computed(() => DEMO_FORM(this.value()['payee'] === 'person'));

  constructor() {
    queueMicrotask(() => this.value.set({ title: this.row()?.title ?? '', count: 120 }));
  }

  protected save(_value: FormValue): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.close();
    }, 600);
  }

  protected close(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }
}

/**
 * A public page with the narrow text column, as the Erklärung zur Barrierefreiheit: the public
 * frame shows for everybody.
 */
@Component({
  selector: 'sc-demo-about',
  imports: [PublicScreenComponent, ScreenBodyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-screen [head]="{ title: 'Über die Demo' }" [state]="state()">
      <ng-template screenBody>
        <p>
          Eine öffentliche Seite: sie zeigt den öffentlichen Rahmen für alle, mit dem Kopf, den
          Knöpfen und dem Fuß der Shell.
        </p>
        <p>Die Spalte ist 45rem breit und steht in der Mitte.</p>
      </ng-template>
    </app-public-screen>
  `,
})
export class DemoAboutPage {
  protected readonly state = signal<LoadState<unknown>>({ state: 'loading' });
  constructor() {
    setTimeout(() => this.state.set({ state: 'ready', data: null }), 600);
  }
}

/** A public list with the wide column, as Öffentliche Protokolle: crumbs, lede and a pill. */
@Component({
  selector: 'sc-demo-public-list',
  imports: [PublicScreenComponent, ScreenBodyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-screen
      width="wide"
      [head]="{ title: 'Öffentliche Protokolle' }"
      lede="Finalisierte Protokolle der öffentlichen Gremien als öffentliche Fassung."
      [crumbs]="[
        { label: 'Start', link: { commands: ['/demo/start'] } },
        { label: 'Öffentliche Protokolle' },
      ]"
      [actions]="actions"
      [state]="state"
      [skeletonRows]="4"
      [emptyAction]="home"
    >
      <ng-template screenBody><p>Liste</p></ng-template>
    </app-public-screen>
  `,
})
export class DemoPublicListPage {
  protected readonly actions: readonly Action[] = [
    { key: 'decisions', label: 'Beschlüsse', icon: 'vote', route: { commands: ['/demo/about'] } },
  ];
  protected readonly home: Action = {
    key: 'home',
    label: 'Zur Startseite',
    icon: 'back',
    route: { commands: ['/demo/start'] },
  };
  protected readonly state: LoadState<unknown> = {
    state: 'empty',
    heading: 'Noch keine öffentlichen Protokolle',
    icon: 'file',
  };
}

/** The form screen (002242) with the kit form of every field kind (002255). */
@Component({
  selector: 'sc-demo-form',
  imports: [FormScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-screen
      [head]="{ title: 'Antrag bearbeiten' }"
      subtitle="Sommerfest 2026"
      [form]="form()"
      [value]="value()"
      [errors]="errors()"
      [submit]="{ label: 'Speichern', busy: saving() }"
      (valueChange)="value.set($event)"
      (submit)="save($event)"
      (cancel)="value.set(saved())"
    />
  `,
})
export class DemoFormPage {
  protected readonly saved = signal<FormValue>({ title: 'Sommerfest', count: 120 });
  protected readonly value = signal<FormValue>(this.saved());
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  /** The app computes `visible`: the IBAN shows only for a payment to a person. */
  protected readonly form = computed(() => DEMO_FORM(this.value()['payee'] === 'person'));

  /** The demo refuses a title that starts with "Test", like a server would. */
  protected save(value: FormValue): void {
    this.saving.set(true);
    setTimeout(() => {
      const taken = String(value['title'] ?? '').startsWith('Test');
      this.errors.set(taken ? { title: 'Ein Antrag mit diesem Titel ist schon offen.' } : {});
      if (!taken) this.saved.set(value);
      this.saving.set(false);
    }, 600);
  }
}

/** "Antrag stellen" as the wizard screen (002243): the choice, Angaben, Kontakt, Prüfen. */
@Component({
  selector: 'sc-demo-apply',
  imports: [WizardScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-wizard-screen
      [head]="{ title: 'Antrag stellen' }"
      [form]="form"
      [steps]="steps"
      [intro]="intro()"
      [review]="review"
      [value]="value()"
      [submit]="{ label: 'Antrag anlegen', busy: sending() }"
      [discard]="chosen() ? discard : null"
      [saved]="dirty() ? 'Entwurf in diesem Tab gespeichert' : null"
      [leave]="{ label: 'Zur Startseite' }"
      (valueChange)="onValue($event)"
      (choice)="chosen.set($event)"
      (submit)="send()"
      (discard)="reset()"
      (leave)="home()"
    />
  `,
})
export class DemoApplyPage {
  private readonly router = inject(Router);
  protected readonly form = DEMO_APPLY;
  protected readonly value = signal<FormValue>({});
  protected readonly dirty = signal(false);
  protected readonly chosen = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly steps: readonly WizardStep[] = [
    { key: 'details', label: 'Angaben', title: 'Angaben zum Antrag', sections: ['main', 'costs'] },
    { key: 'contact', label: 'Kontakt', title: 'Kontakt', sections: ['contact'] },
  ];
  protected readonly review: WizardReview = {
    key: 'review',
    label: 'Prüfen & absenden',
    title: 'Prüfen & absenden',
    hint: 'Zusammenfassung',
  };
  protected readonly discard: WizardDiscard = {
    label: 'Entwurf verwerfen',
    title: 'Entwurf verwerfen?',
    body: 'Deine Angaben und die hochgeladenen Dateien werden gelöscht.',
  };
  protected readonly intro = computed<WizardIntro>(() => ({
    key: 'type',
    label: 'Antragsart',
    title: 'Antragsart wählen',
    chosen: this.chosen(),
    groups: [
      {
        key: 'money',
        label: 'Mit Budget',
        text:
          '- **Förderantrag**: Geld für Veranstaltungen und Projekte.\n' +
          '- **Anschaffung**: Beschaffung aus der eigenen Kostenstelle.\n' +
          'Pro Kostenposition sind **drei Vergleichsangebote** nötig. [Mehr Informationen](https://example.org)',
        options: [
          { value: 'funding', label: 'Förderantrag' },
          { value: 'purchase', label: 'Anschaffung' },
        ],
      },
      {
        key: 'other',
        options: [{ value: 'motion', label: 'Sonstiger Antrag' }],
      },
    ],
  }));

  protected onValue(v: FormValue): void {
    this.value.set(v);
    this.dirty.set(true);
  }

  protected send(): void {
    this.sending.set(true);
    setTimeout(() => this.sending.set(false), 800);
  }

  protected reset(): void {
    this.value.set({});
    this.chosen.set(null);
    this.dirty.set(false);
  }

  protected home(): void {
    void this.router.navigate(['/demo/start']);
  }
}

/** The list of the settings: two pages, as Konto and Verwaltung list them. */
@Component({
  selector: 'sc-demo-settings-list',
  imports: [ListDetailScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-list-detail-screen
      [head]="{ title: 'Einstellungen' }"
      [rows]="rows"
      [none]="{ heading: 'Einstellung wählen', icon: 'gear' }"
      [config]="{ barTitle: true }"
    />
  `,
})
export class DemoSettingsListPage {
  protected readonly rows: LoadState<readonly ListRow[]> = {
    state: 'ready',
    data: [
      {
        id: 'notifications',
        title: 'Benachrichtigungen',
        meta: ['E-Mails je Anlass ein- und ausschalten'],
        icon: 'bell',
        link: { commands: ['/demo/settings', 'notifications'] },
      },
      {
        id: 'tickets',
        title: 'Hilfe & Tickets',
        meta: ['Handbuch und Tickets ohne Konto'],
        icon: 'help',
        link: { commands: ['/demo/settings', 'tickets'] },
      },
    ],
  };
}

/**
 * The settings screen with data only: Benachrichtigungen saves each change at once, Hilfe &
 * Tickets keeps a draft until Speichern and has a custom group (the Wiki address).
 */
@Component({
  selector: 'sc-demo-settings',
  imports: [SettingsScreenComponent, ScreenGroupDirective, InputComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (id() === 'tickets') {
      <app-settings-screen
        [head]="{ title: 'Hilfe & Tickets' }"
        [groups]="ticketGroups()"
        [state]="state()"
        [save]="{ dirty: dirty(), busy: saving() }"
        (change)="setTicket($event.key, $event.value)"
        (save)="save()"
        (discard)="discard()"
      >
        <ng-template screenGroup="wiki">
          <app-input
            type="url"
            label="Adresse des Handbuchs"
            [required]="true"
            [(ngModel)]="wiki"
          />
        </ng-template>
      </app-settings-screen>
    } @else {
      <app-settings-screen
        [head]="{ title: 'Benachrichtigungen' }"
        [groups]="noticeGroups()"
        [state]="state()"
        (change)="setNotice($event.key, $event.value)"
      />
    }
  `,
})
export class DemoSettingsPage {
  readonly id = input('');
  protected wiki = 'https://wiki.example.org/books/antragsplattform';
  protected readonly state = signal<SettingsState>({ state: 'loading' });
  private readonly notices = signal<Readonly<Record<string, boolean>>>({
    status: false,
    comments: true,
    tasks: false,
    meetings: true,
    protocols: true,
  });
  private readonly saved = signal<Readonly<Record<string, boolean>>>({
    publicEnabled: true,
    notifyNew: true,
    anonymize: false,
  });
  private readonly draft = signal<Readonly<Record<string, boolean>>>(this.saved());
  protected readonly saving = signal(false);
  protected readonly dirty = computed(() =>
    Object.keys(this.saved()).some((k) => this.saved()[k] !== this.draft()[k]),
  );

  protected readonly noticeGroups = computed<readonly SettingsGroup[]>(() => {
    const n = this.notices();
    const label: Readonly<Record<string, string>> = {
      status: 'Status-Updates zu Anträgen',
      comments: 'Neue Kommentare',
      tasks: 'Neue Aufgaben',
      meetings: 'Sitzungen',
      protocols: 'Protokolle',
    };
    return [
      {
        key: 'mails',
        rows: Object.keys(label).map((key) => ({
          key,
          label: label[key],
          control: 'switch' as const,
          value: n[key],
        })),
      },
    ];
  });

  protected readonly ticketGroups = computed<readonly SettingsGroup[]>(() => {
    const d = this.draft();
    return [
      { key: 'wiki', label: 'Wiki', rows: [] },
      {
        key: 'tickets',
        label: 'Tickets',
        rows: [
          {
            key: 'publicEnabled',
            label: 'Tickets ohne Konto erlauben',
            control: 'switch',
            value: d['publicEnabled'],
          },
          {
            key: 'notifyNew',
            label: 'Neue Tickets per E-Mail',
            control: 'switch',
            value: d['notifyNew'],
          },
          {
            key: 'anonymize',
            label: 'Erledigte Tickets anonymisieren',
            meta: 'Nach 12 Monaten',
            control: 'switch',
            value: d['anonymize'],
          },
        ],
      },
      {
        key: 'more',
        label: 'Mehr',
        rows: [
          { key: 'version', label: 'Version', control: 'value', value: '2026.11.28' },
          {
            key: 'audit',
            label: 'Audit-Log',
            control: 'link',
            link: { commands: ['/demo/start'] },
          },
        ],
      },
    ];
  });

  constructor() {
    setTimeout(() => this.state.set({ state: 'ready' }), 600);
  }

  protected setNotice(key: string, value: boolean): void {
    this.notices.update((n) => ({ ...n, [key]: value }));
  }

  protected setTicket(key: string, value: boolean): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saved.set(this.draft());
      this.saving.set(false);
    }, 600);
  }

  protected discard(): void {
    this.draft.set(this.saved());
  }
}

const STATUS_TEXT: Readonly<
  Record<StatusKind, { readonly heading: string; readonly body: string }>
> = {
  'not-found': { heading: 'Seite nicht gefunden', body: 'Die angeforderte Seite existiert nicht.' },
  forbidden: {
    heading: 'Kein Zugriff',
    body: 'Für diesen Bereich fehlt dir die erforderliche Berechtigung.',
  },
  error: { heading: 'Etwas ist schiefgelaufen', body: 'Die Seite konnte nicht geladen werden.' },
  offline: { heading: 'Keine Verbindung', body: 'Der Server ist gerade nicht erreichbar.' },
};

/** The status screen (002246) of each kind: `/demo/status/not-found` and the others. */
@Component({
  selector: 'sc-demo-status',
  imports: [StatusScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-status-screen
      [kind]="kind()"
      [heading]="text().heading"
      [body]="text().body"
      [actions]="actions()"
    />
  `,
})
export class DemoStatusPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly kind = computed<StatusKind>(() => {
    const k = this.params()?.get('kind');
    return k === 'forbidden' || k === 'error' || k === 'offline' ? k : 'not-found';
  });
  private readonly params = toSignal(this.route.paramMap);
  protected readonly text = computed(() => STATUS_TEXT[this.kind()]);
  protected readonly actions = computed<readonly Action[]>(() =>
    this.kind() === 'error' || this.kind() === 'offline'
      ? [
          { key: 'retry', label: 'Erneut versuchen' },
          { key: 'home', label: 'Zur Startseite', route: { commands: ['/demo/start'] } },
        ]
      : [{ key: 'home', label: 'Zur Startseite', route: { commands: ['/demo/start'] } }],
  );
}
