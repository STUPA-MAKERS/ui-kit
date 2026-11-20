/**
 * Read the layout in the next animation frame, together with the other reads of that
 * frame, and write after all of them (app spec 002161).
 *
 * All the reads of a frame run first, then all the writes, in the order they were asked
 * for. The browser then lays out the page at most once for the reads, however many parts
 * of the page measure. Reason: each part had its own `requestAnimationFrame`, and a read
 * after the write of another part made the browser lay out the whole page again, several
 * times per frame while a new page came in.
 *
 * `read` gets nothing and returns what `write` needs; `write` may change the DOM. Call
 * the returned function to drop the request (a part that goes away). A second request
 * of a part in the same frame is the part's job to skip (see `frameReader`).
 */
export function frameRead<T>(read: () => T, write?: (value: T) => void): () => void {
  return queue.add({ read, write: write as ((value: unknown) => void) | undefined });
}

/**
 * A part's request for the next frame, at most one at a time: a second `schedule()` before
 * the frame does nothing. `cancel()` drops a waiting request.
 */
export function frameReader<T>(
  read: () => T,
  write?: (value: T) => void,
): { schedule(): void; cancel(): void } {
  return new FrameReader(read, write);
}

interface Job {
  readonly read: () => unknown;
  readonly write: ((value: unknown) => void) | undefined;
}

/** The requests of the next frame. */
class FrameQueue {
  private jobs: readonly Job[] = [];
  private frame = 0;

  add(job: Job): () => void {
    this.jobs = [...this.jobs, job];
    if (!this.frame) this.frame = requestAnimationFrame(() => this.flush());
    return () => {
      this.jobs = this.jobs.filter((j) => j !== job);
    };
  }

  private flush(): void {
    this.frame = 0;
    const jobs = this.jobs;
    this.jobs = [];
    const values = jobs.map((j) => j.read());
    jobs.forEach((j, i) => j.write?.(values[i]));
  }
}

class FrameReader<T> {
  private drop: (() => void) | null = null;

  constructor(
    private readonly read: () => T,
    private readonly write?: (value: T) => void,
  ) {}

  schedule(): void {
    if (this.drop) return;
    this.drop = frameRead(
      () => {
        this.drop = null;
        return this.read();
      },
      this.write,
    );
  }

  cancel(): void {
    this.drop?.();
    this.drop = null;
  }
}

const queue = new FrameQueue();
