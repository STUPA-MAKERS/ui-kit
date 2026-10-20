import { MEDIA } from '../breakpoints/breakpoints';
import { mediaMatching } from '../../../testing/touch';
import {
  VelocityTracker,
  markGestureNavigation,
  modalOpen,
  motionMs,
  motionReduced,
  opaqueBackground,
  takeGestureNavigation,
  touchGesturesOn,
} from './gesture';

describe('gesture helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('turns the gestures on for a phone with a coarse pointer only', () => {
    mediaMatching([MEDIA.phone, MEDIA.coarse]);
    expect(touchGesturesOn()).toBe(true);
    mediaMatching([MEDIA.phone]);
    expect(touchGesturesOn()).toBe(false);
    mediaMatching([MEDIA.coarse, MEDIA.reducedMotion]);
    expect(touchGesturesOn()).toBe(false);
    expect(motionReduced()).toBe(true);
  });

  it('finds an open modal layer', () => {
    expect(modalOpen()).toBe(false);
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);
    expect(modalOpen()).toBe(true);
    dialog.remove();
  });

  it('does not count the modal layer that holds the element of the gesture', () => {
    const drawer = document.createElement('aside');
    drawer.setAttribute('aria-modal', 'true');
    const panel = document.createElement('div');
    drawer.appendChild(panel);
    document.body.appendChild(drawer);
    expect(modalOpen(document, panel)).toBe(false);
    expect(modalOpen(document, document.body)).toBe(true);
    // A second layer over the drawer (a sheet opened from it) blocks again.
    const sheet = document.createElement('div');
    sheet.setAttribute('aria-modal', 'true');
    document.body.appendChild(sheet);
    expect(modalOpen(document, panel)).toBe(true);
    drawer.remove();
    sheet.remove();
  });

  it('reads a motion token in ms or s, else the fallback', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--a', '120ms');
    el.style.setProperty('--b', '0.3s');
    el.style.setProperty('--c', '90');
    expect(motionMs(el, '--a', 1)).toBe(120);
    expect(motionMs(el, '--b', 1)).toBe(300);
    expect(motionMs(el, '--c', 1)).toBe(90);
    expect(motionMs(el, '--none', 7)).toBe(7);
  });

  it('finds the first background that is not transparent', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.style.backgroundColor = 'rgb(1, 2, 3)';
    inner.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    outer.appendChild(inner);
    document.body.appendChild(outer);
    expect(opaqueBackground(inner)).toBe('rgb(1, 2, 3)');
    expect(opaqueBackground(document.createElement('span'))).toBe('var(--color-bg)');
    expect(opaqueBackground(null)).toBe('var(--color-bg)');
  });

  it('counts a marked navigation once and only for a second', () => {
    markGestureNavigation(1000);
    expect(takeGestureNavigation(1500)).toBe(true);
    expect(takeGestureNavigation(1500)).toBe(false);
    markGestureNavigation(1000);
    expect(takeGestureNavigation(2500)).toBe(false);
  });

  it('measures the speed over the last 100 ms', () => {
    const v = new VelocityTracker();
    expect(v.velocity()).toBe(0);
    v.add(0, 0);
    v.add(10, 0);
    expect(v.velocity()).toBe(0);
    v.add(100, 200);
    v.add(150, 250);
    v.add(200, 300);
    // The samples older than 100 ms before the last one are gone: (200 - 100) / 100.
    expect(v.velocity()).toBe(1);
  });
});
