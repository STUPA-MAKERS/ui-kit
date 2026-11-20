import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import {
  FactsComponent,
  ListDetailLayoutComponent,
  ListGroupComponent,
  ListItemComponent,
  MEDIA,
  mediaQuery,
  PageHeaderComponent,
  SearchPillComponent,
  SectionComponent,
  SheetBarComponent,
  SheetBarTitleDirective,
  StatusTextComponent,
  StickyBarComponent,
} from "@stupa-makers/ui-kit";
import {
  FrameworkShellComponent,
  injectListDetailPage,
} from "@stupa-makers/ui-kit/shell";

import { DEMO_ROWS, demoFrame } from "./demo-config";

/** The demo app: the framework shell with the config of `demoConfig()`. */
@Component({
  selector: "sc-demo-frame",
  imports: [FrameworkShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-framework-shell (action)="onAction($event)" />`,
})
export class DemoFrame {
  protected onAction(key: string): void {
    if (key === "signIn") demoFrame.set("rail");
    else console.info(`[showcase] action ${key}`);
  }
}

/** A start page from kit parts: the page header and a section with facts. */
@Component({
  selector: "sc-demo-start",
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

/**
 * A list page from kit parts: `app-list-detail`, the pane header, the search in the sticky
 * bar and the rows of `app-list-group`. The frame comes from the `frame` mixin of the kit.
 */
@Component({
  selector: "sc-demo-list",
  imports: [
    ListDetailLayoutComponent,
    PageHeaderComponent,
    StickyBarComponent,
    SearchPillComponent,
    ListGroupComponent,
    ListItemComponent,
    StatusTextComponent,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class.pane-page]": "split()" },
  templateUrl: "./demo-list.page.html",
  styleUrl: "./demo-list.page.scss",
})
export class DemoListPage {
  private readonly router = inject(Router);
  private readonly layout = viewChild(ListDetailLayoutComponent);
  private readonly page = injectListDetailPage(this.layout);
  protected readonly split = this.page.split;
  protected readonly selectedId = this.page.selectedId;
  protected readonly phone = mediaQuery(MEDIA.phone);
  protected readonly query = signal("");
  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    return DEMO_ROWS.filter((r) => !q || r.title.toLowerCase().includes(q));
  });

  protected back(): void {
    void this.router.navigate(["/demo/applications"]);
  }
}

/** A detail from kit parts: the sheet bar with the title, the status and the facts. */
@Component({
  selector: "sc-demo-detail",
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
          <h1
            appSheetBarTitle
            id="demo-detail-title"
            class="demo-title"
            tabindex="-1"
          >
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
  readonly id = input("");
  protected readonly row = computed(() =>
    DEMO_ROWS.find((r) => r.id === this.id()),
  );
}

/** A public page: the public frame shows for everybody. */
@Component({
  selector: "sc-demo-about",
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
