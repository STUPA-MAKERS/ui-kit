import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { ToastService } from './toast.service';

/**
 * The top bar of the toasts with `phonePlacement: 'top'` (for example the update notice of
 * the app, or the offline notice). Put it once at the top of the frame, in the flow of the page: `app-shell` of
 * `@stupa-makers/ui-kit/shell` does that. On a phone such a toast shows here as a
 * full-width bar, and the page moves down by the height of the bar. An `accent` bar has
 * the accent colour (`--toast-bar-accent-bg`, `--toast-bar-accent-fg`); a `danger` bar has
 * the danger colour (`--toast-bar-danger-bg`, `--toast-bar-danger-fg`) and sits above the
 * accent bars.
 * On a wider screen the bar is empty and the toast shows in the stack of `app-toast`.
 *
 * The bar opens and closes with `motion-expand-in` / `motion-expand-out` of `motion.scss`,
 * so the page slides instead of jumping, and reduced motion stops the slide. The top
 * padding includes the top safe area, so in the installed app the bar reaches under the
 * status bar.
 */
@Component({
  selector: 'app-toast-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe, IconComponent],
  templateUrl: './toast-bar.component.html',
  styleUrl: './toast-bar.component.scss',
})
export class ToastBarComponent {
  readonly toastService = inject(ToastService);

  constructor() {
    inject(DestroyRef).onDestroy(this.toastService.registerTopBar());
  }
}
