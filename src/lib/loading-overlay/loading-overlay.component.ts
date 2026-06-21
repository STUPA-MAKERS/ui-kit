import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { UI_KIT_LOADING } from '../loading/loading.token';

/**
 * Globaler Ladebildschirm: halbtransparenter Overlay über dem Inhaltsbereich
 * (unterhalb des Headers) mit zentriertem Spinner, gesteuert über den
 * {@link UI_KIT_LOADING}-Token (vom Host an seinen Lade-Service gebunden).
 * Header/Navigation bleiben bedienbar. Liegt unter Dialogen/Toasts (z-index),
 * damit diese darüber sichtbar bleiben.
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {
  protected readonly loading = inject(UI_KIT_LOADING);
}
