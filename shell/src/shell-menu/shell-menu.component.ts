import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DisplaySettingsService,
  IconComponent,
  LayerSheetComponent,
  MEDIA,
  SheetBodyDirective,
  SwitchComponent,
  ThemeService,
  UiKitTranslatePipe,
  mediaQuery,
  type Action,
  type DisplayChoice,
  type IconName,
  type RouteLink,
  type UiKitTextKey,
} from '@stupa-makers/ui-kit';

/**
 * `rail`: an entry at the foot of the navigation rail; the menu opens beside it.
 * `header`: a button of the public header; the menu opens below it, and on a
 *   phone as the shared bottom sheet, because a popover under a button near the left edge
 *   does not fit beside it. The host is a segment of the button group of the header
 *   (`btn-grp__seg`, spec 001356), and the trigger is a `.btn`, so the group draws it as
 *   one of its buttons; on a phone it is an icon button (`btn--icon`).
 * `sheet`: the entries only, inline in the "Mehr" sheet of the phone bar. In "Barrierefreiheit"
 *   the caption of "Darstellung" says "Barrierefreiheit", so the sheet shows one caption,
 *   not two stacked ones, and the reset stays on the caption row.
 */
export type ShellMenuVariant = 'rail' | 'header' | 'sheet';

/**
 * `help`: "Hilfe" with the handbook and "Problem melden".
 * `a11y`: "Barrierefreiheit" with the group "Darstellung" and the statement (spec 000647).
 */
export type ShellMenuKind = 'help' | 'a11y';

/** A switch of the group "Darstellung": `dark` is the theme, the rest are display settings. */
export type DisplayKey = 'dark' | DisplayChoice;

/** The switches of the group "Darstellung", in their order (000593). */
const DISPLAY_ROWS: readonly {
  readonly key: DisplayKey;
  readonly icon: IconName;
  readonly label: UiKitTextKey;
}[] = [
  { key: 'dark', icon: 'moon', label: 'menu.display.dark' },
  { key: 'motion', icon: 'play', label: 'menu.display.motion' },
  { key: 'transparency', icon: 'square', label: 'menu.display.transparency' },
  { key: 'contrast', icon: 'half', label: 'menu.display.contrast' },
  { key: 'veryHigh', icon: 'eye', label: 'menu.display.veryHigh' },
];

/** Space between the trigger and the popover, and the least distance to the viewport edge. */
const GAP = 8;

let nextId = 0;

/**
 * One of the two menus of the shell beside each other: "Hilfe" and "Barrierefreiheit"
 * (000647). They share the trigger, the popover and the sheets, so they look and behave the
 * same. §S/framework/shell/002264
 *
 * "Hilfe" shows the `items` of the app: a route, a link in a new tab with the address as the
 * second line, or a button whose key goes out as `action` (for example "Problem melden").
 *
 * "Barrierefreiheit" has the eye icon. It holds the group "Darstellung" and the link to the
 * accessibility statement (`statement`), which no other place links to (STUPA-Workflow:000496,
 * 002287). "Darstellung" (000593, 000594) has one switch per display setting: the dark theme,
 * less motion, less transparency, more contrast and, last, very high contrast, which also
 * highlights the fields (000598). A switch shows the state in effect, which is the system
 * setting until the person sets it. "Systemeinstellungen verwenden" removes every choice, the
 * theme included, and shows only while a choice exists. Very high contrast turns every other
 * setting on: their switches show on and are disabled (000606). The menu stays open on a
 * switch.
 *
 * Like the account menu, the popover is a disclosure, not an ARIA menu. Escape closes it and
 * gives the focus back to the trigger. A press outside, a focus that leaves it and a resize
 * close it too.
 */
