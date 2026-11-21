import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CheckboxComponent,
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
  type WizardDiscard,
  type WizardIntro,
  type WizardReview,
  type WizardStep,
  type FormValue,
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

/** A public page: the public frame shows for everybody. */
@Component({
  selector: 'sc-demo-about',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <app-page-header
        title="Über die Demo"
        subtitle="Eine öffentliche Seite: sie zeigt den öffentlichen Rahmen für alle"
      />
    </div>
  `,
})
export class DemoAboutPage {}

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
