import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FocusDialogDirective } from './focus-dialog.directive';

@Component({
  standalone: true,
  imports: [FocusDialogDirective],
  template: `
    <button id="opener" (click)="open.set(true)">Open</button>
    <button id="other">Other</button>
    @if (open()) {
      <div id="pop" role="dialog" appFocusDialog [appFocusDialogStart]="start()">
        @if (controls()) {
          <button id="a">A</button>
          <button id="b">B</button>
        } @else {
          <p>Text</p>
        }
      </div>
    }
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly controls = signal(true);
  readonly start = signal<'first' | 'self' | 'none'>('first');
}

function setup(): { host: HostComponent; render: () => void; el: (id: string) => HTMLElement | null } {
  const fixture = TestBed.createComponent(HostComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  const el = (id: string): HTMLElement | null => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`);
  return { host: fixture.componentInstance, render: () => fixture.detectChanges(), el };
}

function tab(target: HTMLElement, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('FocusDialogDirective', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('moves the focus to the first control on open and back to the opener on close', () => {
    const { host, render, el } = setup();
    el('opener')!.focus();
    host.open.set(true);
    render();
    expect(document.activeElement?.id).toBe('a');
    host.open.set(false);
    render();
    expect(document.activeElement?.id).toBe('opener');
  });

  it('keeps Tab and Shift+Tab inside', () => {
    const { host, render, el } = setup();
    el('opener')!.focus();
    host.open.set(true);
    render();
    el('b')!.focus();
    expect(tab(el('b')!).defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
    expect(tab(el('a')!, true).defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('b');
  });

  it('focuses the element itself when it has no control, or when asked to', () => {
    const { host, render, el } = setup();
    host.controls.set(false);
    host.open.set(true);
    render();
    expect(document.activeElement?.id).toBe('pop');
    expect(el('pop')!.getAttribute('tabindex')).toBe('-1');
    host.open.set(false);
    host.controls.set(true);
    host.start.set('self');
    render();
    host.open.set(true);
    render();
    expect(document.activeElement?.id).toBe('pop');
  });

  it('leaves the open focus to the host when asked to, and still restores it', () => {
    const { host, render, el } = setup();
    el('opener')!.focus();
    host.start.set('none');
    host.open.set(true);
    render();
    expect(document.activeElement?.id).toBe('opener');
    el('b')!.focus();
    host.open.set(false);
    render();
    expect(document.activeElement?.id).toBe('opener');
  });

  it('leaves a focus that the close moved on purpose', () => {
    const { host, render, el } = setup();
    el('opener')!.focus();
    host.open.set(true);
    render();
    el('other')!.focus();
    host.open.set(false);
    render();
    expect(document.activeElement?.id).toBe('other');
  });

  it('ignores a key that a control inside already handled', () => {
    const { host, render, el } = setup();
    host.open.set(true);
    render();
    el('b')!.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    event.preventDefault();
    el('b')!.dispatchEvent(event);
    expect(document.activeElement?.id).toBe('b');
  });
});
