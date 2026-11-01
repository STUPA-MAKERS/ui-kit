import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { nowSignal } from './now-signal';

const NOW = Date.parse('2026-10-06T16:00:00Z');

describe('nowSignal', () => {
  afterEach(() => jest.useRealTimers());

  it('ticks and stops with its host', () => {
    @Component({ selector: 'app-clock-host', standalone: true, template: '' })
    class Host {
      readonly now = nowSignal(1000);
    }
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const fixture = TestBed.createComponent(Host);
    const clock = fixture.componentInstance.now;
    expect(clock()).toBe(NOW);
    jest.advanceTimersByTime(1000);
    expect(clock()).toBe(NOW + 1000);
    fixture.destroy();
    jest.advanceTimersByTime(5000);
    expect(clock()).toBe(NOW + 1000);
  });

  it('ticks only while it is active', () => {
    const on = signal(false);
    @Component({ selector: 'app-gated-host', standalone: true, template: '' })
    class Host {
      readonly now = nowSignal(1000, on);
    }
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const clock = fixture.componentInstance.now;
    jest.advanceTimersByTime(3000);
    expect(clock()).toBe(NOW);
    on.set(true);
    fixture.detectChanges();
    expect(clock()).toBe(NOW + 3000);
    jest.advanceTimersByTime(1000);
    expect(clock()).toBe(NOW + 4000);
    on.set(false);
    fixture.detectChanges();
    jest.advanceTimersByTime(5000);
    expect(clock()).toBe(NOW + 4000);
    fixture.destroy();
  });
});
