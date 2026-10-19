import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { type ButtonSize, type ButtonVariant, buttonLook } from './button.component';

/**
 * A link in the look of {@link ButtonComponent}: `<a appButton="fill" routerLink="/">`.
 * The `<a>` stays the focusable element, so `routerLink`, `href` and `download` work as on
 * any link. Inside it a pill carries the look, with the same sizes, looks and custom
 * properties as the button. A link has no disabled or loading state: a page that cannot go
 * anywhere renders no link.
 */
@Component({
  // An attribute on the native <a>: a wrapper element would take the link semantics away.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[appButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button-link.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonLinkComponent {
  /** The look, as the value of the attribute. An empty attribute is `fill`. */
  @Input('appButton') variant: ButtonVariant | '' = 'fill';
  @Input() size: ButtonSize = 'md';
  /** Full width of the container. */
  @Input() @HostBinding('class.btn-block') block = false;
  @HostBinding('class.btn-link') protected readonly hostClass = true;

  /** CSS classes of the pill: the look, the variant name and the size. */
  protected classes(): string {
    const variant: ButtonVariant = this.variant || 'fill';
    const look = buttonLook(variant);
    const names = look === variant ? `btn--${look}` : `btn--${look} btn--${variant}`;
    return `btn ${names} btn--${this.size}`;
  }
}
