import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, type ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent, ThemeService, UiKitTranslatePipe, type Action } from '@stupa-makers/ui-kit';

import { AccountMenuComponent } from '../account-menu/account-menu.component';
import { NavMarkDirective } from '../nav-mark.directive';
import { ShellComponent } from '../shell/shell.component';
import { ShellMenuComponent } from '../shell-menu/shell-menu.component';
import type { ShellBrand } from '../shell.types';
import { FRAMEWORK, frameworkParts } from './framework';
import { FOCUS_H1 } from './routes';

/**
 * The frame of an app, built from its {@link FrameworkConfig}: the kit shell with the frame of
 * the session, the entries and the phone bar of the config, the marks of the `navMarks` port
 * (a dot, never a count) and the account menu with the items, the languages, the dark design
 * and sign-out. A part whose field or port is missing does not show.
 * §S/framework/shell/002263 §S/framework/shell/002264
 *
 * An item without a route or a link is emitted as `action` with its key. A route of
 * `screenRoute` with `frame: 'public'` shows the public frame for everybody. After each
 * navigation but the first, the focus moves to the `h1` of a route of the route helpers
 * (000512, 002262).
 */
@Component({
  selector: 'app-framework-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShellComponent,
    NavMarkDirective,
    AccountMenuComponent,
    ShellMenuComponent,
    RouterLink,
    IconComponent,
    UiKitTranslatePipe,
  ],
  template: `
    <app-shell
      #shell
      [frame]="frame()"
      [nav]="config.nav()"
      [barKeys]="config.bar()"
      [brand]="brand()"
      [searchable]="parts().search"
      (search)="search.emit()"
    >
      <ng-template appNavMark let-key let-part="part">
        @if (marks()[key]; as mark) {
          @if (part === 'visual') {
            <span class="fw-mark" [class.fw-mark--warn]="mark === 'warn'" aria-hidden="true"></span>
          } @else if (part === 'text') {
            <span class="sr-only">{{
              (mark === 'warn' ? 'shell.markWarn' : 'shell.markNew') | uiKitT
            }}</span>
          }
        }
      </ng-template>

      @if (shell.current() === 'rail') {
        <app-shell-menu
          shellRailTools
          variant="rail"
          menu="a11y"
          [statementLink]="config.a11yStatement"
        />
      }
      @if (shell.current() === 'rail' && parts().help) {
        <app-shell-menu
          shellRailTools
          variant="rail"
          [items]="helpItems()"
          (action)="action.emit($event)"
        />
      }
      @if (shell.current() === 'rail') {
        <app-shell-menu
          shellMore
          variant="sheet"
          menu="a11y"
          [statementLink]="config.a11yStatement"
        />
      }
      @if (shell.current() === 'rail' && parts().help) {
        <app-shell-menu
          shellMore
          variant="sheet"
          [items]="helpItems()"
          (action)="action.emit($event)"
        />
      }

      @if (shell.current() === 'rail' && person(); as who) {
        <app-account-menu
          shellAccount
          variant="auto"
          [name]="who.name"
          [avatarId]="who.principalId ?? null"
          [languages]="config.languages"
          [language]="config.language.current()"
          [dark]="theme.resolved() === 'dark'"
          (languageChange)="config.language.set($event)"
          (darkChange)="theme.setPreference($event ? 'dark' : 'light')"
          (logout)="config.ports.session.logout()"
        >
          <ng-container accountItems>
            @for (item of accountItems(); track item.key) {
              @if (item.route; as route) {
                <a
                  class="am__item"
                  [routerLink]="route.commands"
                  [queryParams]="route.query"
                  [fragment]="route.fragment"
                >
                  @if (item.icon) {
                    <app-icon [name]="item.icon" [size]="19" />
                  }
                  {{ item.label }}
                </a>
              } @else if (item.href) {
                <a class="am__item" [href]="item.href" target="_blank" rel="noopener">
                  @if (item.icon) {
                    <app-icon [name]="item.icon" [size]="19" />
                  }
                  {{ item.label }}
                </a>
              } @else {
                <button
                  type="button"
                  class="am__item"
                  [disabled]="item.disabled"
                  (click)="action.emit(item.key)"
                >
                  @if (item.icon) {
                    <app-icon [name]="item.icon" [size]="19" />
                  }
                  {{ item.label }}
                </button>
              }
            }
          </ng-container>
        </app-account-menu>
      }

      @if (footerShown()) {
        <nav shellFooter class="fw-footer">
          @for (link of config.footer?.links ?? []; track link.label) {
            <a
              [routerLink]="link.link.commands"
              [queryParams]="link.link.query"
              [fragment]="link.link.fragment"
              >{{ link.label }}</a
            >
          }
        </nav>
      }
    </app-shell>
  `,
  styles: `
    :host {
      display: contents;
    }
    .fw-mark {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-accent);
    }
    .fw-mark--warn {
      background: var(--color-warning);
    }
    .fw-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      padding: 16px;
    }
  `,
})
export class FrameworkShellComponent {
  protected readonly config = inject(FRAMEWORK);
  protected readonly theme = inject(ThemeService);
  protected readonly parts = frameworkParts(this.config);

  /** The search entry of the rail or of "More" was pressed. */
  readonly search = output<void>();
  /** An item of a menu without a route or a link was chosen: its key. */
  readonly action = output<string>();

  protected readonly brand = computed<ShellBrand>(() => ({
    home: this.config.brand.home,
    label: this.config.brand.name,
    mark: this.config.brand.mark,
  }));

  protected readonly person = this.config.ports.session.person;

  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly leafData = signal<Readonly<Record<string, unknown>>>({});

  protected readonly frame = computed(() => {
    const session = this.config.ports.session.frame();
    return session !== 'pending' && this.leafData()['frame'] === 'public' ? 'public' : session;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const data = leaf(this.router.routerState.snapshot.root).data;
        this.leafData.set(data);
        if (e.id > 1 && data[FOCUS_H1] === true) this.focusHeading();
      });
  }

  private focusHeading(): void {
    afterNextRender(
      () => {
        const h1 = document.querySelector<HTMLElement>('main h1');
        if (!h1) return;
        if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
  protected readonly marks = computed(() => this.config.ports.navMarks?.() ?? {});
  protected readonly accountItems = computed<readonly Action[]>(
    () => this.config.account?.items() ?? [],
  );
  protected readonly helpItems = computed<readonly Action[]>(() => this.config.help?.items() ?? []);
  protected readonly footerShown = computed(() => this.parts().footer);
}

function leaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return snapshot.firstChild ? leaf(snapshot.firstChild) : snapshot;
}
