import { type Signal, computed } from '@angular/core';
import { MEDIA, type WidthClass, mediaQuery } from '@stupa-makers/ui-kit';

/**
 * The width class of the viewport as a signal, for a screen that places its parts by width
 * (S/framework/types/002231). Call it in an injection context.
 */
export function injectWidthClass(): Signal<WidthClass> {
  const phone = mediaQuery(MEDIA.phone);
  const wide = mediaQuery(MEDIA.wide);
  return computed<WidthClass>(() => (phone() ? 'phone' : wide() ? 'wide' : 'narrow'));
}
