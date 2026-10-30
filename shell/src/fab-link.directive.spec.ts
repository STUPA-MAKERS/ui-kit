import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FabComponent } from '@stupa-makers/ui-kit';
import { FabLinkDirective } from './fab-link.directive';

@Component({ standalone: true, template: '' })
class Stub {}

describe('FabLinkDirective', () => {
  it('opens the route and still emits activate', async () => {
    const activate = jest.fn();
    await render(
      `<app-fab icon="plus" label="Neuer Antrag" link="/apply?draft=1" (activate)="activate()" />`,
      {
        imports: [FabComponent, FabLinkDirective],
        componentProperties: { activate },
        providers: [provideRouter([{ path: 'apply', component: Stub }])],
      },
    );
    const router = TestBed.inject(Router);
    const go = jest.spyOn(router, 'navigateByUrl');
    await userEvent.click(screen.getByRole('button', { name: 'Neuer Antrag' }));
    expect(go).toHaveBeenCalledWith('/apply?draft=1');
    expect(activate).toHaveBeenCalledTimes(1);
  });
});
