import { DestroyRef, Directive, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FabComponent } from '@stupa-makers/ui-kit';

/**
 * A route for `app-fab`: a press opens the route instead of only emitting `activate`.
 * `activate` still fires, so a page can do both.
 *
 * ```html
 * <app-fab label="New application" link="/apply" />
 * ```
 */
// eslint-disable-next-line @angular-eslint/directive-selector -- the selector extends app-fab
@Directive({ selector: 'app-fab[link]', standalone: true })
export class FabLinkDirective {
  /** The route to open. `navigateByUrl` parses it, so it may carry a query string. */
  readonly link = input.required<string>();

  constructor() {
    const router = inject(Router);
    const sub = inject(FabComponent).activate.subscribe(
      () => void router.navigateByUrl(this.link()),
    );
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }
}
