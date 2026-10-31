import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { LoadingService } from '../loading/loading.service';
import { UI_KIT_LOADING } from '../loading/loading.token';
import { LoadBarComponent } from './load-bar.component';

describe('LoadBarComponent', () => {
  async function setup(visible: boolean) {
    const state = signal(visible);
    const view = await render(LoadBarComponent, {
      providers: [{ provide: UI_KIT_LOADING, useValue: { visible: state.asReadonly() } }],
    });
    return { ...view, state };
  }

  it('draws nothing and says nothing while no load runs', async () => {
    const { container } = await setup(false);
    expect(container.querySelector('.lb')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('draws the bar and tells a screen reader while a load runs', async () => {
    const { container, state, fixture } = await setup(false);
    state.set(true);
    fixture.detectChanges();
    expect(container.querySelector('.lb')).not.toBeNull();
    expect(container.querySelector('.lb')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Wird geladen…');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('follows the kit loading service without a provider', () => {
    expect(TestBed.inject(UI_KIT_LOADING)).toBe(TestBed.inject(LoadingService));
  });
});
