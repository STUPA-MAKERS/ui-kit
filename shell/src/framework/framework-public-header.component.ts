import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  ButtonGroupComponent,
  ButtonLinkComponent,
  FilterSelectComponent,
  ThemeService,
  UiKitTranslatePipe,
  type Action,
  type FilterSelectOption,
} from '@stupa-makers/ui-kit';

import { ShellMenuComponent } from '../shell-menu/shell-menu.component';
import { FRAMEWORK } from './framework';

type ThemedSrc = string | { readonly light: string; readonly dark: string };

/**
 * The top bar of the public frame: the wordmark (the mark on a phone), the language, the menus
 * "Barrierefreiheit" and "Hilfe", and the public actions of the config, for example "Anmelden".
 * The dark theme is the switch in "Barrierefreiheit", because one setting has one switch on a
 * screen (000593). The bar sticks to the top; it is solid in the page colour and ends in the
 * hairline of a scrolled head once content runs under it (002010).
 * §S/framework/shell/002263
 */
@Component({
  selector: 'app-framework-public-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    UiKitTranslatePipe,
    ButtonComponent,
    ButtonGroupComponent,
    ButtonLinkComponent,
    FilterSelectComponent,
    ShellMenuComponent,
  ],
  templateUrl: './framework-public-header.component.html',
  styleUrl: './framework-public-header.component.scss',
})
export class FrameworkPublicHeaderComponent {
  protected readonly config = inject(FRAMEWORK);
  private readonly theme = inject(ThemeService);

  /** An action or a help entry without a route was chosen: its key. */
  readonly action = output<string>();

  /** The page has scrolled, so content runs under the bar. */
  protected readonly under = signal(false);

  protected readonly helpItems = computed<readonly Action[]>(() => this.config.help?.items() ?? []);
  protected readonly headActions = computed<readonly Action[]>(
    () => this.config.publicHead?.actions() ?? [],
  );
  protected readonly languageOptions = computed<readonly FilterSelectOption[]>(() =>
    this.config.languages.map((l) => ({ value: l.value, label: l.label })),
  );

  protected readonly markSrc = computed(() => this.themed(this.config.brand.mark));
  protected readonly wordmarkSrc = computed(() =>
    this.themed(this.config.brand.wordmark ?? this.config.brand.mark),
  );

  constructor() {
    const state = { frame: 0 };
    const check = (): void => {
      state.frame = 0;
      this.under.set((document.scrollingElement?.scrollTop ?? window.scrollY) > 0);
    };
    const onScroll = (): void => {
      if (!state.frame) state.frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    state.frame = requestAnimationFrame(check);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      if (state.frame) cancelAnimationFrame(state.frame);
    });
  }

  private themed(src: ThemedSrc): string {
    return typeof src === 'string' ? src : src[this.theme.resolved()];
  }
}
