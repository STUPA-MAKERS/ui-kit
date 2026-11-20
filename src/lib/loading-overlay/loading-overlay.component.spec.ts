import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { UI_KIT_LOADING } from '../loading/loading.token';
import { LoadingOverlayComponent } from './loading-overlay.component';

describe('LoadingOverlayComponent', () => {
  /** § NF/accessibility/conformance/000493: hidden and shown; shown is a polite status. */
  it.each([false, true])('has no axe violations (visible %s)', async (visible) => {
    const { container } = await render(LoadingOverlayComponent, {
      providers: [{ provide: UI_KIT_LOADING, useValue: { visible: signal(visible) } }],
    });
    expect(screen.queryAllByRole('status')).toHaveLength(visible ? 1 : 0);
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
