import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import { ListDetailLayoutComponent } from "@stupa-makers/ui-kit";
import { FrameworkShellComponent } from "@stupa-makers/ui-kit/shell";

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

@Component({
  selector: "sc-demo-start",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <h1 tabindex="-1">Start</h1>
      <p>
        Diese Seite zeigt die Shell des Frameworks mit einer Demo-Konfiguration.
      </p>
    </div>
  `,
})
export class DemoStartPage {}

@Component({
  selector: "sc-demo-list",
  imports: [ListDetailLayoutComponent, RouterLink, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-list-detail
      [detailOpen]="open()"
      (back)="router.navigate(['/demo/applications'])"
    >
      <div list>
        <h1 tabindex="-1">Anträge</h1>
        <ul>
          @for (row of rows; track row.id) {
            <li>
              <a [routerLink]="row.id">{{ row.title }}</a> · {{ row.sub }}
            </li>
          }
        </ul>
      </div>
      <div detail><router-outlet /></div>
    </app-list-detail>
  `,
})
export class DemoListPage {
  protected readonly router = inject(Router);
  protected readonly rows = DEMO_ROWS;
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly open = computed(() =>
    /\/applications\/[^/]+$/.test(this.url()),
  );
}

@Component({
  selector: "sc-demo-detail",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (row(); as r) {
      <h1 tabindex="-1">{{ r.title }}</h1>
      <p>{{ r.sub }}</p>
    }
  `,
})
export class DemoDetailPage {
  readonly id = input("");
  protected readonly row = computed(() =>
    DEMO_ROWS.find((r) => r.id === this.id()),
  );
}

@Component({
  selector: "sc-demo-about",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <h1 tabindex="-1">Über die Demo</h1>
      <p>Eine öffentliche Seite: sie zeigt den öffentlichen Rahmen für alle.</p>
    </div>
  `,
})
export class DemoAboutPage {}
