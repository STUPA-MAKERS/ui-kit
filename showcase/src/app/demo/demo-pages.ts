import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  FactsComponent,
  PageHeaderComponent,
  SectionComponent,
  SheetBarComponent,
  SheetBarTitleDirective,
  StatusTextComponent,
  type Action,
  type FilterDef,
  type ListGroup,
  type ListRow,
  type LoadState,
} from '@stupa-makers/ui-kit';
import { ListDetailScreenComponent } from '@stupa-makers/ui-kit/screens';
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
      [none]="{ heading: 'Kein Antrag geöffnet', icon: 'file' }"
      (query)="query.set($event.search)"
      (action)="onAction($event.key)"
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

  protected onAction(key: string): void {
    console.info(`[showcase] action ${key}`);
  }
}

/** A detail from kit parts: the sheet bar with the title, the status and the facts. */
@Component({
  selector: 'sc-demo-detail',
  imports: [
    SheetBarComponent,
    SheetBarTitleDirective,
    StatusTextComponent,
    FactsComponent,
    SectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (row(); as r) {
      <article aria-labelledby="demo-detail-title">
        <app-sheet-bar>
          <h1 appSheetBarTitle id="demo-detail-title" class="demo-title" tabindex="-1">
            {{ r.title }}
          </h1>
        </app-sheet-bar>
        <app-status-text chip [kind]="r.kind">{{ r.status }}</app-status-text>
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
      </article>
    }
  `,
  styles: `
    /* The column and the title type of a sheet; they move into the kit with the detail
       screen (M5). */
    article {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-4);
    }
    app-section {
      align-self: stretch;
    }
    article > app-status-text {
      align-self: flex-start;
    }
    .demo-title {
      margin: 0;
      font-size: var(--fs-d2);
      line-height: var(--lh-d2);
      font-weight: var(--fw-semibold);
      letter-spacing: var(--tracking-tight);
    }
  `,
})
export class DemoDetailPage {
  readonly id = input('');
  protected readonly row = computed(() => DEMO_ROWS.find((r) => r.id === this.id()));
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
