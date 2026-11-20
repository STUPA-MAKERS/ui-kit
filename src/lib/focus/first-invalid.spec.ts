import { focusFirstInvalid, revealFirstInvalid } from './first-invalid';

describe('focusFirstInvalid', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the first shown control with an error and skips hidden or disabled ones', () => {
    document.body.innerHTML = `
      <form id="f">
        <div hidden><input id="hidden" aria-invalid="true" /></div>
        <input id="ok" />
        <input id="off" aria-invalid="true" disabled />
        <textarea id="first" aria-invalid="true"></textarea>
        <select id="second" aria-invalid="true"></select>
      </form>`;
    const found = focusFirstInvalid(document.getElementById('f')!);
    expect(found?.id).toBe('first');
    expect(document.activeElement?.id).toBe('first');
  });

  it('returns null and leaves the focus when no control shows an error', () => {
    document.body.innerHTML = '<form id="f"><input id="a" /></form><button id="b">B</button>';
    document.getElementById('b')!.focus();
    expect(focusFirstInvalid(document.getElementById('f')!)).toBeNull();
    expect(document.activeElement?.id).toBe('b');
  });

  it('reveals the first control in error, else the error text, and ignores a missing root', () => {
    document.body.innerHTML = '<form id="f"><p role="alert">Fehler</p><input id="a" aria-invalid="true" /></form>';
    const alert = document.querySelector<HTMLElement>('[role="alert"]')!;
    const scroll = jest.fn();
    alert.scrollIntoView = scroll;
    revealFirstInvalid(document.getElementById('f'));
    expect(document.activeElement?.id).toBe('a');
    expect(scroll).not.toHaveBeenCalled();
    document.getElementById('a')!.removeAttribute('aria-invalid');
    revealFirstInvalid(document.getElementById('f'));
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(() => revealFirstInvalid(null)).not.toThrow();
    document.body.innerHTML = '<form id="g"></form>';
    expect(() => revealFirstInvalid(document.getElementById('g'))).not.toThrow();
  });
});
