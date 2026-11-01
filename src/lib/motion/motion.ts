import { MEDIA } from '../breakpoints/breakpoints';
import { matchesMedia } from '../signals/media-query';

/** True when the person asks the system for reduced motion. */
export function reducedMotion(): boolean {
  return matchesMedia(MEDIA.reducedMotion);
}

type TransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

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
