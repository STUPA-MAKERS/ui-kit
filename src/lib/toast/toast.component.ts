import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { ToastService } from './toast.service';

/**
 * Toast-Container — einmal im Shell-Layout platziert.
 *
 * The stack is no live region: `ToastService` reads each toast out once through the
 * `Announcer` (spec 000517). A new toast closes and opens the stack popover to raise it,
 * and a screen reader can drop a message of a region that leaves the page and comes back.
 *
 * A dialog opens in the top layer, so the stack is in the top layer too, from the first
 * render on. A new toast raises the stack
 * above a dialog that opened after it, so a toast about a dialog shows above that dialog.
 * An empty stack has no size and takes no press.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe, IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  private readonly stack = viewChild<ElementRef<HTMLElement>>('stack');

  constructor() {
    afterRenderEffect(() => {
      const count = this.toastService.stackToasts().length;
      const el = this.stack()?.nativeElement as
        | (HTMLElement & { showPopover?: () => void; hidePopover?: () => void })
        | undefined;
      if (!el || typeof el.showPopover !== 'function' || typeof el.hidePopover !== 'function') return;
      let open = false;
      try {
        open = el.matches(':popover-open');
      } catch {
        // The engine does not know the selector (jsdom, old browsers).
      }
      if (open && count === 0) return;
      if (open) el.hidePopover();
      el.showPopover();
    });
  }
}