@Component({
  selector: 'app-shell-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    UiKitTranslatePipe,
    IconComponent,
    LayerSheetComponent,
    SheetBodyDirective,
    SwitchComponent,
  ],
  templateUrl: './shell-menu.component.html',
  styleUrl: './shell-menu.component.scss',
  host: { '[class.btn-grp__seg]': "variant() === 'header'" },
})
export class ShellMenuComponent {
  private readonly theme = inject(ThemeService);
  private readonly display = inject(DisplaySettingsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly variant = input<ShellMenuVariant>('rail');
  readonly menu = input<ShellMenuKind>('help');
  /** The entries of "Hilfe". */
  readonly items = input<readonly Action[]>([]);
  /**
   * The route of the accessibility statement, or the address of a statement on another site,
   * which opens in a new tab. §S/framework/shell/002798
   */
  readonly statementLink = input<RouteLink | string>({ commands: ['/accessibility'] });
  /** Show "Barriere melden" after the statement link. §S/framework/shell/002292 */
  readonly reportBarrier = input(false);

  /** An entry of "Hilfe" without a route or a link was chosen: its key. */
  readonly action = output<string>();

  /** The name on the trigger, the popover, the sheet and the caption in "Mehr". */
  readonly title = computed<UiKitTextKey>(() =>
    this.menu() === 'a11y' ? 'menu.a11y' : 'menu.help',
  );
  readonly icon = computed<IconName>(() => (this.menu() === 'a11y' ? 'eye' : 'help'));

  /** An entry was used: the sheet that holds the inline menu closes. */
  readonly navigated = output<void>();

  readonly open = signal(false);
  /** The phone sheet of the `header` variant is open. */
  readonly sheetOpen = signal(false);
  protected readonly phone = mediaQuery(MEDIA.phone);
  /** Fixed position of the popover. */
  readonly position = signal<{
    left: number | null;
    right: number | null;
    top: number | null;
    bottom: number | null;
  }>({
    left: null,
    right: null,
    top: null,
    bottom: null,
  });

  /**
   * The rows of the group "Darstellung", each with the state in effect. While very high
   * contrast is on, every other row is on and disabled (spec 000606).
   */
  readonly displayRows = computed(() => {
    const effective = this.display.effective();
    const dark = this.theme.resolved() === 'dark';
    const locked = effective.veryHigh;
    return DISPLAY_ROWS.map((row) => ({
      ...row,
      on: row.key === 'dark' ? dark : effective[row.key],
      locked: locked && row.key !== 'veryHigh',
    }));
  });

  /** A switch of the group overrides the system, so "Systemeinstellungen verwenden" shows. */
  readonly hasDisplayChoice = computed(
    () => this.display.hasChoice() || this.theme.preference() !== 'system',
  );

  protected readonly panelId = `help-menu-${nextId++}`;
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  /**
   * The panel renders in this change detection, so its first control gets the focus right after.
   */
  show(): void {
    if (this.variant() === 'header' && this.phone()) {
      this.sheetOpen.set(true);
      return;
    }
    const trigger = this.trigger()!.nativeElement;
    const rect = trigger.getBoundingClientRect();
    if (this.variant() === 'header') {
      this.position.set({
        left: null,
        right: Math.max(GAP, window.innerWidth - rect.right),
        top: rect.bottom + GAP,
        bottom: null,
      });
    } else {
      const edge = trigger.closest('nav')?.getBoundingClientRect().right ?? rect.right;
      this.position.set({
        left: edge + GAP,
        right: null,
        top: null,
        bottom: Math.max(GAP, window.innerHeight - rect.bottom),
      });
    }
    this.open.set(true);
    setTimeout(() => this.panel()?.nativeElement.querySelector<HTMLElement>('a, button')?.focus());
  }

  /** Close the popover. `restoreFocus` puts the focus back on the trigger. */
  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.trigger()?.nativeElement.focus();
  }

  /** Set one switch of the group "Darstellung" for this browser. */
  setDisplay(key: DisplayKey, on: boolean): void {
    if (key === 'dark') this.theme.setPreference(on ? 'dark' : 'light');
    else this.display.set(key, on);
  }

  /** Every switch of the group follows the system again. */
  resetDisplay(): void {
    this.theme.setPreference('system');
    this.display.reset();
  }

  /** The statement getter for the template: the route. */
  protected get statement(): RouteLink {
    const link = this.statementLink();
    return typeof link === 'string' ? { commands: [] } : link;
  }

  /** The address of a statement on another site, or null for a route. */
  protected statementHref(): string | null {
    const link = this.statementLink();
    return typeof link === 'string' ? link : null;
  }

  /** The address without the scheme, as the second line of a link: it wraps, it is never cut. */
  protected urlLabel(href: string): string {
    return href.replace(/^https?:\/\//, '');
  }

  /** A route or a link was followed: the menu closes. */
  onPicked(): void {
    this.close();
    this.sheetOpen.set(false);
    this.navigated.emit();
  }

  /**
   * An entry without a route was chosen. The focus goes to the trigger first, because a dialog
   * that the app opens stores the active element to restore on close, and the popover button
   * is gone by then.
   */
  pick(key: string): void {
    this.close(true);
    this.sheetOpen.set(false);
    this.navigated.emit();
    this.action.emit(key);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close(true);
  }

  @HostListener('document:pointerdown', ['$event'])
  onPointerDown(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.close();
  }
}
