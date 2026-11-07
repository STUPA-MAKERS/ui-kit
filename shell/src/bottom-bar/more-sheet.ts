import { Injectable } from '@angular/core';

/**
 * The "More" sheet of the phone bar, for the content an app puts into it. The content of a
 * slot belongs to the template of the app, so it cannot inject the bar. It injects this
 * handle and calls `close()`, for example after an action that a click alone does not
 * finish.
 */
@Injectable({ providedIn: 'root' })
export class ShellMoreSheet {
  private closers: ReadonlySet<() => void> = new Set();

  /** Closes the "More" sheet of every bottom bar. */
  close(): void {
    for (const close of this.closers) close();
  }

  /** Called by the bottom bar. Returns the function that removes the closer. */
  register(close: () => void): () => void {
    this.closers = new Set([...this.closers, close]);
    return () => {
      this.closers = new Set([...this.closers].filter((c) => c !== close));
    };
  }
}
