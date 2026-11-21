import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  FactsComponent,
  PageHeaderComponent,
  SectionComponent,
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
} from '@stupa-makers/ui-kit/screens';
import { FrameworkShellComponent } from '@stupa-makers/ui-kit/shell';

import { DEMO_ROWS, demoFrame } from './demo-config';

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

/** A start page from kit parts: the page header and a section with facts. */
@Component({
  selector: 'sc-demo-start',
  imports: [PageHeaderComponent, SectionComponent, FactsComponent],
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

  protected onAction(key: string): void {
    console.info(`[showcase] detail action ${key}`);
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
