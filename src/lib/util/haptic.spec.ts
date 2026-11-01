import { haptic } from './haptic';

describe('haptic', () => {
  afterEach(() => {
    delete (navigator as { vibrate?: unknown }).vibrate;
  });

  function stubVibrate(impl: (pattern: VibratePattern) => boolean = () => true): jest.Mock {
    const vibrate = jest.fn(impl);
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    return vibrate;
  }

  it('vibrates a short pattern per kind, a tick by default', () => {
    const vibrate = stubVibrate();
    haptic();
    haptic('lift');
    haptic('success');
    expect(vibrate.mock.calls).toEqual([[10], [15], [[12, 60, 18]]]);
  });

  it('does nothing without the Vibration API', () => {
    expect(() => haptic('tick')).not.toThrow();
  });

  it('swallows a refused vibration', () => {
    stubVibrate(() => {
      throw new Error('blocked');
    });
    expect(() => haptic('success')).not.toThrow();
  });
});
