/*
 * Secondary entry point '@stupa-makers/ui-kit/shell'.
 * The frame of an app and the pieces that need the router: the shell with the rail, the
 * bottom bar and the account menu, the search palette, the empty detail route, the
 * list/detail page helper, the route link of the fab and the route motion.
 */
export * from './shell.types';
export * from './nav-mark.directive';
export * from './shell/shell.component';
export * from './nav-rail/nav-rail.component';
export * from './bottom-bar/bottom-bar.component';
export * from './nav-item/nav-item-buttons';
export * from './account-menu/account-menu.component';
export * from './command-palette/command-palette.service';
export * from './command-palette/command-palette.component';
export * from './list-none/list-none.component';
export * from './list-detail-page';
export * from './fab-link.directive';
export * from './route-motion';
