/*
 * Secondary entry point '@stupa-makers/ui-kit/pwa'.
 * The helpers of an installed web app: the update flow of the service worker with its
 * prompt, the test for the installed app and the zoom lock. Isolated so the optional
 * peer dependency `@angular/service-worker` stays out of the primary entry.
 */
export * from './sw-update.service';
export * from './sw-update-prompt.component';
export * from './installed-app.token';
export * from './zoom-lock';
