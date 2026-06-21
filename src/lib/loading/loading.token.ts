import { InjectionToken, type Signal, signal } from '@angular/core';

/** Minimal contract {@link LoadingOverlayComponent} needs from a host loading service. */
export interface UiKitLoadingState {
  /** True while the global loading overlay should be visible. */
  readonly visible: Signal<boolean>;
}

const NEVER_VISIBLE: UiKitLoadingState = { visible: signal(false).asReadonly() };

/**
 * DI token feeding the loading overlay. Defaults to never-visible (no-op); the host app
 * provides one delegating to its own loading service, e.g.
 * `{ provide: UI_KIT_LOADING, useFactory: () => ({ visible: inject(LoadingService).visible }) }`.
 */
export const UI_KIT_LOADING = new InjectionToken<UiKitLoadingState>('UI_KIT_LOADING', {
  providedIn: 'root',
  factory: () => NEVER_VISIBLE,
});
