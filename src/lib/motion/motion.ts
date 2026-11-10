import { MEDIA } from '../breakpoints/breakpoints';
import { matchesMedia } from '../signals/media-query';

/**
 * True when the person asks for reduced motion. The `DisplaySettingsService` writes the
 * setting in effect (the system setting or the choice of the person) to `data-motion` on
 * `<html>`. Without that attribute the system setting applies.
 */
export function reducedMotion(): boolean {
  const motion = document.documentElement.getAttribute('data-motion');
  if (motion !== null) return motion === 'reduce';
  return matchesMedia(MEDIA.reducedMotion);
}

type TransitionDocument = Document & { readonly startViewTransition?: (update: () => void) => unknown };

/**
 * Run a change of the whole page (for example the theme) as one cross-fade, so the
 * surfaces do not change colour one by one. Without the View Transitions API or with
 * reduced motion the change happens at once.
 */
export function withViewTransition(update: () => void): void {
  const doc = document as TransitionDocument;
  if (typeof doc.startViewTransition !== 'function' || reducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(update);
}
