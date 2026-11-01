import { canShareNatively, shareOrCopy } from './share-or-copy';

const LINK = { url: 'https://example.org/j/ABC', title: 'Sitzung' };

/** Let `matchMedia` report a touch screen (or not). jsdom has none of its own. */
function touch(coarse: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: coarse && query === '(pointer: coarse)',
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

function stub(name: 'share' | 'canShare' | 'clipboard', value: unknown): void {
  Object.defineProperty(navigator, name, { configurable: true, value });
}

describe('shareOrCopy', () => {
  const realMatchMedia = window.matchMedia;
  let write: jest.Mock;

  beforeEach(() => {
    write = jest.fn().mockResolvedValue(undefined);
    stub('clipboard', { writeText: write });
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    for (const name of ['share', 'canShare', 'clipboard'] as const) stub(name, undefined);
  });

  it('opens the share sheet with the link and its title on a touch device', async () => {
    touch(true);
    const share = jest.fn().mockResolvedValue(undefined);
    stub('share', share);
    await expect(shareOrCopy(LINK)).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ url: LINK.url, title: 'Sitzung' });
    expect(write).not.toHaveBeenCalled();
    await shareOrCopy({ url: LINK.url });
    expect(share).toHaveBeenLastCalledWith({ url: LINK.url });
  });

  it('reports a closed share sheet as cancelled, without a copy', async () => {
    touch(true);
    stub('share', jest.fn().mockRejectedValue(new DOMException('closed', 'AbortError')));
    await expect(shareOrCopy(LINK)).resolves.toBe('cancelled');
    stub(
      'share',
      jest.fn(() => {
        throw new DOMException('closed', 'AbortError');
      }),
    );
    await expect(shareOrCopy(LINK)).resolves.toBe('cancelled');
    expect(write).not.toHaveBeenCalled();
  });

  it('copies when the share sheet fails for another reason', async () => {
    touch(true);
    stub('share', jest.fn().mockRejectedValue(new DOMException('no gesture', 'NotAllowedError')));
    await expect(shareOrCopy(LINK)).resolves.toBe('copied');
    stub(
      'share',
      jest.fn(() => {
        throw new TypeError('bad data');
      }),
    );
    await expect(shareOrCopy(LINK)).resolves.toBe('copied');
    expect(write).toHaveBeenCalledWith(LINK.url);
  });

  it('copies on a pointer device, without the API or when the data cannot be shared', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    touch(false);
    stub('share', share);
    expect(canShareNatively(LINK)).toBe(false);
    await expect(shareOrCopy(LINK)).resolves.toBe('copied');
    touch(true);
    stub('share', undefined);
    expect(canShareNatively(LINK)).toBe(false);
    stub('share', share);
    stub('canShare', () => false);
    expect(canShareNatively(LINK)).toBe(false);
    stub('canShare', () => true);
    expect(canShareNatively(LINK)).toBe(true);
    expect(share).not.toHaveBeenCalled();
  });

  it('reports a failed copy', async () => {
    write.mockRejectedValue(new Error('denied'));
    await expect(shareOrCopy(LINK)).resolves.toBe('failed');
  });
});
