/**
 * A short vibration as the feedback of a touch gesture. Only Android browsers have the
 * Vibration API; iOS and a desktop have none, and there the call does nothing. A browser
 * that blocks the call (no user gesture yet, a cross-origin frame) returns false or
 * throws, and the gesture works on without the feedback.
 *
 * - `tick`: a long press fires, a drag passes a threshold (10 ms).
 * - `lift`: a card lifts to move with the finger (15 ms).
 * - `success`: an action that counts went through, for example a cast vote (two pulses).
 */
export type HapticKind = 'tick' | 'lift' | 'success';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tick: 10,
  lift: 15,
  success: [12, 60, 18],
};

export function haptic(kind: HapticKind = 'tick'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Feedback only: a refused vibration must not break the gesture.
  }
}
