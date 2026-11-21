import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import {
  ButtonComponent,
  EmptyStateComponent,
  IconComponent,
  RowMenuComponent,
  SheetBarComponent,
  SheetBarTitleDirective,
  SideSheetComponent,
  SkeletonComponent,
  StatusTextComponent,
  TabsComponent,
  UI_KIT_INTL,
  UiKitTranslatePipe,
  placeActions,
  type Action,
  type LoadState,
  type RowMenuItem,
  type RowMenuSection,
  type ScreenHead,
  type ScreenTab,
  type SideSheetDef,
  type TabItem,
} from '@stupa-makers/ui-kit';

import { injectWidthClass } from '../width';

// The slot names are fixed by the screen contract (002217), not by the selector prefix.

/** The body of one tab: `<ng-template screenTab="history">`. */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'ng-template[screenTab]', standalone: true })
export class ScreenTabDirective {
  readonly key = input.required<string>({ alias: 'screenTab' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The body of a detail without tabs. */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'ng-template[screenBody]', standalone: true })
export class ScreenBodyDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The content of one side sheet: `<ng-template screenSheet="votes">`. */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'ng-template[screenSheet]', standalone: true })
export class ScreenSheetDirective {
  readonly key = input.required<string>({ alias: 'screenSheet' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The comments of the detail. */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'ng-template[screenComments]', standalone: true })
export class ScreenCommentsDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** The comments of a detail: open at the start, and the name of the head button. */
export interface ScreenComments {
  readonly open: boolean;
  readonly label: string;
}

/** A side sheet (or the comments, key `comments`) opened or closed. */
export interface SheetChange {
  readonly key: string;
  readonly open: boolean;
}

/** The key of the comments in `sheetChange`. */
export const COMMENTS_KEY = 'comments';
const SHEET_ITEM = '__sheet:';
const TAB_PARAM = 'tab';
/** From this width of the screen on, the comments sit beside the body. */
const ROOMY_PX = 760;

/**
 * The detail screen: the head with the title, the status chip, the meta chips, the actions
 * and the ⋮, the tabs, the body, the side sheets with their edge tabs and the comments.
 * The app gives data and slots; the screen places every part.
 *
 * The back button shows only when `head.back` is set: inside the list/detail screen the
 * layout brings the way back itself.
 * §S/framework/screens/002241 §S/framework/screens/002216
 */
@Component({
  selector: 'app-detail-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    RowMenuComponent,
    SheetBarComponent,
    SheetBarTitleDirective,
    SideSheetComponent,
    SkeletonComponent,
    StatusTextComponent,
    TabsComponent,
    UiKitTranslatePipe,
  ],
  templateUrl: './detail-screen.component.html',
  styleUrl: './detail-screen.component.scss',
})
export class DetailScreenComponent {
  readonly head = input.required<ScreenHead>();
  readonly state = input.required<LoadState<unknown>>();
  readonly tabs = input<readonly ScreenTab[]>([]);
  readonly actions = input<readonly Action[]>([]);
  readonly sheets = input<readonly SideSheetDef[]>([]);
  readonly comments = input<ScreenComments | null>(null);

  readonly action = output<{ readonly key: string }>();
  readonly tabChange = output<string>();
  readonly sheetChange = output<SheetChange>();

  protected readonly tabSlots = contentChildren(ScreenTabDirective);
  protected readonly bodySlot = contentChild(ScreenBodyDirective);
  protected readonly sheetSlots = contentChildren(ScreenSheetDirective);
  protected readonly commentsSlot = contentChild(ScreenCommentsDirective);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly intl = inject(UI_KIT_INTL);
  protected readonly width = injectWidthClass();
  protected readonly phone = computed(() => this.width() === 'phone');

  protected readonly titleId = `ds-title-${Math.random().toString(36).slice(2, 10)}`;
  protected readonly tabsId = `ds-tabs-${Math.random().toString(36).slice(2, 10)}`;

