import { Pipe, type PipeTransform, inject } from '@angular/core';
import { UI_KIT_INTL, type UiKitTextKey } from './intl';

/**
 * `{{ 'dialog.close' | uiKitT }}` — impure so a language switch propagates immediately
 * (the active language is a signal on the {@link UiKitIntl}).
 */
@Pipe({ name: 'uiKitT', standalone: true, pure: false })
export class UiKitTranslatePipe implements PipeTransform {
  private readonly intl = inject(UI_KIT_INTL);

  transform(key: UiKitTextKey, params?: Record<string, string | number>): string {
    return this.intl.translate(key, params);
  }
}
