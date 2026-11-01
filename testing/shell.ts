/** Fixtures of the specs of the shell entry: entries, bar keys, a brand and a nav mark. */
import { Component, input } from '@angular/core';
import type { ShellBrand, ShellNavItem } from '../shell/src/shell.types';
import type { NavMarkPart } from '../shell/src/nav-mark.directive';

/** The entries of the specs, in rail order. */
export const NAV: ShellNavItem[] = [
  {
    key: 'start',
    path: '/dashboard',
    label: 'Start',
    icon: 'home',
    place: 'main',
  },
  {
    key: 'applications',
    path: '/applications',
    label: 'Anträge',
    icon: 'file',
    place: 'main',
  },
  {
    key: 'tasks',
    path: '/tasks',
    label: 'Aufgaben',
    icon: 'tasks',
    place: 'main',
  },
  {
    key: 'meetings',
    path: '/meetings',
    label: 'Sitzungen',
    icon: 'users',
    place: 'main',
  },
  {
    key: 'budget',
    path: '/budget',
    label: 'Budget',
    icon: 'pie',
    place: 'main',
  },
  {
    key: 'tickets',
    path: '/tickets',
    label: 'Tickets',
    icon: 'ticket',
    place: 'main',
  },
  {
    key: 'admin',
    path: '/admin',
    label: 'Verwaltung',
    icon: 'shield',
    place: 'end',
  },
];

export const BAR_KEYS = ['start', 'applications', 'meetings', 'tasks'];

export const BRAND: ShellBrand = {
  home: '/dashboard',
  label: 'STUPA',
  mark: 'assets/mark.svg',
};

/** A mark like the one of an app: a count on "Aufgaben" and "Tickets". */
@Component({
  selector: 'app-test-mark',
  standalone: true,
  template: `
    @if (count()) {
      @switch (part()) {
        @case ('visual') {
          <span class="mark__count" aria-hidden="true">{{ count() }}</span>
        }
        @case ('count') {
          <span class="mark__count mark__count--inline" aria-hidden="true">{{ count() }}</span>
        }
        @default {
          <span class="sr-only">{{ count() }} offen</span>
        }
      }
    }
  `,
})
export class TestMarkComponent {
  readonly key = input.required<string>();
  readonly part = input<NavMarkPart>('visual');
  protected count(): number {
    return { tasks: 8, tickets: 2 }[this.key()] ?? 0;
  }
}