  private readonly tabParam = signal<string | null>(this.readTab());
  protected readonly visibleTabs = computed(() => this.tabs().filter((t) => !t.hidden));
  protected readonly tabItems = computed<readonly TabItem[]>(() =>
    this.visibleTabs().map((t) => ({ id: t.key, label: t.label })),
  );
  /** The open tab: the one of the URL, else the first tab. */
  protected readonly tab = computed(() => {
    const tabs = this.visibleTabs();
    const wanted = this.tabParam();
    return tabs.find((t) => t.key === wanted)?.key ?? tabs[0]?.key ?? null;
  });
  protected readonly tabTemplate = computed(
    () => this.tabSlots().find((s) => s.key() === this.tab())?.template ?? null,
  );

  protected readonly openSheet = signal<string | null>(null);
  protected readonly commentsOpen = linkedSignal(() => this.comments()?.open ?? false);
  /**
   * The screen is wide enough for the comments beside the body. It is the width of the
   * screen itself, not of the window, because in the list/detail screen the detail is a pane.
   */
  protected readonly roomy = signal(false);
  /** The comments sit beside the body where there is room, else in a sheet (000215). */
  protected readonly commentsBeside = computed(
    () => this.roomy() && !!this.comments() && this.commentsOpen(),
  );
  /** On a phone an open sheet with `replaces` takes the place of the body (001461). */
  protected readonly replacing = computed(() => {
    const key = this.openSheet();
    if (!this.phone() || key === null) return null;
    return this.sheets().find((s) => s.key === key && s.replaces) ?? null;
  });

  protected readonly placed = computed(() => placeActions(this.actions(), this.width()));
  /** On a phone the side sheets open from the ⋮, because there is no room for edge tabs. */
  protected readonly menu = computed<readonly RowMenuSection[]>(() => {
    const sheets: readonly RowMenuSection[] =
      this.phone() && this.sheets().length
        ? [
            {
              items: this.sheets().map((s) => ({
                id: SHEET_ITEM + s.key,
                label: s.label,
                icon: s.icon,
              })),
            },
          ]
        : [];
    const own: readonly RowMenuSection[] = this.placed().menu.length
      ? [{ items: this.placed().menu.map(toMenuItem) }]
      : [];
    return [...own, ...sheets];
  });
  protected readonly loadingLabel = computed(() => this.intl.translate('loading'));

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(([entry]) =>
        this.roomy.set((entry?.contentRect.width ?? 0) >= ROOMY_PX),
      );
      observer.observe(host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.tabParam.set(this.readTab()));
  }

  protected backLink(): readonly unknown[] | null {
    const back = this.head().back;
    return back && 'commands' in back ? back.commands : null;
  }

  protected backAction(): string | null {
    const back = this.head().back;
    return back && 'action' in back ? back.action : null;
  }

  /** The open tab is in the URL, so a reload and a shared link keep it. */
  protected selectTab(key: string | null): void {
    if (key === null || key === this.tab()) return;
    this.tabParam.set(key);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [TAB_PARAM]: key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.tabChange.emit(key);
  }

  protected sheetTemplate(key: string): TemplateRef<unknown> | null {
    return this.sheetSlots().find((s) => s.key() === key)?.template ?? null;
  }

  protected setSheet(key: string, open: boolean): void {
    const was = this.openSheet() === key;
    if (open === was) return;
    this.openSheet.set(open ? key : null);
    this.sheetChange.emit({ key, open });
  }

  protected toggleComments(): void {
    this.setComments(!this.commentsOpen());
  }

  protected setComments(open: boolean): void {
    if (open === this.commentsOpen()) return;
    this.commentsOpen.set(open);
    this.sheetChange.emit({ key: COMMENTS_KEY, open });
  }

  /** An action with a route navigates; every other action is emitted with its key. */
  protected run(item: Action | RowMenuItem): void {
    const key = 'key' in item ? item.key : item.id;
    if (key.startsWith(SHEET_ITEM)) {
      this.setSheet(key.slice(SHEET_ITEM.length), true);
      return;
    }
    const def = this.actions().find((a) => a.key === key);
    if (def?.route) {
      void this.router.navigate([...def.route.commands], { queryParams: def.route.query });
      return;
    }
    this.action.emit({ key });
  }

  private readTab(): string | null {
    return this.route.snapshot.queryParamMap.get(TAB_PARAM);
  }
}

function toMenuItem(a: Action): RowMenuItem {
  return { id: a.key, label: a.label, icon: a.icon, danger: a.kind === 'danger' };
}
