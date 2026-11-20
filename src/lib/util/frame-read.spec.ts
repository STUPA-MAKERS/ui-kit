import { frameRead, frameReader } from './frame-read';

const nextFrame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()));

describe('frameRead', () => {
  it('runs all reads of a frame before any write, in one frame', async () => {
    const order: string[] = [];
    const frame = jest.spyOn(window, 'requestAnimationFrame');
    frameRead(
      () => order.push('read a'),
      () => order.push('write a'),
    );
    frameRead(
      () => order.push('read b'),
      () => order.push('write b'),
    );
    frameRead(() => order.push('read c'));
    expect(order).toEqual([]);
    expect(frame).toHaveBeenCalledTimes(1);
    frame.mockRestore();
    await nextFrame();
    expect(order).toEqual(['read a', 'read b', 'read c', 'write a', 'write b']);
  });

  it('hands the value of a read to its write and skips a dropped request', async () => {
    const seen: number[] = [];
    frameRead(
      () => 1,
      (v) => seen.push(v),
    );
    const drop = frameRead(
      () => 2,
      (v) => seen.push(v),
    );
    drop();
    await nextFrame();
    expect(seen).toEqual([1]);
  });
});

describe('frameReader', () => {
  it('asks for one frame however often it is scheduled, and again after the frame', async () => {
    let reads = 0;
    const reader = frameReader(() => ++reads);
    reader.schedule();
    reader.schedule();
    await nextFrame();
    expect(reads).toBe(1);
    reader.schedule();
    await nextFrame();
    expect(reads).toBe(2);
  });

  it('drops a waiting request on cancel', async () => {
    let reads = 0;
    const reader = frameReader(() => ++reads);
    reader.schedule();
    reader.cancel();
    reader.cancel();
    await nextFrame();
    expect(reads).toBe(0);
  });
});
