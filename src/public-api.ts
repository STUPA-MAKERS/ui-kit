/*
 * Public API of @stupa-makers/ui-kit.
 *
 * The MarkdownEditorComponent is deliberately NOT re-exported here — it pulls Tiptap
 * (hundreds of kB). Import it from the secondary entry point instead, so it stays in the
 * consumer's lazy chunk:  import { MarkdownEditorComponent } from '@stupa-makers/ui-kit/markdown-editor';
 *
 * Every line is `export *`. esbuild splits a barrel of star exports by use: a block that
 * only a lazy page imports stays in the lazy chunk of that page. One named re-export
 * (`export { X } from`) makes it put every module of the barrel into the chunk of the
 * first importer, so the whole kit lands in the initial bundle of an app.
 */

// --- i18n decoupling (token + built-in DE/EN defaults + pipe) ---------------
export * from './lib/intl';

// --- layout breakpoints (same values as styles/_breakpoints.scss) ------------
export * from './lib/breakpoints/breakpoints';

// --- loading state (token, service, HTTP interceptor) -------------------------
export * from './lib/loading/loading.token';
export * from './lib/loading/loading.service';
export * from './lib/loading/loading.interceptor';

// --- theme and motion -------------------------------------------------------
export * from './lib/theme/theme.config';
export * from './lib/theme/theme.service';
export * from './lib/motion/motion';
export * from './lib/page-frame/page-frame';

// --- components -------------------------------------------------------------
export * from './lib/button/button.component';
export * from './lib/button/button-link.component';
export * from './lib/switch/switch.component';
export * from './lib/segmented/segmented.component';
export * from './lib/tabs/tabs.component';
export * from './lib/tab-pager/tab-pager.component';
export * from './lib/tab-pager/tab-page.directive';
export * from './lib/input/input.component';
export * from './lib/checkbox/checkbox.component';
export * from './lib/select/select.component';
export * from './lib/filter-select/filter-select.component';
export * from './lib/range-chip/range-chip.component';
export * from './lib/datepicker/datepicker.component';
export * from './lib/time-input/time-input.component';
export * from './lib/datepicker/date-range.component';
export * from './lib/icon/icon.component';
export * from './lib/icon/icons';
export * from './lib/card/card.component';
export * from './lib/badge/badge.component';
export * from './lib/config-diff/config-diff.component';
export * from './lib/config-diff/config-diff.types';
export * from './lib/stepper/stepper.component';
export * from './lib/dialog/dialog.component';
export * from './lib/file-viewer/file-viewer.component';
export * from './lib/file-viewer/file-viewer.types';
export * from './lib/table/table.component';
export * from './lib/data-table/data-table.component';
export * from './lib/data-table/cell.directive';
export * from './lib/data-table/foot-cell.directive';
export * from './lib/data-table/row-detail.directive';
export * from './lib/currency-input/currency-input.component';
export * from './lib/currency-input/parse-money';
export * from './lib/loading-overlay/loading-overlay.component';
export * from './lib/load-bar/load-bar.component';
export * from './lib/chip/chip.component';
export * from './lib/chip/chip-group.component';
export * from './lib/copy/copy-button.component';
export * from './lib/highlight/highlight.component';
export * from './lib/highlight/highlight';
export * from './lib/locked-field/locked-field.component';
export * from './lib/infinite-scroll/infinite-scroll.directive';
export * from './lib/autocomplete/autocomplete.component';
export * from './lib/textarea/textarea.component';
export * from './lib/file-picker/file-picker.component';
export * from './lib/move-buttons/move-buttons.component';
export * from './lib/move-buttons/move-item';
export * from './lib/focus/focus-trap';
export * from './lib/popover/anchored-popover';
export * from './lib/signals/now-signal';
export * from './lib/signals/media-query';
export * from './lib/signals/element-size';
export * from './lib/copy/copy-text';
export * from './lib/copy/share-or-copy';
export * from './lib/avatar/avatar.component';
export * from './lib/avatar/avatar-source';
export * from './lib/side-sheet/side-sheet.component';
export * from './lib/sheet-bar/sheet-bar.component';
export * from './lib/row-menu/row-menu.component';
export * from './lib/skeleton/skeleton.component';
export * from './lib/empty-state/empty-state.component';
export * from './lib/detail-none/detail-none.component';
export * from './lib/page-header/page-header.component';
export * from './lib/fab/fab.component';
export * from './lib/fab/fab-group.component';
export * from './lib/note/note.component';
export * from './lib/confirm-dialog/confirm-dialog.component';
export * from './lib/selection-bar/selection-bar.component';
export * from './lib/list-item/list-item.component';
export * from './lib/list-detail/list-detail-layout.component';
export * from './lib/list-detail/list-detail-nav';
export * from './lib/list-detail/list-detail-bar.component';
export * from './lib/search-pill/search-pill.component';
export * from './lib/search-pill/shortcut';
export * from './lib/live-search/live-search';
export * from './lib/status-text/status-text.component';
export * from './lib/seg-bar/seg-bar.component';
export * from './lib/sticky-bar/sticky-bar.component';
export * from './lib/file-drop/drop-overlay.component';
export * from './lib/file-drop/file-drop-zone.component';
export * from './lib/file-drop/file-drop.directive';
export * from './lib/field-group/field-group.component';
export * from './lib/date-block/date-block.component';
export * from './lib/scroll-fade/scroll-fade.directive';
export * from './lib/truncated/truncated.directive';
export * from './lib/long-press/long-press.directive';
export * from './lib/press-select/press-select.directive';
export * from './lib/swipe-back/swipe-back.directive';
export * from './lib/row-swipe/row-swipe.directive';
export * from './lib/gesture/gesture';
export * from './lib/util/download.util';
export * from './lib/util/format-bytes';
export * from './lib/util/haptic';
export * from './lib/util/key-parts.util';
export * from './lib/util/capitalize.pipe';
export * from './lib/toast/toast.component';
export * from './lib/toast/toast.service';
