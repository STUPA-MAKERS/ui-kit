import { InjectionToken, type Signal, inject } from '@angular/core';
import { LoadingService } from './loading.service';

/** Minimal contract the load bar and the loading overlay need from a loading service. */
export interface UiKitLoadingState {
  /** True while the global loading bar or overlay should be visible. */
  readonly visible: Signal<boolean>;
}

/**
 * DI token that feeds `app-load-bar` and `app-loading-overlay`. It defaults to the kit's
 * {@link LoadingService}, which counts the GET requests that pass the
 * `loadingInterceptor`. Without the interceptor nothing counts, so the bar never shows.
 * A host app with a loading service of its own provides one that delegates to it, e.g.
 * `{ provide: UI_KIT_LOADING, useFactory: () => ({ visible: inject(MyLoadingService).visible }) }`.
 */
export const UI_KIT_LOADING = new InjectionToken<UiKitLoadingState>('UI_KIT_LOADING', {
  providedIn: 'root',
  factory: () => inject(LoadingService),
});
