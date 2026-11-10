import { MEDIA } from '../breakpoints/breakpoints';
import { matchesMedia } from '../signals/media-query';

/**
 * True when the person asks for reduced motion. The `DisplaySettingsService` writes the
 * setting in effect (the system setting or the choice of the person) to
 * `data-display-motion` on `<html>`. Without that attribute the system setting applies.
 * `data-motion` is not this setting: it names a running route transition (`motion.scss`).
 */
export function reducedMotion(): boolean {
  const motion = document.documentElement.getAttribute('data-display-motion');
  if (motion !== null) return motion === 'reduce';
  return matchesMedia(MEDIA.reducedMotion);
}

/**
 * The behaviour of a scroll that a script starts: instant while the person asks for
 * reduced motion, smooth otherwise (app spec 000623).
 */
export function scrollBehavior(): ScrollBehavior {
  return reducedMotion() ? 'auto' : 'smooth';
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
