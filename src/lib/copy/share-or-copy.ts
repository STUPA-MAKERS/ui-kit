import { MEDIA } from '../breakpoints/breakpoints';
import { matchesMedia } from '../signals/media-query';
import { copyText } from './copy-text';

/** A link to hand on: the URL and, for the share sheet, a title. */
export interface ShareLink {
  url: string;
  title?: string;
}

/**
 * What became of a link:
 * - `shared`: the native share sheet took it.
 * - `cancelled`: the person closed the share sheet. Not an error, so no message.
 * - `copied`: it is on the clipboard (no share sheet, or the sheet failed).
 * - `failed`: neither worked; the caller shows its own failure.
 */
export type ShareOutcome = 'shared' | 'cancelled' | 'copied' | 'failed';

function shareData(link: ShareLink): ShareData {
  return link.title ? { url: link.url, title: link.title } : { url: link.url };
}

/**
 * True when the device offers the native share sheet for the link: the Web Share API is
 * there and the primary pointer is a finger. A desktop browser with the API (Safari,
 * Edge) keeps the copy, because there the clipboard is what a person expects.
 */
export function canShareNatively(link: ShareLink): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (!matchesMedia(MEDIA.coarse)) return false;
  return navigator.canShare?.(shareData(link)) ?? true;
}

function copy(url: string): Promise<ShareOutcome> {
  return copyText(url).then((ok) => (ok ? 'copied' : 'failed'));
}

function cancelled(error: unknown): boolean {
  return (error as { name?: unknown } | null)?.name === 'AbortError';
}

/**
 * Hand on a link: on a touch device with the Web Share API through the native share
 * sheet, else by the clipboard. A share that fails for another reason than a cancel (no
 * user gesture, a refused type) falls back to the clipboard.
 *
 * Call it directly in the click handler, before any other `await`: the browser opens the
 * share sheet only during the user gesture. The handlers go on the promise with `then`,
 * for the same reason as in `copyText` (zone.js and unhandled rejections).
 */
export function shareOrCopy(link: ShareLink): Promise<ShareOutcome> {
  if (!canShareNatively(link)) return copy(link.url);
  let shared: Promise<void>;
  try {
    shared = navigator.share(shareData(link));
  } catch (error) {
    return cancelled(error) ? Promise.resolve('cancelled') : copy(link.url);
  }
  return shared.then(
    (): ShareOutcome => 'shared',
    (error: unknown) => (cancelled(error) ? 'cancelled' : copy(link.url)),
  );
}
