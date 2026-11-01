import { reducedMotion, withViewTransition } from './motion';

const REDUCED = '(prefers-reduced-motion: reduce)';
const original = window.matchMedia;

function media(matches: Record<string, boolean>): void {
  (window.matchMedia as unknown) = jest.fn((q: string) => ({ matches: !!matches[q] }));
}

afterEach(() => {
  window.matchMedia = original;
});

describe('reducedMotion', () => {
  it('follows the system wish for less motion', () => {
    media({ [REDUCED]: true });
    expect(reducedMotion()).toBe(true);
    media({});
    expect(reducedMotion()).toBe(false);
  });

  it('is false without matchMedia', () => {
    (window.matchMedia as unknown) = undefined;
    expect(reducedMotion()).toBe(false);
  });
});

describe('withViewTransition', () => {
  const doc = document as Omit<Document, 'startViewTransition'> & { startViewTransition?: unknown };
  afterEach(() => delete doc.startViewTransition);

  it('runs the change at once without the API or matchMedia', () => {
    (window.matchMedia as unknown) = undefined;
    const update = jest.fn();
    withViewTransition(update);
    expect(update).toHaveBeenCalled();
  });

  it('runs the change at once with reduced motion', () => {
    media({ [REDUCED]: true });
    doc.startViewTransition = jest.fn();
    const update = jest.fn();
    withViewTransition(update);
    expect(update).toHaveBeenCalled();
    expect(doc.startViewTransition).not.toHaveBeenCalled();
  });

  it('hands the change to the View Transitions API', () => {
    media({});
    const start = jest.fn();
    doc.startViewTransition = start;
    const update = jest.fn();
    withViewTransition(update);
    expect(start).toHaveBeenCalledWith(update);
    expect(update).not.toHaveBeenCalled();
  });
});
