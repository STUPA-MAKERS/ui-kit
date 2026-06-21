import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { ToastService } from './toast.service';

/** Toast-Container — einmal im Shell-Layout platziert. ARIA-Live-Region. */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
