import { Directive, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FAB_LINK, type FabLink } from '@stupa-makers/ui-kit';

/**
 * A route for `app-fab`: a press opens the route, and the fab does not emit `activate`.
 *
 * ```html
 * <app-fab label="New application" link="/apply" />
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- the selector extends app-fab
  selector: 'app-fab[link]',
  standalone: true,
  providers: [{ provide: FAB_LINK, useExisting: FabLinkDirective }],
})
export class FabLinkDirective implements FabLink {
  /** The route to open. `navigateByUrl` parses it, so it may carry a query string. */
  readonly link = input.required<string>();

  private readonly router = inject(Router);

  open(): void {
    void this.router.navigateByUrl(this.link());
  }
}
