import { TestBed } from '@angular/core/testing';
import { PageFrame } from './page-frame';

describe('PageFrame', () => {
  it('is one shared instance whose fill starts off', () => {
    const frame = TestBed.inject(PageFrame);
    expect(frame.fill()).toBe(false);
    frame.fill.set(true);
    expect(TestBed.inject(PageFrame).fill()).toBe(true);
  });
});
