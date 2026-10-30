import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  LoadBarComponent,
  MEDIA,
  PageFrame,
  ToastComponent,
  UiKitTranslatePipe,
  mediaQuery,
} from '@stupa-makers/ui-kit';
import { filter } from 'rxjs';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';
import { NavMarkDirective } from '../nav-mark.directive';
import { NavRailComponent } from '../nav-rail/nav-rail.component';
import type { ShellBrand, ShellFrame, ShellNavItem } from '../shell.types';

/**
 * The frame of the app around ONE router outlet: the skip link, the navigation rail (the
 * bottom bar on a phone), the load bar and the toasts.
 *
 * There is one router outlet for every frame. The frame only adds or removes the chrome
 * around it, so a change of frame (a sign-in, a projector view) never destroys and
 * recreates the page.
 *
 * The app decides what the shell shows:
 * - `frame`: from its session (see {@link ShellFrame}). The shell takes `bare` by itself
 *   on a route with `chrome: false`.
 * - `nav`: the entries the person may open, already filtered and translated.
 *   `barKeys` are the entries of the phone bar; the rest go into "More".
 * - `brand`: the mark at the top of the rail.
 * - `keyboardOpen`: the on-screen keyboard is open, so the phone bar may step aside.
 *
 * The shell reads the route data of the active routes: `wide` (no width cap), `fab` (on a
 * phone the foot of the page keeps room for a floating button), `footer` (the footer
 * shows in the rail frame), `chrome: false` (no frame) and `fill` (the page fills the
 * viewport, as {@link PageFrame}`.fill`).
 *
 * Content slots:
 * - `[shellRailTools]`: in the rail above the end entries (a help menu).
 * - `[shellRailEnd]`, `[shellBarEnd]`: an item of the app at the end of the rail entries
 *   and of the phone bar (`app-rail-button`, `app-bar-button`).
 * - `[shellAccount]`: the account menu (`app-account-menu variant="auto"`), at the foot
 *   of the rail and at the end of "More".
 * - `[shellMore]`: extra groups in "More" (a help menu).
 * - `[shellPublicHeader]`: the header of the public frame.
 * - `[shellFooter]`: the footer (public frame, and `footer` routes of the rail frame).
 * - `[shellMain]`: content in the main area before the outlet, in every frame. With
 *   `outlet` false it takes the place of the page, for example a gate that shows a load
 *   or offline state until the app is ready.
 * - `[shellOverlays]`: dialogs of the app (the search palette); only in the rail frame.
 * - `[shellPrompts]`: prompts of the app in every frame, for example a prompt to install
 *   the app or to unlock a key. The update of the app needs no slot: `SwUpdateService` of
 *   `@stupa-makers/ui-kit/pwa` shows it as a toast.
 *
 * The toasts sit at the bottom end. On a phone they sit above the bottom bar
 * (`--app-bottom-inset`), and an app that hides the bar for the keyboard sets the inset to 0.
 * A `fill` page is one screen high, so only its panes scroll; it shows no footer. An empty
 * footer slot leaves no box.
 *
 * A `<ng-template appNavMark let-key let-part="part">` gives each entry a mark.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    NgTemplateOutlet,
    UiKitTranslatePipe,
    ToastComponent,
    LoadBarComponent,
    NavRailComponent,
    BottomBarComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly pageFrame = inject(PageFrame);

  /** The frame the app asks for. */
  readonly frame = input<ShellFrame>('rail');
  /** The navigation entries, filtered by permission and translated. */
  readonly nav = input<readonly ShellNavItem[]>([]);
  /** The keys of the entries of the phone bar, in bar order. */
  readonly barKeys = input<readonly string[]>([]);
  readonly brand = input.required<ShellBrand>();
  /** The on-screen keyboard is open (`frame--keyboard`, for the app styles). */
  readonly keyboardOpen = input(false);
  /** Show the search entry in the rail and in "More". */
  readonly searchable = input(true);
  /** Show "More" in the phone bar. Set it false when every entry is in `barKeys`. */
  readonly more = input(true);
  /** Paths outside the entries that also make "More" active, for example `/account`. */
  readonly morePaths = input<readonly string[]>([]);
  /** Render the router outlet. False shows only `[shellMain]`, for a gate of the app. */
  readonly outlet = input(true);

  /** The search entry of the rail or of "More" was pressed. */
  readonly search = output<void>();

  protected readonly markDir = contentChild(NavMarkDirective);
  protected readonly mark = computed(() => this.markDir()?.template ?? null);

  /** The viewport is a phone (<= 768px): bottom bar instead of the rail. */
  readonly phone = mediaQuery(MEDIA.phone);

  /** Full-width content from route data `wide`. */
  readonly wide = signal(false);
  /** Route data `fab: true`: on a phone the foot of the body stays free for the button. */
  readonly fab = signal(false);
  /** Route data `chrome: false` turns the frame off. */
  private readonly chrome = signal(true);
  /** Route data `footer: true`. */
  private readonly footerRoute = signal(false);
  /** Route data `fill: true`. */
  private readonly fillRoute = signal(false);

  /** The page fills the viewport: no footer, a small foot gap. */
  readonly fill = computed(() => this.fillRoute() || this.pageFrame.fill());

  /** The frame in effect. */
  readonly current = computed<ShellFrame>(() => (this.chrome() ? this.frame() : 'bare'));

  /** The footer shows: always in the public frame, else only where the route asks for it. */
  readonly footer = computed(() => {
    const frame = this.current();
    if (frame === 'public') return true;
    return frame === 'rail' && this.footerRoute() && !this.fill();
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.readRoute());
    this.readRoute();
  }

  /**
   * Reads the data of every route from the root of the router state, so the shell works at
   * the root and inside a route component, where its own route has no active child yet.
   */
  private readRoute(): void {
    let r: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let wide = false;
    let fab = false;
    let footer = false;
    let fill = false;
    let chrome = true;
    while (r) {
      const data = r.data;
      wide = data['wide'] === true || wide;
      fab = data['fab'] === true || fab;
      footer = data['footer'] === true || footer;
      fill = data['fill'] === true || fill;
      if (data['chrome'] === false) chrome = false;
      r = r.firstChild;
    }
    this.wide.set(wide);
    this.fab.set(fab);
    this.footerRoute.set(footer);
    this.fillRoute.set(fill);
    this.chrome.set(chrome);
  }
}
