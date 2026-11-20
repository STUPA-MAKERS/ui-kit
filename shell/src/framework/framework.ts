import {
  computed,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Signal,
} from '@angular/core';
import type { Observable } from 'rxjs';
import {
  DefaultUiKitIntl,
  UI_KIT_INTL,
  UI_KIT_THEME,
  uiKitThemeConfig,
  type Action,
  type DisplayChoices,
  type IconName,
  type PersonRef,
  type RouteLink,
  type UiKitIntl,
  type UiKitTextKey,
} from '@stupa-makers/ui-kit';

import type { ShellLanguage, ShellNavItem } from '../shell.types';

/** One hit of the search port. §S/framework/shell/002261 */
export interface SearchHit {
  readonly kind: string;
  readonly title: string;
  readonly sub?: string;
  readonly icon: IconName;
  readonly link: RouteLink;
}

/** The ports through which app data reaches the shell. §S/framework/shell/002261 */
export interface FrameworkPorts {
  readonly session: {
    readonly frame: Signal<'rail' | 'public' | 'pending'>;
    readonly person: Signal<PersonRef | null>;
    logout(): void;
  };
  /** Runs for 2 characters and more. */
  readonly search?: (q: string) => Observable<readonly SearchHit[]>;
  readonly avatar?: (person: PersonRef) => string | null;
  /** A key gives a mark, never a count. */
  readonly navMarks?: Signal<Record<string, 'new' | 'warn' | null>>;
  readonly report?: (r: { readonly kind: 'barrier' | 'problem'; readonly text: string; readonly page: string }) => Promise<void>;
  readonly upload?: (file: File) => Promise<{ readonly url: string; readonly name: string }>;
  readonly live?: Signal<'online' | 'reconnecting' | 'offline'>;
  readonly display?: {
    load(): Promise<DisplayChoices | null>;
    save(p: DisplayChoices): Promise<void>;
  };
}

/** The one config of an app. §S/framework/shell/002260 */
export interface FrameworkConfig {
  readonly brand: {
    readonly name: string;
    readonly home: string;
    readonly mark: string | { readonly light: string; readonly dark: string };
    readonly accent?: string;
    readonly favicon?: string;
  };
  readonly nav: Signal<readonly ShellNavItem[]>;
  readonly account?: { readonly items: Signal<readonly Action[]> };
  readonly help?: { readonly items: Signal<readonly Action[]>; readonly wikiUrl?: string };
  readonly footer?: { readonly links: readonly { readonly label: string; readonly link: RouteLink }[] };
  readonly a11yStatement: RouteLink;
  readonly languages: readonly ShellLanguage[];
  /** Overrides of the kit texts, by `kit.<key>` (002223). */
  readonly texts?: Signal<Record<string, string>>;
  readonly theme: {
    readonly storageKey: string;
    readonly manifest?: Record<'light' | 'dark', string>;
  };
  readonly ports: FrameworkPorts;
}

/** The config that `provideFramework()` registers. */
export const FRAMEWORK = new InjectionToken<FrameworkConfig>('FRAMEWORK');

/** Return the config of the app. §S/framework/shell/002260 */
export function injectFramework(): FrameworkConfig {
  return inject(FRAMEWORK);
}

/**
 * Wrap a kit intl so that an override `kit.<key>` of the app wins over the kit text.
 * §S/framework/texts/002223
 */
export function withTextOverrides(
  base: UiKitIntl,
  texts: Signal<Record<string, string>> | undefined,
): UiKitIntl {
  if (!texts) return base;
  return {
    lang: base.lang,
    formatLocale: base.formatLocale,
    translate: (key: UiKitTextKey, params?: Record<string, string | number>): string => {
      const override = texts()[`kit.${key}`];
      if (override === undefined) return base.translate(key, params);
      return params
        ? override.replace(/\{(\w+)\}/g, (match, name: string) =>
            name in params ? String(params[name]) : match,
          )
        : override;
    },
  };
}

/**
 * Register the app config, the kit texts and the theme settings. It replaces `provideUiKit()`.
 * §S/framework/shell/002260
 */
export function provideFramework(config: FrameworkConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FRAMEWORK, useValue: config },
    {
      provide: UI_KIT_INTL,
      useFactory: (): UiKitIntl => withTextOverrides(new DefaultUiKitIntl(), config.texts),
    },
    {
      provide: UI_KIT_THEME,
      useValue: uiKitThemeConfig({
        storageKey: config.theme.storageKey,
        ...(config.theme.manifest ? { manifest: config.theme.manifest } : {}),
      }),
    },
  ]);
}

/** The parts of the shell that the config shows; a part without its field or port is hidden. */
export function frameworkParts(config: FrameworkConfig): Signal<{
  readonly search: boolean;
  readonly help: boolean;
  readonly account: boolean;
  readonly footer: boolean;
  readonly report: boolean;
}> {
  return computed(() => ({
    search: config.ports.search !== undefined,
    help: (config.help?.items().length ?? 0) > 0,
    account: config.ports.session.person() !== null,
    footer: (config.footer?.links.length ?? 0) > 0,
    report: config.ports.report !== undefined,
  }));
}
