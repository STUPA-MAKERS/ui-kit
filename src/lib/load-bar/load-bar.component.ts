import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { UI_KIT_LOADING } from '../loading/loading.token';

/**
 * The global loading signal: a thin bar at the top edge of the page while a read runs.
 * Put it once in the shell of the app.
 *
 * It is the quiet alternative to `app-loading-overlay`. An overlay covers the skeletons and
 * the old content that a page keeps while it reloads, so a load that is built to stay
 * still flashes grey. The bar moves nothing and blocks nothing; the page itself shows what
 * is loading. A status region tells a screen reader that a load runs ("loading" of
 * `UI_KIT_INTL`).
 *
 * The {@link UI_KIT_LOADING} token decides when it shows. By default that is the kit's
 * `LoadingService`, fed by `loadingInterceptor`.
 */
@Component({
  selector: 'app-load-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe],
  templateUrl: './load-bar.component.html',
  styleUrl: './load-bar.component.scss',
})
export class LoadBarComponent {
  protected readonly loading = inject(UI_KIT_LOADING);
}
