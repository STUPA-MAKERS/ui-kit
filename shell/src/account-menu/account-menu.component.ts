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
import {
  AvatarComponent,
  FilterSelectComponent,
  type FilterSelectOption,
  IconComponent,
  MEDIA,
  SwitchComponent,
  TruncatedDirective,
  UiKitTranslatePipe,
  mediaQuery,
} from '@stupa-makers/ui-kit';
import type { ShellLanguage } from '../shell.types';

/**
 * `popover`: the avatar at the foot of the rail, which opens the menu beside the rail.
 * `sheet`: the menu content only, inline in the "More" sheet of the phone bar.
 * `auto`: `sheet` on a phone, else `popover`. Use it for the `[shellAccount]` slot of
 * `app-shell`, which shows the same element in the rail or in the "More" sheet.
 */
export type AccountMenuVariant = 'popover' | 'sheet' | 'auto';

/** Space between the rail and the popover, and the least distance to the viewport edge. */
const GAP = 8;

let nextId = 0;

/**
 * The account menu: who is signed in, the account pages of the app (`[accountItems]`
 * slot), language, dark design and sign-out. Language and appearance are settings, not
 * navigation, so they live here at every width.
 *
 * The menu owns no state of the app: it shows `name`, `languages`, `language` and `dark`,
 * and emits `languageChange`, `darkChange` and `logout`. A click on a link in the
 * `[accountItems]` slot closes the popover and emits `navigated`.
 *
 * The popover is a disclosure (a button with `aria-expanded` and a panel), not an ARIA
 * menu: it holds a select and a switch, which a `role="menu"` cannot contain. Tab moves
 * through it. Escape closes it and gives the focus back to the avatar. A click outside,
 * focus that leaves it (Tab past the last control) and a resize of the window also close
 * it, so the fixed panel never covers the focused control and never keeps a stale position.
 *
 * Put the account links into the slot with the kit classes `am__item` and an icon:
 *
 * ```html
 * <app-account-menu variant="auto" [name]="name" …>
 *   <ng-container accountItems>
 *     <a class="am__item" routerLink="/account"><app-icon name="bell" [size]="19" />Notifications</a>
 *   </ng-container>
 * </app-account-menu>
 * ```
 */
@Component({
  selector: 'app-account-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TruncatedDirective,
    NgTemplateOutlet,
    UiKitTranslatePipe,
    IconComponent,
    SwitchComponent,
    AvatarComponent,
    FilterSelectComponent,
  ],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss',
})
export class AccountMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly phone = mediaQuery(MEDIA.phone);

  readonly variant = input<AccountMenuVariant>('popover');
  /** The display name of the signed-in person. */
  readonly name = input.required<string>();
  /** The principal id of the avatar image (`UI_KIT_AVATAR_SOURCE`); `null` draws initials only. */
  readonly avatarId = input<string | null>(null);
  /** The languages of the language control, each named in its own language. */
  readonly languages = input<readonly ShellLanguage[]>([]);
  /** The active language code. */
  readonly language = input('');
  /** The dark design is in effect. */
  readonly dark = input(false);

  /** A language was chosen (a code of `languages`, never the active one). */
  readonly languageChange = output<string>();
  /** The dark design switch changed. */
  readonly darkChange = output<boolean>();
  /** "Sign out" was pressed; the popover is already closed. */
  readonly logout = output<void>();
  /** A link was followed: the sheet that holds the inline menu closes. */
  readonly navigated = output<void>();

  readonly open = signal(false);
  /** Fixed position of the popover: beside the rail, bottom-aligned with the avatar. */
  readonly position = signal({ left: 0, bottom: 0 });

  /** The variant in effect. */
  readonly look = computed<'popover' | 'sheet'>(() => {
    const v = this.variant();
    if (v === 'auto') return this.phone() ? 'sheet' : 'popover';
    return v;
  });

  protected readonly options = computed<FilterSelectOption[]>(() =>
    this.languages().map((l) => ({ value: l.value, label: l.label })),
  );
  /** The chip shows the name of the active language. */
  protected readonly languageName = computed(
    () => this.languages().find((l) => l.value === this.language())?.label ?? this.language(),
  );

  protected readonly panelId = `account-menu-${nextId++}`;
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  /** The panel renders in this change detection, so its first control gets the focus right after. */
  show(): void {
    const trigger = this.trigger()!.nativeElement;
    const rect = trigger.getBoundingClientRect();
    const edge = trigger.closest('nav')?.getBoundingClientRect().right ?? rect.right;
    this.position.set({
      left: edge + GAP,
      bottom: Math.max(GAP, window.innerHeight - rect.bottom),
    });
    this.open.set(true);
    setTimeout(() => this.panel()?.nativeElement.querySelector<HTMLElement>('a, button')?.focus());
  }

  /** Close the popover. `restoreFocus` puts the focus back on the avatar. */
  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.trigger()?.nativeElement.focus();
  }

  /** A click in the slot of the app: a followed link closes the menu. */
  onItemsClick(event: Event): void {
    if ((event.target as Element | null)?.closest('a')) this.onNavigate();
  }

  /** A link in the menu was followed. */
  onNavigate(): void {
    this.close();
    this.navigated.emit();
  }

  protected chooseLanguage(value: string): void {
    if (value && value !== this.language()) this.languageChange.emit(value);
  }

  protected signOut(): void {
    this.close();
    this.logout.emit();
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

  /** The focus moved out of the menu: close it, and leave the focus where it went. */
  @HostListener('document:focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  /** The popover keeps the position from when it opened; after a resize that is stale. */
  @HostListener('window:resize')
  onResize(): void {
    this.close();
  }
}
