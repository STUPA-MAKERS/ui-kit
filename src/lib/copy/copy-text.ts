/**
 * Put a text on the clipboard. The Clipboard API can be absent (an insecure origin, an
 * old browser) or refuse the write; both resolve to `false`, so a caller never needs a
 * try/catch and can show its own failure.
 *
 * The handlers go on the write promise at once with `then`. A native `await` on the
 * zone's promise attaches them a microtask later, and zone.js then reports the refused
 * write as an unhandled rejection.
 */
export function copyText(text: string): Promise<boolean> {
  const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
  if (!clipboard?.writeText) return Promise.resolve(false);
  try {
    return clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  } catch {
    return Promise.resolve(false);
  }
}
