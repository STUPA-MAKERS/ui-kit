/** The controls that a failed submit can send the focus to. */
const INVALID_CONTROL = [
  'input[aria-invalid="true"]',
  'select[aria-invalid="true"]',
  'textarea[aria-invalid="true"]',
  'button[aria-invalid="true"]',
  '[role="combobox"][aria-invalid="true"]',
  '[tabindex][aria-invalid="true"]',
].join(',');

/**
 * After a failed submit: move the focus to the first control in `root` that shows an error
 * (`aria-invalid="true"`) and scroll it to the middle of the view (spec 000519). Its error
 * text is linked with `aria-describedby`, so a screen reader reads the error with the
 * field. Returns the control, or null when no control in `root` shows an error.
 *
 * Call it after the form drew the errors (the next macrotask after `markAllAsTouched`).
 */
export function focusFirstInvalid(root: ParentNode): HTMLElement | null {
  const control = Array.from(root.querySelectorAll<HTMLElement>(INVALID_CONTROL)).find(
    (el) => !el.hasAttribute('disabled') && !el.closest('[hidden], [inert]'),
  );
  if (!control) return null;
  control.focus({ preventScroll: true });
  control.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  return control;
}

/**
 * Show the first error in `root` after a failed submit: focus the first control in error,
 * or, without one (an error of the whole form), scroll its error text (`role="alert"`) into
 * view. A missing root does nothing.
 */
export function revealFirstInvalid(root: ParentNode | null): void {
  if (!root || focusFirstInvalid(root)) return;
  root.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
}
