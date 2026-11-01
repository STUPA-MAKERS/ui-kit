import { Component } from '@angular/core';
import { provideRouter, RouterLink } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { IconComponent } from '@stupa-makers/ui-kit';
import { runAxe } from '../../../testing/a11y';
import { AccountMenuComponent, type AccountMenuVariant } from './account-menu.component';

@Component({ standalone: true, template: '' })
class StubPage {}

const LANGUAGES = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

async function setup(opts: { variant?: AccountMenuVariant; dark?: boolean } = {}) {
  const events = {
    languageChange: jest.fn(),
    darkChange: jest.fn(),
    logout: jest.fn(),
    navigated: jest.fn(),
  };
  const view = await render(
    `<app-account-menu
      [variant]="variant"
      name="Mia Member"
      [languages]="languages"
      language="de"
      [dark]="dark"
      (languageChange)="languageChange($event)"
      (darkChange)="darkChange($event)"
      (logout)="logout()"
      (navigated)="navigated()"
    >
      <ng-container accountItems>
        <a class="am__item" routerLink="/account/notifications"><app-icon name="bell" [size]="19" />Benachrichtigungen</a>
      </ng-container>
    </app-account-menu>`,
    {
      imports: [AccountMenuComponent, RouterLink, IconComponent],
      providers: [provideRouter([{ path: '**', component: StubPage }])],
      componentProperties: {
        variant: opts.variant ?? 'popover',
        languages: LANGUAGES,
        dark: opts.dark ?? false,
        ...events,
      },
    },
  );
  const menu = view.fixture.debugElement.children[0].componentInstance as AccountMenuComponent;
  return { ...view, events, menu };
}

const trigger = () => screen.getByRole('button', { name: 'Konto: Mia Member' });

describe('AccountMenuComponent', () => {
  describe('popover', () => {
    it('shows the avatar with the initials and opens the menu on click', async () => {
      const { fixture } = await setup();
      expect(trigger()).toHaveTextContent('MM');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('Angemeldet als')).not.toBeInTheDocument();

      await userEvent.click(trigger());
      fixture.detectChanges();
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      const panel = screen.getByRole('region', { name: 'Konto' });
      expect(trigger()).toHaveAttribute('aria-controls', panel.id);
      expect(screen.getByText('Angemeldet als')).toBeInTheDocument();
      expect(screen.getByText('Mia Member')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Benachrichtigungen' })).toHaveAttribute(
        'href',
        '/account/notifications',
      );
      expect(await runAxe(document.body)).toHaveNoViolations();
    });

    it('closes again on a second click of the avatar', async () => {
      const { fixture } = await setup();
      await userEvent.click(trigger());
      fixture.detectChanges();
      await userEvent.click(trigger());
      fixture.detectChanges();
      expect(screen.queryByRole('region', { name: 'Konto' })).not.toBeInTheDocument();
    });

    it('closes on Escape and gives the focus back to the avatar', async () => {
      const { fixture } = await setup();
      await userEvent.click(trigger());
      fixture.detectChanges();
      await userEvent.keyboard('{Escape}');
      fixture.detectChanges();
      expect(screen.queryByRole('region', { name: 'Konto' })).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('closes on a click outside and stays open on a click inside', async () => {
      const { fixture } = await setup();
      await userEvent.click(trigger());
      fixture.detectChanges();
      await userEvent.click(screen.getByText('Angemeldet als'));
      fixture.detectChanges();
      expect(screen.getByRole('region', { name: 'Konto' })).toBeInTheDocument();
      await userEvent.click(document.body);
      fixture.detectChanges();
      expect(screen.queryByRole('region', { name: 'Konto' })).not.toBeInTheDocument();
    });

    it('closes when the focus leaves it, and leaves the focus where it went', async () => {
      const { fixture, container, menu } = await setup();
      const after = document.createElement('a');
      after.href = '#after';
      after.textContent = 'Danach';
      container.parentElement!.appendChild(after);
      await userEvent.click(trigger());
      fixture.detectChanges();
      screen.getByRole('button', { name: 'Abmelden' }).focus();
      expect(menu.open()).toBe(true);
      await userEvent.tab();
      fixture.detectChanges();
      expect(menu.open()).toBe(false);
      expect(after).toHaveFocus();
      after.remove();
    });

    it('closes when the window is resized', async () => {
      const { fixture } = await setup();
      await userEvent.click(trigger());
      fixture.detectChanges();
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();
      expect(screen.queryByRole('region', { name: 'Konto' })).not.toBeInTheDocument();
    });

    it('closes and reports when a link of the app is followed', async () => {
      const { fixture, events } = await setup();
      await userEvent.click(trigger());
      fixture.detectChanges();
      await userEvent.click(screen.getByRole('link', { name: 'Benachrichtigungen' }));
      fixture.detectChanges();
      expect(screen.queryByRole('region', { name: 'Konto' })).not.toBeInTheDocument();
      expect(events.navigated).toHaveBeenCalledTimes(1);
    });

    it('places the menu beside the navigation that holds the avatar', async () => {
      const { fixture, container } = await setup();
      const nav = document.createElement('nav');
      container.parentElement!.appendChild(nav);
      nav.appendChild(container);
      jest.spyOn(nav, 'getBoundingClientRect').mockReturnValue({ right: 96 } as DOMRect);
      jest.spyOn(trigger(), 'getBoundingClientRect').mockReturnValue({
        right: 70,
        bottom: window.innerHeight - 16,
      } as DOMRect);
      await userEvent.click(trigger());
      fixture.detectChanges();
      const panel = screen.getByRole('region', { name: 'Konto' });
      expect(panel.style.left).toBe('104px');
      expect(panel.style.bottom).toBe('16px');
      nav.remove();
    });
  });

  describe('settings', () => {
    it('reports the dark design switch', async () => {
      const { events } = await setup({ variant: 'sheet' });
      const sw = screen.getByRole('switch', { name: 'Dunkles Design' });
      expect(sw).toHaveAttribute('aria-checked', 'false');
      await userEvent.click(sw);
      expect(events.darkChange).toHaveBeenCalledWith(true);
    });

    it('names each language in its own language in the app list, and reports a choice', async () => {
      const { events } = await setup({ variant: 'sheet' });
      expect(document.querySelector('select')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Sprache: Deutsch' }));
      const options = screen.getAllByRole('option');
      expect(options.map((o) => o.textContent?.trim())).toEqual(['Deutsch', 'English']);
      expect(screen.getByRole('option', { name: 'Deutsch' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await userEvent.click(screen.getByRole('option', { name: 'English' }));
      expect(events.languageChange).toHaveBeenCalledWith('en');
    });

    it('reports the sign-out', async () => {
      const { events } = await setup({ variant: 'sheet' });
      await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }));
      expect(events.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('sheet', () => {
    it('shows the content inline, without the avatar', async () => {
      await setup({ variant: 'sheet' });
      expect(screen.queryByRole('button', { name: /^Konto:/ })).not.toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Konto' })).toBeInTheDocument();
      expect(screen.getByText('Mia Member')).toBeInTheDocument();
    });

    it('takes the popover with `auto` above the phone width', async () => {
      await setup({ variant: 'auto' });
      expect(trigger()).toBeInTheDocument();
    });

    it('takes the sheet look with `auto` on a phone', async () => {
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })) as unknown as typeof window.matchMedia;
      try {
        await setup({ variant: 'auto' });
        expect(screen.queryByRole('button', { name: /^Konto:/ })).not.toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Konto' })).toBeInTheDocument();
      } finally {
        window.matchMedia = original;
      }
    });
  });
});
