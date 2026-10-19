import { InjectionToken } from '@angular/core';

/**
 * Where the image of a person avatar comes from. The kit draws the initials; a host app
 * that has images (a Gravatar proxy, for example) provides {@link UI_KIT_AVATAR_SOURCE}.
 *
 * `url` returns the image URL of a principal at `px` CSS pixels, or `null` for the
 * initials only. The avatar reads it in a computed, so a source whose answer changes
 * (a switch that turns the images on, a failed id) must read signals. `markFailed`
 * reports an image that did not load (404, 429, network), so the source can answer
 * `null` for that principal for a while.
 */
export interface UiKitAvatarSource {
  url(principal: string | null | undefined, px: number): string | null;
  markFailed(principal: string): void;
}

/** DI token for the avatar images. The default loads no image: initials only. */
export const UI_KIT_AVATAR_SOURCE = new InjectionToken<UiKitAvatarSource>('UI_KIT_AVATAR_SOURCE', {
  providedIn: 'root',
  factory: () => ({ url: () => null, markFailed: () => undefined }),
});
