import {
  InjectionToken,
  type EnvironmentProviders,
  type Signal,
  computed,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { UI_KIT_THEME, type UiKitThemeOptions, uiKitThemeConfig } from '../theme/theme.config';

/** Languages the built-in catalogue ships. Consumers may map their own onto these. */
export type UiLang = 'de' | 'en';

/**
 * The `Intl` locale tag behind each kit language. The language is a catalogue key, not a
 * format locale: bare `en` makes `Intl` use US order (`07/01/2026`, `7:50 PM`). EN
 * therefore formats as `en-GB` (`01/07/2026`, 24 h clock), like DE.
 */
export const UI_KIT_FORMAT_LOCALES: Record<UiLang, string> = {
  de: 'de-DE',
  en: 'en-GB',
};

/** The texts of the core of the kit: its controls, the shell and the texts more than one view uses. */
export type UiKitCoreTextKey =
  | 'dialog.close'
  | 'loading'
  | 'datepicker.openCalendar'
  | 'diff.none'
  | 'diff.changed'
  | 'diff.added'
  | 'diff.removed'
  | 'diff.label'
  | 'diff.before'
  | 'diff.after'
  | 'diff.noneCompact'
  | 'table.scrollStart'
  | 'table.scrollEnd'
  | 'currency.invalid'
  | 'copy.copy'
  | 'copy.copied'
  | 'move.up'
  | 'move.down'
  | 'options.empty'
  | 'range.from'
  | 'range.to'
  | 'range.fromOnly'
  | 'range.toOnly'
  | 'range.apply'
  | 'range.reset'
  | 'range.invalid'
  | 'rowMenu.trigger'
  | 'rowMenu.empty'
  | 'rowMenu.loading'
  | 'note.retry'
  | 'screen.more'
  | 'chat.deletedPerson'
  | 'screen.select'
  | 'screen.selectRow'
  | 'screen.selectStop'
  | 'confirm.cancel'
  | 'confirm.delete'
  | 'selection.toolbar'
  | 'selection.selectAll'
  | 'selection.clear'
  | 'selection.count'
  | 'listDetail.back'
  | 'screen.back'
  | 'form.required'
  | 'form.maxLength'
  | 'form.pattern'
  | 'form.email'
  | 'form.url'
  | 'form.iban'
  | 'form.number'
  | 'form.min'
  | 'form.max'
  | 'form.minDate'
  | 'form.maxDate'
  | 'form.range'
  | 'form.repeatMin'
  | 'form.repeatMax'
  | 'form.removeRow'
  | 'form.pickFile'
  | 'form.removeFile'
  | 'form.tooLarge'
  | 'form.uploadFailed'
  | 'form.drop'
  | 'form.uploading'
  | 'form.wrongType'
  | 'form.leaveTitle'
  | 'form.leaveBody'
  | 'form.leaveConfirm'
  | 'wizard.stepOf'
  | 'wizard.back'
  | 'wizard.next'
  | 'wizard.progress'
  | 'wizard.empty'
  | 'wizard.yes'
  | 'wizard.invalid'
  | 'settings.save'
  | 'settings.discard'
  | 'public.crumbs'
  | 'search.clear'
  | 'search.results'
  | 'search.resultsOne'
  | 'search.none'
  | 'avatar.more'
  | 'viewer.close'
  | 'viewer.previous'
  | 'viewer.next'
  | 'viewer.position'
  | 'viewer.error'
  | 'viewer.noPreview'
  | 'editorTable.columnMenu'
  | 'editorTable.rowMenu'
  | 'editorSlash.menu'
  | 'editorTable.menu'
  | 'editorTable.insertColumnLeft'
  | 'editorTable.insertColumnRight'
  | 'editorTable.deleteColumn'
  | 'editorTable.insertRowAbove'
  | 'editorTable.insertRowBelow'
  | 'editorTable.deleteRow'
  | 'editorTable.addRow'
  | 'editorSelection.toolbar'
  | 'editorSelection.bold'
  | 'editorSelection.italic'
  | 'editorSelection.blackout'
  | 'editorTable.addColumn'
  | 'editorTable.delete'
  | 'editorDocument.open'
  | 'editorDocument.pages'
  | 'editorDocument.page'
  | 'pwa.updateReady'
  | 'pwa.reload'
  | 'pwa.offline'
  | 'shell.skip'
  | 'shell.mainNav'
  | 'shell.more'
  | 'shell.search'
  | 'shell.brand'
  | 'shell.markNew'
  | 'shell.markWarn'
  | 'menu.help'
  | 'menu.a11y'
  | 'menu.display'
  | 'menu.display.reset'
  | 'menu.display.dark'
  | 'menu.display.motion'
  | 'menu.display.transparency'
  | 'menu.display.contrast'
  | 'menu.display.veryHigh'
  | 'menu.statement'
  | 'menu.reportBarrier'
  | 'account.signedInAs'
  | 'account.language'
  | 'account.darkMode'
  | 'account.logout'
  | 'account.open'
  | 'account.region'
  | 'palette.title'
  | 'palette.placeholder'
  | 'palette.close'
  | 'palette.empty'
  | 'palette.pages'
  | 'palette.truncated'
  | 'palette.keysSelect'
  | 'palette.keysOpen'
  | 'palette.archived'
  | 'meetings.agenda.top'
  | 'meetings.dock.of'
  | 'meetings.dock.yourVote'
  | 'meetings.vote.card.cancelled'
  | 'meetings.vote.card.draft'
  | 'vote.majority.absolute'
  | 'vote.majority.members_majority'
  | 'vote.majority.members_two_thirds'
  | 'vote.majority.simple'
  | 'vote.majority.two_thirds'
  | 'vote.majorityCast.absolute'
  | 'vote.majorityCast.members_majority'
  | 'vote.majorityCast.members_two_thirds'
  | 'vote.majorityCast.simple'
  | 'vote.majorityCast.two_thirds'
  | 'action.cancel'
  | 'action.close'
  | 'action.remove'
  | 'meetings.agenda.done'
  | 'meetings.agenda.kindApplication'
  | 'meetings.agenda.nonPublicLabel'
  | 'meetings.agenda.rename'
  | 'meetings.agenda.renamePlaceholder'
  | 'meetings.agenda.untitled'
  | 'meetings.attendance.reset'
  | 'meetings.dock.protokollantIs'
  | 'meetings.editor.modeRaw'
  | 'meetings.editor.toolbar'
  | 'todos.linkKind.application'
  | 'calendar.answer.accept'
  | 'calendar.answer.decline'
  | 'calendar.answer.tentative'
  | 'calendar.kind.appointment'
  | 'calendar.kind.card'
  | 'calendar.kind.external'
  | 'calendar.kind.meeting'
  | 'admin.common.label'
  | 'admin.form.metric.amount'
  | 'admin.form.type.budget_select'
  | 'admin.form.type.checkbox'
  | 'admin.form.type.computed'
  | 'admin.form.type.currency'
  | 'admin.form.type.date'
  | 'admin.form.type.daterange'
  | 'admin.form.type.email'
  | 'admin.form.type.file'
  | 'admin.form.type.funding'
  | 'admin.form.type.gremium_select'
  | 'admin.form.type.iban'
  | 'admin.form.type.markdown'
  | 'admin.form.type.multiselect'
  | 'admin.form.type.number'
  | 'admin.form.type.positions'
  | 'admin.form.type.section'
  | 'admin.form.type.select'
  | 'admin.form.type.table'
  | 'admin.form.type.text'
  | 'admin.form.type.textarea'
  | 'admin.forms.rules.block'
  | 'admin.forms.rules.warn'
  | 'admin.common.key'
  | 'admin.flow.guardCombinator.and'
  | 'admin.flow.guardCombinator.not'
  | 'admin.flow.guardCombinator.or'
  | 'admin.flow.guardDesc.and'
  | 'admin.flow.guardDesc.not'
  | 'admin.flow.guardDesc.or'
  | 'admin.flow.guardOp.actorIsApplicant'
  | 'admin.flow.guardOp.applicantCommitteeIs'
  | 'admin.flow.guardOp.applicantRoleIs'
  | 'admin.flow.guardOp.applicationTypeIs'
  | 'admin.flow.guardOp.attachmentPresent'
  | 'admin.flow.guardOp.budgetFitsApplication'
  | 'admin.flow.guardOp.budgetHasDecisionGremium'
  | 'admin.flow.guardOp.budgetIs'
  | 'admin.flow.guardOp.compare'
  | 'admin.flow.guardOp.fieldsComplete'
  | 'admin.flow.guardOp.hasField'
  | 'admin.flow.guardOp.isInCommittee'
  | 'admin.flow.guardOp.isInVoteGremium'
  | 'admin.flow.guardOp.manual'
  | 'admin.flow.guardOp.permissionIs'
  | 'admin.flow.guardOp.roleIs'
  | 'admin.flow.guardOp.voteResult';

/** The texts only the views of `@stupa-makers/ui-kit/views/activity` use. */
export type UiKitActivityTextKey = 'activity.loading' | 'activity.new' | 'activity.more';

/** The texts only the views of `@stupa-makers/ui-kit/views/board` use. */
export type UiKitBoardTextKey =
  | 'todos.board.addCard'
  | 'todos.board.archive'
  | 'todos.board.columnEmpty'
  | 'todos.board.create'
  | 'todos.board.doneColumn'
  | 'todos.board.more'
  | 'todos.board.quickTitle'
  | 'todos.card.transfer'
  | 'todos.column.add'
  | 'todos.column.archive'
  | 'todos.column.menu'
  | 'todos.column.settings'
  | 'todos.drag.cancelled'
  | 'todos.drag.dropped'
  | 'todos.drag.lifted'
  | 'todos.drag.moved'
  | 'todos.due.change'
  | 'todos.due.none'
  | 'todos.due.overdue'
  | 'todos.due.set'
  | 'todos.due.today'
  | 'todos.due.tomorrow'
  | 'todos.link.noAccess'
  | 'todos.linkKind.agenda_item'
  | 'todos.linkKind.appointment'
  | 'todos.linkKind.budget'
  | 'todos.linkKind.expense'
  | 'todos.linkKind.gremium'
  | 'todos.linkKind.invoice'
  | 'todos.linkKind.meeting'
  | 'todos.linkKind.ticket'
  | 'todos.linkKind.todo'
  | 'todos.linkKind.vote'
  | 'todos.list.due'
  | 'todos.list.label'
  | 'todos.list.linked'
  | 'todos.list.title'
  | 'todos.list.who'
  | 'todos.move.bottom'
  | 'todos.move.column'
  | 'todos.move.confirm'
  | 'todos.move.position'
  | 'todos.move.title'
  | 'todos.move.top'
  | 'todos.new.short'
  | 'todos.rows.openBoard'
  | 'todos.rows.readOnly'
  | 'todos.tile.checklist'
  | 'todos.tile.comments'
  | 'todos.tile.nobody'
  | 'todos.list.done'
  | 'todos.list.markDone'
  | 'todos.list.reopen';

/** The texts only the views of `@stupa-makers/ui-kit/views/calendar` use. */
export type UiKitCalendarTextKey =
  | 'calendar.allDay'
  | 'calendar.day.empty'
  | 'calendar.day.many'
  | 'calendar.day.none'
  | 'calendar.day.one'
  | 'calendar.detail.when'
  | 'calendar.external.calendar'
  | 'calendar.field.place'
  | 'calendar.filter.gremium'
  | 'calendar.public.protocol'
  | 'calendar.public.tops'
  | 'meetings.overview.more'
  | 'meetings.overview.today';

/** The texts only the views of `@stupa-makers/ui-kit/views/chat` use. */
export type UiKitChatTextKey =
  | 'chat.attach'
  | 'chat.cancel'
  | 'chat.copy'
  | 'chat.delete'
  | 'chat.deleteConfirm'
  | 'chat.deleteShort'
  | 'chat.deleteTitle'
  | 'chat.discard'
  | 'chat.download'
  | 'chat.drop'
  | 'chat.edit'
  | 'chat.editShort'
  | 'chat.edited'
  | 'chat.empty'
  | 'chat.error.delete'
  | 'chat.error.fileTooLarge'
  | 'chat.error.fileType'
  | 'chat.error.tooManyFiles'
  | 'chat.error.upload'
  | 'chat.failed'
  | 'chat.fileLost'
  | 'chat.internal'
  | 'chat.loading'
  | 'chat.log'
  | 'chat.mentions'
  | 'chat.newCount'
  | 'chat.newMessages.one'
  | 'chat.newMessages.other'
  | 'chat.ownMessage'
  | 'chat.pastedImage'
  | 'chat.placeholder'
  | 'chat.public'
  | 'chat.removeFile'
  | 'chat.removeFileAction'
  | 'chat.removeFileConfirm'
  | 'chat.removeFileTitle'
  | 'chat.retry'
  | 'chat.save'
  | 'chat.scan.clean'
  | 'chat.scan.quarantined'
  | 'chat.scan.scanning'
  | 'chat.send'
  | 'chat.sending'
  | 'chat.today'
  | 'chat.uploading'
  | 'chat.visibility'
  | 'chat.yesterday';

/** The texts only the views of `@stupa-makers/ui-kit/views/flow-editor` use. */
export type UiKitFlowEditorTextKey =
  | 'admin.flow.approved'
  | 'admin.flow.automatic'
  | 'admin.flow.branch'
  | 'admin.flow.branchNone'
  | 'admin.flow.cfgGremium'
  | 'admin.flow.cfgGremiumPh'
  | 'admin.flow.cfgGremiumSource'
  | 'admin.flow.cfgGremiumSourceBudget'
  | 'admin.flow.cfgGremiumSourceFixed'
  | 'admin.flow.cfgRolePh'
  | 'admin.flow.color'
  | 'admin.flow.colorCustom'
  | 'admin.flow.colorNone'
  | 'admin.flow.colorPreset'
  | 'admin.flow.compareField'
  | 'admin.flow.compareFieldPh'
  | 'admin.flow.compareOp'
  | 'admin.flow.compareValue'
  | 'admin.flow.denied'
  | 'admin.flow.editAllowed'
  | 'admin.flow.from'
  | 'admin.flow.group.dissolve'
  | 'admin.flow.group.inspector'
  | 'admin.flow.group.members'
  | 'admin.flow.group.name'
  | 'admin.flow.group.subgroups'
  | 'admin.flow.guardAddChild'
  | 'admin.flow.guardNone'
  | 'admin.flow.guardOp'
  | 'admin.flow.guardPriority'
  | 'admin.flow.guardRemove'
  | 'admin.flow.guardValue'
  | 'admin.flow.initial'
  | 'admin.flow.kindLabel'
  | 'admin.flow.legendAutomatic'
  | 'admin.flow.list.empty'
  | 'admin.flow.list.heading'
  | 'admin.flow.list.incoming'
  | 'admin.flow.list.outgoing'
  | 'admin.flow.recipientKind.role'
  | 'admin.flow.removeState'
  | 'admin.flow.removeTransition'
  | 'admin.flow.replacedTarget'
  | 'admin.flow.requiresAction'
  | 'admin.flow.stateInspector'
  | 'admin.flow.terminal'
  | 'admin.flow.to'
  | 'admin.flow.transitionInspector';

/** The texts only the views of `@stupa-makers/ui-kit/views/form-editor` use. */
export type UiKitFormEditorTextKey =
  | 'admin.common.delete'
  | 'admin.common.errors'
  | 'admin.common.remove'
  | 'admin.common.required'
  | 'admin.common.type'
  | 'admin.form.addGroup'
  | 'admin.form.addOption'
  | 'admin.form.allowNoOffers'
  | 'admin.form.compute'
  | 'admin.form.deleteGroup'
  | 'admin.form.dragGroup'
  | 'admin.form.dupKeys'
  | 'admin.form.formCard'
  | 'admin.form.fundingNoPositions'
  | 'admin.form.fundingTwice'
  | 'admin.form.groupEmpty'
  | 'admin.form.groupMenu'
  | 'admin.form.groupStep'
  | 'admin.form.groupTitle'
  | 'admin.form.groupTitlePlaceholder'
  | 'admin.form.isPII'
  | 'admin.form.isPromoted'
  | 'admin.form.max'
  | 'admin.form.maxLen'
  | 'admin.form.min'
  | 'admin.form.minLen'
  | 'admin.form.minOffers'
  | 'admin.form.minPositions'
  | 'admin.form.moveGroupDown'
  | 'admin.form.moveGroupUp'
  | 'admin.form.optionValue'
  | 'admin.form.options'
  | 'admin.form.outline'
  | 'admin.form.participants'
  | 'admin.form.participantsTwice'
  | 'admin.form.pattern'
  | 'admin.form.positions'
  | 'admin.form.promoteTarget'
  | 'admin.form.rootPath'
  | 'admin.form.typeMenu'
  | 'admin.form.validation'
  | 'admin.form.visibleIf'
  | 'admin.form.visibleIfEmpty'
  | 'admin.forms.addQuestion'
  | 'admin.forms.advanced'
  | 'admin.forms.attachmentRequired'
  | 'admin.forms.cmpMinCount'
  | 'admin.forms.cmpRequired'
  | 'admin.forms.desc'
  | 'admin.forms.descPlaceholder'
  | 'admin.forms.duplicate'
  | 'admin.forms.empty'
  | 'admin.forms.hasBudget'
  | 'admin.forms.help'
  | 'admin.forms.name'
  | 'admin.forms.overviewLoading'
  | 'admin.forms.pdfSignatures'
  | 'admin.forms.questionPlaceholder'
  | 'admin.forms.rules.add'
  | 'admin.forms.rules.logic'
  | 'admin.forms.rules.logicInvalid'
  | 'admin.forms.rules.message'
  | 'admin.forms.rules.messageMissing'
  | 'admin.forms.rules.remove'
  | 'admin.forms.rules.ruleN'
  | 'admin.forms.rules.severity'
  | 'admin.forms.rules.title'
  | 'admin.forms.untitled'
  | 'admin.forms.untitledQuestion'
  | 'formly.select.placeholder';

/** The texts only the views of `@stupa-makers/ui-kit/views/graph` use. */
export type UiKitGraphTextKey =
  | 'graph.zoom.group'
  | 'graph.zoom.in'
  | 'graph.zoom.out'
  | 'graph.zoom.all';

/** The texts only the views of `@stupa-makers/ui-kit/views/meeting` use. */
export type UiKitMeetingTextKey =
  | 'action.save'
  | 'delegation.toast.revokeFailed'
  | 'delegation.toast.revoked'
  | 'guests.dock.pending'
  | 'guests.dock.present'
  | 'guests.dock.presentShort'
  | 'guests.sheet.guests'
  | 'guests.sheet.members'
  | 'guests.sheet.present'
  | 'guests.tab.guests'
  | 'guests.tab.guestsWatching'
  | 'guests.tab.members'
  | 'meetings.agenda.dialogTitle'
  | 'meetings.agenda.duration'
  | 'meetings.agenda.durationEdit'
  | 'meetings.agenda.durationRange'
  | 'meetings.agenda.durationUnit'
  | 'meetings.agenda.empty'
  | 'meetings.agenda.kindTodo'
  | 'meetings.agenda.link'
  | 'meetings.agenda.markDone'
  | 'meetings.agenda.markOpen'
  | 'meetings.agenda.moveDown'
  | 'meetings.agenda.moveUp'
  | 'meetings.agenda.nonPublic'
  | 'meetings.agenda.planActual'
  | 'meetings.agenda.planMinutes'
  | 'meetings.agenda.planStart'
  | 'meetings.agenda.remove'
  | 'meetings.agenda.removeBlocked'
  | 'meetings.agenda.removeConfirm'
  | 'meetings.agenda.removeNeedsVoteRight'
  | 'meetings.agenda.removeTitle'
  | 'meetings.agenda.rowMenu'
  | 'meetings.agenda.title'
  | 'meetings.agenda.todo'
  | 'meetings.agenda.voteOpen'
  | 'meetings.attendance.absent'
  | 'meetings.attendance.bySession'
  | 'meetings.attendance.empty'
  | 'meetings.attendance.excused'
  | 'meetings.attendance.note'
  | 'meetings.attendance.notePlaceholder'
  | 'meetings.attendance.present'
  | 'meetings.attendance.selfExcused'
  | 'meetings.attendance.selfPresent'
  | 'meetings.attendance.title'
  | 'meetings.attendance.unknown'
  | 'meetings.attendance.you'
  | 'meetings.attendanceSheet.addReason'
  | 'meetings.attendanceSheet.delegationActive'
  | 'meetings.attendanceSheet.delegationsTitle'
  | 'meetings.attendanceSheet.editReason'
  | 'meetings.attendanceSheet.reason'
  | 'meetings.attendanceSheet.representedBy'
  | 'meetings.attendanceSheet.revoke'
  | 'meetings.attendanceSheet.revokeDelegation'
  | 'meetings.attendanceSheet.revokeFirst'
  | 'meetings.attendanceSheet.rowMenu'
  | 'meetings.attendanceSheet.statusOf'
  | 'meetings.attendanceSheet.withVote'
  | 'meetings.dock.backToNow'
  | 'meetings.dock.closedAt'
  | 'meetings.dock.done'
  | 'meetings.dock.formatBack'
  | 'meetings.dock.keepersLocked'
  | 'meetings.dock.next'
  | 'meetings.dock.noKeeper'
  | 'meetings.dock.noMember'
  | 'meetings.dock.none'
  | 'meetings.dock.notStarted'
  | 'meetings.dock.now'
  | 'meetings.dock.nowRunning'
  | 'meetings.dock.pickProtokollant'
  | 'meetings.dock.present'
  | 'meetings.dock.presentShort'
  | 'meetings.dock.prev'
  | 'meetings.dock.protokollantMissing'
  | 'meetings.dock.searchMember'
  | 'meetings.dock.top'
  | 'meetings.dock.tops'
  | 'meetings.dock.topsOne'
  | 'meetings.dock.topsPrepared'
  | 'meetings.handover.discard'
  | 'meetings.handover.plannedShort'
  | 'meetings.handover.title'
  | 'meetings.keeper.assign'
  | 'meetings.keeper.handTo'
  | 'meetings.keeper.keeps'
  | 'meetings.keeper.planned'
  | 'meetings.keeper.takesOverAt'
  | 'meetings.keeper.takesOverNext'
  | 'meetings.leadSubstitute.action'
  | 'meetings.page.back'
  | 'meetings.protokollant.label'
  | 'meetings.status.closed'
  | 'meetings.viewers.empty'
  | 'meetings.viewers.title'
  | 'meetings.vote.count'
  | 'todos.link.top';

/** The texts only the views of `@stupa-makers/ui-kit/views/plan-table` use. */
export type UiKitPlanTableTextKey =
  | 'budget.dash.collapse'
  | 'budget.dash.expand'
  | 'budget.cc.inactive'
  | 'budget.plan.marks.transferable'
  | 'budget.plan.marks.coverable'
  | 'budget.plan.marks.blockedBadge'
  | 'budget.plan.amountOf'
  | 'budget.plan.income'
  | 'budget.plan.expense'
  | 'budget.plan.difference'
  | 'budget.plan.balanced'
  | 'budget.plan.unbalanced';

/** The texts only the views of `@stupa-makers/ui-kit/views/protocol` use. */
export type UiKitProtocolTextKey =
  | 'markdown.blackout.mark'
  | 'markdown.image.uploading'
  | 'meetings.agenda.planSub'
  | 'meetings.approval.removeTitle'
  | 'meetings.dock.noTop'
  | 'meetings.draftMail.again'
  | 'meetings.draftMail.body'
  | 'meetings.draftMail.confirm'
  | 'meetings.draftMail.title'
  | 'meetings.editor.blackout'
  | 'meetings.editor.blackoutOpen'
  | 'meetings.editor.bold'
  | 'meetings.editor.document'
  | 'meetings.editor.heading'
  | 'meetings.editor.image'
  | 'meetings.editor.italic'
  | 'meetings.editor.list'
  | 'meetings.editor.mode'
  | 'meetings.editor.modeFormatted'
  | 'meetings.editor.quote'
  | 'meetings.editor.slash.document'
  | 'meetings.editor.slash.image'
  | 'meetings.editor.slash.table'
  | 'meetings.editor.slash.timeNote'
  | 'meetings.editor.table'
  | 'meetings.editor.timeNote'
  | 'meetings.editor.timeNoteSuffix'
  | 'meetings.editor.timeNoteTime'
  | 'meetings.follow.now'
  | 'meetings.protocol.finalize'
  | 'meetings.protocol.none'
  | 'meetings.protocol.placeholder'
  | 'meetings.protocol.publicNotice'
  | 'meetings.protocol.saveFailed'
  | 'meetings.protocol.saved'
  | 'meetings.protocol.saving'
  | 'meetings.protocol.selectTop'
  | 'meetings.protocolBar.approve'
  | 'meetings.protocolBar.needsRight'
  | 'meetings.protocolBar.pdf'
  | 'meetings.protocolBar.pdfInternal'
  | 'meetings.protocolBar.pdfPublic'
  | 'meetings.protocolBar.publish'
  | 'meetings.protocolBar.reopen'
  | 'meetings.protocolBar.sendDraft'
  | 'meetings.protocolBar.unapprove'
  | 'meetings.protocolBar.withhold'
  | 'meetings.reopen.body'
  | 'meetings.reopen.confirm'
  | 'meetings.reopen.title'
  | 'participant.top.empty'
  | 'participant.top.keeper'
  | 'participant.top.protocol';

/** The texts only the views of `@stupa-makers/ui-kit/views/voting` use. */
export type UiKitVotingTextKey =
  | 'circular.status.objection'
  | 'election.abstentions.one'
  | 'election.abstentions.other'
  | 'election.abstentionsLabel'
  | 'election.ballot.abstainAll'
  | 'election.ballot.counter'
  | 'election.ballot.sole'
  | 'election.candidate.erased'
  | 'election.kind'
  | 'election.lot.cancel'
  | 'election.lot.confirm'
  | 'election.lot.confirmHint'
  | 'election.lot.draw'
  | 'election.lot.drawn'
  | 'election.lot.note'
  | 'election.lot.pending'
  | 'election.lot.waiting'
  | 'election.names.one'
  | 'election.names.other'
  | 'election.nextRound.created'
  | 'election.nextRound.lotNote'
  | 'election.nextRound.second'
  | 'election.nextRound.third'
  | 'election.result.elected'
  | 'election.result.noMajority'
  | 'election.result.nobody'
  | 'election.result.runoff'
  | 'election.result.tie'
  | 'election.runoff.banner'
  | 'election.runoff.exists'
  | 'election.runoffRound'
  | 'election.seats.one'
  | 'election.seats.other'
  | 'election.status.elected'
  | 'election.status.noMajority'
  | 'election.status.rejected'
  | 'election.status.runoff'
  | 'election.status.tie'
  | 'election.tag.elected'
  | 'election.tag.tie'
  | 'guests.vote.cast'
  | 'guests.vote.castN'
  | 'guests.vote.composition'
  | 'guests.vote.majorityOfCast'
  | 'guests.vote.notReached'
  | 'guests.vote.reached'
  | 'guests.vote.resultCaption'
  | 'meetings.dock.insertResult'
  | 'meetings.toast.actionFailed'
  | 'meetings.vote.attempt'
  | 'meetings.vote.attemptElection'
  | 'meetings.vote.cancel'
  | 'meetings.vote.card.closed'
  | 'meetings.vote.card.open'
  | 'meetings.vote.close'
  | 'meetings.vote.delete'
  | 'meetings.vote.edit'
  | 'meetings.vote.endedAt'
  | 'meetings.vote.kind.circular'
  | 'meetings.vote.menu'
  | 'meetings.vote.open'
  | 'meetings.vote.openBlocked'
  | 'meetings.vote.opensLater'
  | 'meetings.vote.progress'
  | 'meetings.vote.quorumCount'
  | 'meetings.vote.quorumPercent'
  | 'meetings.vote.repeat'
  | 'meetings.vote.repeatElection'
  | 'meetings.vote.repeated'
  | 'meetings.vote.rule.members_majority'
  | 'meetings.vote.rule.simple'
  | 'meetings.vote.since'
  | 'meetings.vote.tally'
  | 'meetings.vote.untitled'
  | 'meetings.voteResult.inProtocol'
  | 'meetings.voteStatus.cancelled'
  | 'meetings.voteStatus.closed'
  | 'meetings.voteStatus.draft'
  | 'meetings.voteStatus.open'
  | 'poll.answer.maybe'
  | 'poll.ballot.counter'
  | 'poll.ballot.submitDate'
  | 'poll.caption'
  | 'poll.mode.date'
  | 'poll.mode.multi'
  | 'poll.mode.multiMax'
  | 'poll.mode.single'
  | 'poll.options.one'
  | 'poll.options.other'
  | 'poll.result.dateCaption'
  | 'poll.result.dateRow'
  | 'poll.result.footer'
  | 'poll.status.closed'
  | 'poll.status.open'
  | 'vote.failedQuorum'
  | 'vote.option.abstain'
  | 'vote.option.no'
  | 'vote.option.yes'
  | 'vote.result.passed'
  | 'vote.result.rejected'
  | 'vote.tally.quorum'
  | 'vote.tally.quorumMet'
  | 'vote.tally.quorumMissed'
  | 'voting.ballot.confirm'
  | 'voting.ballot.confirmCount'
  | 'voting.ballot.confirmEmpty'
  | 'voting.ballot.confirmNames'
  | 'voting.ballot.confirmProxy'
  | 'voting.ballot.confirmProxyCount'
  | 'voting.ballot.confirmProxyEmpty'
  | 'voting.ballot.locked'
  | 'voting.ballot.own'
  | 'voting.ballot.ownWith'
  | 'voting.ballot.ownWithCount'
  | 'voting.ballot.proxy'
  | 'voting.ballot.proxyCount'
  | 'voting.ballot.proxyDone'
  | 'voting.ballot.proxyDoneSecret'
  | 'voting.ballot.thanks'
  | 'voting.ballot.thanksSecret'
  | 'voting.bars.label'
  | 'voting.bars.row'
  | 'voting.beamer.votesOf'
  | 'voting.cast.toast.alreadyVoted'
  | 'voting.cast.toast.asUnit'
  | 'voting.cast.toast.noDelegationInElection'
  | 'voting.live.closed'
  | 'voting.live.opened'
  | 'voting.live.vote'
  | 'voting.panel.application'
  | 'voting.panel.where'
  | 'voting.progress.eligible';

/** Every translatable string the kit renders itself. */
export type UiKitTextKey =
  | UiKitCoreTextKey
  | UiKitActivityTextKey
  | UiKitBoardTextKey
  | UiKitCalendarTextKey
  | UiKitChatTextKey
  | UiKitFlowEditorTextKey
  | UiKitFormEditorTextKey
  | UiKitGraphTextKey
  | UiKitMeetingTextKey
  | UiKitPlanTableTextKey
  | UiKitProtocolTextKey
  | UiKitVotingTextKey;

export type UiKitMessages = Record<UiKitTextKey, string>;

/** The DE and EN texts of a set of keys: the core catalogue or the texts of one view. */
export type UiKitTexts<K extends UiKitTextKey> = Record<UiLang, Record<K, string>>;

/**
 * Built-in DE/EN strings of the core. The texts of a view come with the view (002237), in
 * the chunk that loads the view.
 */
export const UI_KIT_DEFAULT_MESSAGES: UiKitTexts<UiKitCoreTextKey> = {
  de: {
    'dialog.close': 'Schließen',
    loading: 'Wird geladen…',
    'datepicker.openCalendar': 'Kalender öffnen',
    'diff.none': 'Keine Feldänderungen.',
    'diff.changed': 'Geändert',
    'diff.added': 'Hinzugefügt',
    'diff.removed': 'Entfernt',
    'diff.label': 'Änderungen',
    'diff.before': 'vorher',
    'diff.after': 'nachher',
    'diff.noneCompact': 'Keine Änderungen',
    'table.scrollStart': 'Tabelle nach links scrollen',
    'table.scrollEnd': 'Tabelle nach rechts scrollen',
    'currency.invalid': 'Kein gültiger Betrag. Beispiel: 1.234,56 (höchstens 2 Nachkommastellen).',
    'copy.copy': 'Kopieren',
    'copy.copied': 'Kopiert',
    'move.up': 'Nach oben',
    'move.down': 'Nach unten',
    'options.empty': 'Keine Auswahl möglich',
    'range.from': 'von',
    'range.to': 'bis',
    'range.fromOnly': 'ab {value}',
    'range.toOnly': 'bis {value}',
    'range.apply': 'Anwenden',
    'range.reset': 'Zurücksetzen',
    'range.invalid': 'Der Anfang liegt nach dem Ende.',
    'rowMenu.trigger': 'Weitere Aktionen',
    'rowMenu.empty': 'Keine Aktionen möglich',
    'rowMenu.loading': 'Wird geladen …',
    'note.retry': 'Erneut versuchen',
    'screen.more': 'Mehr laden',
    'chat.deletedPerson': 'Gelöschte Person',
    'screen.select': 'Mehrere auswählen',
    'screen.selectRow': '{title} auswählen',
    'screen.selectStop': 'Auswahl beenden',
    'confirm.cancel': 'Abbrechen',
    'confirm.delete': 'Löschen',
    'selection.toolbar': 'Auswahl',
    'selection.selectAll': 'Alle wählen',
    'selection.clear': 'Auswahl aufheben',
    'selection.count': '{count} ausgewählt',
    'listDetail.back': 'Zur Liste',
    'screen.back': 'Zurück',
    'form.required': 'Bitte ausfüllen.',
    'form.maxLength': 'Höchstens {n} Zeichen.',
    'form.pattern': 'Das Format stimmt nicht.',
    'form.email': 'Keine gültige E-Mail-Adresse.',
    'form.url': 'Keine gültige Adresse. Beispiel: https://example.org',
    'form.iban': 'Keine gültige IBAN.',
    'form.number': 'Keine gültige Zahl.',
    'form.min': 'Mindestens {n}.',
    'form.max': 'Höchstens {n}.',
    'form.minDate': 'Frühestens am {d}.',
    'form.maxDate': 'Spätestens am {d}.',
    'form.range': 'Der Anfang liegt nach dem Ende.',
    'form.repeatMin': 'Mindestens {n} Einträge.',
    'form.repeatMax': 'Höchstens {n} Einträge.',
    'form.removeRow': 'Eintrag {n} entfernen',
    'form.pickFile': 'Auswählen',
    'form.removeFile': '{name} entfernen',
    'form.tooLarge': 'Die Datei ist zu groß.',
    'form.uploadFailed': 'Die Datei konnte nicht hochgeladen werden.',
    'form.drop': 'Dateien hierher ziehen oder auswählen',
    'form.uploading': 'Wird hochgeladen …',
    'form.wrongType': 'Diese Art von Datei geht hier nicht.',
    'form.leaveTitle': 'Änderungen verwerfen?',
    'form.leaveBody': 'Die Änderungen auf dieser Seite sind nicht gespeichert und gehen verloren.',
    'form.leaveConfirm': 'Verwerfen',
    'wizard.stepOf': 'Schritt {n} von {total}',
    'wizard.back': 'Zurück',
    'wizard.next': 'Weiter',
    'wizard.progress': 'Fortschritt',
    'wizard.empty': 'Noch keine Angaben.',
    'wizard.yes': 'Ja',
    'wizard.invalid': 'Bitte prüfe die markierten Felder.',
    'settings.save': 'Speichern',
    'settings.discard': 'Verwerfen',
    'public.crumbs': 'Pfad',
    'search.clear': 'Suche leeren',
    'search.results': '{n} Treffer',
    'search.resultsOne': '1 Treffer',
    'search.none': 'Keine Treffer',
    'avatar.more': '{count} weitere',
    'viewer.close': 'Vorschau schließen',
    'viewer.previous': 'Vorherige Datei',
    'viewer.next': 'Nächste Datei',
    'viewer.position': '{n} von {total}',
    'viewer.error': 'Die Datei kann nicht angezeigt werden.',
    'viewer.noPreview': 'Für diese Datei gibt es keine Vorschau.',
    'editorTable.columnMenu': 'Spalte',
    'editorTable.rowMenu': 'Zeile',
    'editorSlash.menu': 'Befehle',
    'editorTable.menu': 'Tabelle',
    'editorTable.insertColumnLeft': 'Spalte links einfügen',
    'editorTable.insertColumnRight': 'Spalte rechts einfügen',
    'editorTable.deleteColumn': 'Spalte löschen',
    'editorTable.insertRowAbove': 'Zeile oberhalb einfügen',
    'editorTable.insertRowBelow': 'Zeile unterhalb einfügen',
    'editorTable.deleteRow': 'Zeile löschen',
    'editorTable.addRow': 'Zeile hinzufügen',
    'editorSelection.toolbar': 'Format der Auswahl',
    'editorSelection.bold': 'Fett',
    'editorSelection.italic': 'Kursiv',
    'editorSelection.blackout': 'Schwärzen',
    'editorTable.addColumn': 'Spalte hinzufügen',
    'editorTable.delete': 'Tabelle löschen',
    'editorDocument.open': 'PDF öffnen: {name}',
    'editorDocument.pages': '{n} Seiten',
    'editorDocument.page': '1 Seite',
    'pwa.updateReady': 'Eine neue Version der App ist bereit.',
    'pwa.reload': 'Neu laden',
    'pwa.offline': 'Keine Verbindung',
    'shell.skip': 'Zum Inhalt springen',
    'shell.mainNav': 'Hauptnavigation',
    'shell.more': 'Mehr',
    'shell.search': 'Suche',
    'shell.brand': '{name}, Start',
    'shell.markNew': 'neu',
    'shell.markWarn': 'Achtung',
    'menu.help': 'Hilfe',
    'menu.a11y': 'Barrierefreiheit',
    'menu.display': 'Darstellung',
    'menu.display.reset': 'Systemeinstellungen verwenden',
    'menu.display.dark': 'Dunkles Design',
    'menu.display.motion': 'Weniger Bewegung',
    'menu.display.transparency': 'Weniger Transparenz',
    'menu.display.contrast': 'Mehr Kontrast',
    'menu.display.veryHigh': 'Hoher Kontrast',
    'menu.statement': 'Erklärung zur Barrierefreiheit',
    'menu.reportBarrier': 'Barriere melden',
    'account.signedInAs': 'Angemeldet als',
    'account.language': 'Sprache',
    'account.darkMode': 'Dunkles Design',
    'account.logout': 'Abmelden',
    'account.open': 'Konto: {name}',
    'account.region': 'Konto',
    'palette.title': 'Suche',
    'palette.placeholder': 'Suchen …',
    'palette.close': 'Suche schließen',
    'palette.empty': 'Nichts gefunden.',
    'palette.pages': 'Seiten',
    'palette.truncated': 'Es gibt weitere Treffer. Suchbegriff eingrenzen.',
    'palette.keysSelect': 'Auswählen',
    'palette.keysOpen': 'Öffnen',
    'palette.archived': 'Archiviert',
    'meetings.agenda.top': 'TOP {n}',
    'meetings.dock.of': '{n} von {m}',
    'meetings.dock.yourVote': 'Deine Stimme',
    'meetings.vote.card.cancelled': 'Abstimmung abgebrochen',
    'meetings.vote.card.draft': 'Abstimmung vorbereitet',
    'vote.majority.absolute': 'Absolute Mehrheit',
    'vote.majority.members_majority': 'Mehrheit der Mitglieder',
    'vote.majority.members_two_thirds': 'Zweidrittelmehrheit der Mitglieder',
    'vote.majority.simple': 'Einfache Mehrheit',
    'vote.majority.two_thirds': 'Zweidrittelmehrheit',
    'vote.majorityCast.absolute': 'Absolute Mehrheit der abgegebenen Stimmen',
    'vote.majorityCast.members_majority': 'Mehrheit der Mitglieder',
    'vote.majorityCast.members_two_thirds': 'Zweidrittelmehrheit der Mitglieder',
    'vote.majorityCast.simple': 'Einfache Mehrheit der abgegebenen Stimmen',
    'vote.majorityCast.two_thirds': 'Zweidrittelmehrheit der abgegebenen Stimmen',
    'action.cancel': 'Abbrechen',
    'action.close': 'Schließen',
    'action.remove': 'Entfernen',
    'meetings.agenda.done': 'Erledigt',
    'meetings.agenda.kindApplication': 'Antrag',
    'meetings.agenda.nonPublicLabel': 'Nicht öffentlich (NÖ)',
    'meetings.agenda.rename': 'TOP umbenennen',
    'meetings.agenda.renamePlaceholder': 'TOP-Titel …',
    'meetings.agenda.untitled': 'Unbenannter TOP',
    'meetings.attendance.reset': 'Auf „Offen“ zurücksetzen',
    'meetings.dock.protokollantIs': 'Protokoll: {name}',
    'meetings.editor.modeRaw': 'Markdown',
    'meetings.editor.toolbar': 'Format',
    'todos.linkKind.application': 'Antrag',
    'calendar.answer.accept': 'Zusage',
    'calendar.answer.decline': 'Absage',
    'calendar.answer.tentative': 'Vorbehalt',
    'calendar.kind.appointment': 'Termin',
    'calendar.kind.card': 'Karte',
    'calendar.kind.external': 'Extern',
    'calendar.kind.meeting': 'Sitzung',
    'admin.common.label': 'Bezeichnung',
    'admin.form.metric.amount': 'Betrag (Budget)',
    'admin.form.type.budget_select': 'Kostenstellen-Auswahl',
    'admin.form.type.checkbox': 'Kontrollkästchen',
    'admin.form.type.computed': 'Berechnetes Feld',
    'admin.form.type.currency': 'Betrag (€)',
    'admin.form.type.date': 'Datum',
    'admin.form.type.daterange': 'Zeitraum',
    'admin.form.type.email': 'E-Mail',
    'admin.form.type.file': 'Datei-Anhang',
    'admin.form.type.funding': 'Beantragte Förderung (€)',
    'admin.form.type.gremium_select': 'Gremium-Auswahl',
    'admin.form.type.iban': 'IBAN',
    'admin.form.type.markdown': 'Hinweistext (Markdown)',
    'admin.form.type.multiselect': 'Auswahl (mehrfach)',
    'admin.form.type.number': 'Zahl',
    'admin.form.type.positions': 'Kostenpositionen',
    'admin.form.type.section': 'Abschnitt (neuer Schritt)',
    'admin.form.type.select': 'Auswahl (einfach)',
    'admin.form.type.table': 'Tabelle',
    'admin.form.type.text': 'Kurztext',
    'admin.form.type.textarea': 'Langtext',
    'admin.forms.rules.block': 'Blockiert das Einreichen',
    'admin.forms.rules.warn': 'Nur Hinweis',
    'admin.common.key': 'Schlüssel',
    'admin.flow.guardCombinator.and': 'UND (alle)',
    'admin.flow.guardCombinator.not': 'NICHT',
    'admin.flow.guardCombinator.or': 'ODER (mind. eine)',
    'admin.flow.guardDesc.and': 'alle Bedingungen erfüllt',
    'admin.flow.guardDesc.not': 'die Bedingung ist nicht erfüllt',
    'admin.flow.guardDesc.or': 'mindestens eine Bedingung erfüllt',
    'admin.flow.guardOp.actorIsApplicant': 'Akteur ist Antragsteller:in',
    'admin.flow.guardOp.applicantCommitteeIs': 'Antragsteller im Gremium',
    'admin.flow.guardOp.applicantRoleIs': 'Antragsteller hat Rolle',
    'admin.flow.guardOp.applicationTypeIs': 'Antragsart ist',
    'admin.flow.guardOp.attachmentPresent': 'Anhang vorhanden',
    'admin.flow.guardOp.budgetFitsApplication': 'Budget reicht für Antrag',
    'admin.flow.guardOp.budgetHasDecisionGremium': 'Kostenstelle hat entscheidendes Gremium',
    'admin.flow.guardOp.budgetIs': 'Kostenstelle ist',
    'admin.flow.guardOp.compare': 'Feld-Vergleich',
    'admin.flow.guardOp.fieldsComplete': 'Pflichtfelder vollständig',
    'admin.flow.guardOp.hasField': 'Feld ist ausgefüllt',
    'admin.flow.guardOp.isInCommittee': 'Akteur im Gremium',
    'admin.flow.guardOp.isInVoteGremium': 'Akteur im Gremium der Abstimmung',
    'admin.flow.guardOp.manual': 'Nur manuell',
    'admin.flow.guardOp.permissionIs': 'Akteur hat Berechtigung',
    'admin.flow.guardOp.roleIs': 'Rolle des Akteurs ist',
    'admin.flow.guardOp.voteResult': 'Abstimmungsergebnis ist',
  },
  en: {
    'dialog.close': 'Close',
    loading: 'Loading…',
    'datepicker.openCalendar': 'Open calendar',
    'diff.none': 'No field changes.',
    'diff.changed': 'Changed',
    'diff.added': 'Added',
    'diff.removed': 'Removed',
    'diff.label': 'Changes',
    'diff.before': 'before',
    'diff.after': 'after',
    'diff.noneCompact': 'No changes',
    'table.scrollStart': 'Scroll the table left',
    'table.scrollEnd': 'Scroll the table right',
    'currency.invalid': 'Not a valid amount. Example: 1,234.56 (at most 2 decimals).',
    'copy.copy': 'Copy',
    'copy.copied': 'Copied',
    'move.up': 'Move up',
    'move.down': 'Move down',
    'options.empty': 'No options available',
    'range.from': 'from',
    'range.to': 'to',
    'range.fromOnly': 'from {value}',
    'range.toOnly': 'up to {value}',
    'range.apply': 'Apply',
    'range.reset': 'Reset',
    'range.invalid': 'The start is after the end.',
    'rowMenu.trigger': 'More actions',
    'rowMenu.empty': 'No actions available',
    'rowMenu.loading': 'Loading …',
    'note.retry': 'Try again',
    'screen.more': 'Load more',
    'chat.deletedPerson': 'Deleted person',
    'screen.select': 'Select several',
    'screen.selectRow': 'Select {title}',
    'screen.selectStop': 'End selection',
    'confirm.cancel': 'Cancel',
    'confirm.delete': 'Delete',
    'selection.toolbar': 'Selection',
    'selection.selectAll': 'Select all',
    'selection.clear': 'Clear selection',
    'selection.count': '{count} selected',
    'listDetail.back': 'Back to list',
    'screen.back': 'Back',
    'form.required': 'Please fill in.',
    'form.maxLength': 'At most {n} characters.',
    'form.pattern': 'The format is not valid.',
    'form.email': 'Not a valid e-mail address.',
    'form.url': 'Not a valid address. Example: https://example.org',
    'form.iban': 'Not a valid IBAN.',
    'form.number': 'Not a valid number.',
    'form.min': 'At least {n}.',
    'form.max': 'At most {n}.',
    'form.minDate': 'Not before {d}.',
    'form.maxDate': 'Not after {d}.',
    'form.range': 'The start is after the end.',
    'form.repeatMin': 'At least {n} entries.',
    'form.repeatMax': 'At most {n} entries.',
    'form.removeRow': 'Remove entry {n}',
    'form.pickFile': 'Choose',
    'form.removeFile': 'Remove {name}',
    'form.tooLarge': 'The file is too large.',
    'form.uploadFailed': 'The file could not be uploaded.',
    'form.drop': 'Drag files here or choose them',
    'form.uploading': 'Uploading …',
    'form.wrongType': 'This kind of file is not allowed here.',
    'form.leaveTitle': 'Discard the changes?',
    'form.leaveBody': 'The changes on this page are not saved and will be lost.',
    'form.leaveConfirm': 'Discard',
    'wizard.stepOf': 'Step {n} of {total}',
    'wizard.back': 'Back',
    'wizard.next': 'Next',
    'wizard.progress': 'Progress',
    'wizard.empty': 'No details yet.',
    'wizard.yes': 'Yes',
    'wizard.invalid': 'Please check the marked fields.',
    'settings.save': 'Save',
    'settings.discard': 'Discard',
    'public.crumbs': 'Path',
    'search.clear': 'Clear search',
    'search.results': '{n} results',
    'search.resultsOne': '1 result',
    'search.none': 'No results',
    'avatar.more': '{count} more',
    'viewer.close': 'Close preview',
    'viewer.previous': 'Previous file',
    'viewer.next': 'Next file',
    'viewer.position': '{n} of {total}',
    'viewer.error': 'The file cannot be displayed.',
    'viewer.noPreview': 'There is no preview for this file.',
    'editorTable.columnMenu': 'Column',
    'editorTable.rowMenu': 'Row',
    'editorSlash.menu': 'Commands',
    'editorTable.menu': 'Table',
    'editorTable.insertColumnLeft': 'Insert column left',
    'editorTable.insertColumnRight': 'Insert column right',
    'editorTable.deleteColumn': 'Delete column',
    'editorTable.insertRowAbove': 'Insert row above',
    'editorTable.insertRowBelow': 'Insert row below',
    'editorTable.deleteRow': 'Delete row',
    'editorTable.addRow': 'Add row',
    'editorSelection.toolbar': 'Format of the selection',
    'editorSelection.bold': 'Bold',
    'editorSelection.italic': 'Italic',
    'editorSelection.blackout': 'Black out',
    'editorTable.addColumn': 'Add column',
    'editorTable.delete': 'Delete table',
    'editorDocument.open': 'Open PDF: {name}',
    'editorDocument.pages': '{n} pages',
    'editorDocument.page': '1 page',
    'pwa.updateReady': 'A new version of the app is ready.',
    'pwa.reload': 'Reload',
    'pwa.offline': 'You are offline',
    'shell.skip': 'Skip to content',
    'shell.mainNav': 'Main navigation',
    'shell.more': 'More',
    'shell.search': 'Search',
    'shell.brand': '{name}, home',
    'shell.markNew': 'new',
    'shell.markWarn': 'attention',
    'menu.help': 'Help',
    'menu.a11y': 'Accessibility',
    'menu.display': 'Display',
    'menu.display.reset': 'Use system settings',
    'menu.display.dark': 'Dark theme',
    'menu.display.motion': 'Less motion',
    'menu.display.transparency': 'Less transparency',
    'menu.display.contrast': 'More contrast',
    'menu.display.veryHigh': 'High contrast',
    'menu.statement': 'Accessibility statement',
    'menu.reportBarrier': 'Report a barrier',
    'account.signedInAs': 'Signed in as',
    'account.language': 'Language',
    'account.darkMode': 'Dark theme',
    'account.logout': 'Sign out',
    'account.open': 'Account: {name}',
    'account.region': 'Account',
    'palette.title': 'Search',
    'palette.placeholder': 'Search …',
    'palette.close': 'Close search',
    'palette.empty': 'Nothing found.',
    'palette.pages': 'Pages',
    'palette.truncated': 'There are more results. Narrow the query.',
    'palette.keysSelect': 'Select',
    'palette.keysOpen': 'Open',
    'palette.archived': 'Archived',
    'meetings.agenda.top': 'Item {n}',
    'meetings.dock.of': '{n} of {m}',
    'meetings.dock.yourVote': 'Your vote',
    'meetings.vote.card.cancelled': 'Vote cancelled',
    'meetings.vote.card.draft': 'Vote prepared',
    'vote.majority.absolute': 'Absolute majority',
    'vote.majority.members_majority': 'Majority of the members',
    'vote.majority.members_two_thirds': 'Two-thirds majority of the members',
    'vote.majority.simple': 'Simple majority',
    'vote.majority.two_thirds': 'Two-thirds majority',
    'vote.majorityCast.absolute': 'Absolute majority of the votes cast',
    'vote.majorityCast.members_majority': 'Majority of the members',
    'vote.majorityCast.members_two_thirds': 'Two-thirds majority of the members',
    'vote.majorityCast.simple': 'Simple majority of the votes cast',
    'vote.majorityCast.two_thirds': 'Two-thirds majority of the votes cast',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.remove': 'Remove',
    'meetings.agenda.done': 'Done',
    'meetings.agenda.kindApplication': 'Application',
    'meetings.agenda.nonPublicLabel': 'Non-public',
    'meetings.agenda.rename': 'Rename item',
    'meetings.agenda.renamePlaceholder': 'Item title …',
    'meetings.agenda.untitled': 'Untitled item',
    'meetings.attendance.reset': 'Reset to “open”',
    'meetings.dock.protokollantIs': 'Minutes: {name}',
    'meetings.editor.modeRaw': 'Markdown',
    'meetings.editor.toolbar': 'Format',
    'todos.linkKind.application': 'Application',
    'calendar.answer.accept': 'Accept',
    'calendar.answer.decline': 'Decline',
    'calendar.answer.tentative': 'Tentative',
    'calendar.kind.appointment': 'Appointment',
    'calendar.kind.card': 'Card',
    'calendar.kind.external': 'External',
    'calendar.kind.meeting': 'Meeting',
    'admin.common.label': 'Label',
    'admin.form.metric.amount': 'Amount (budget)',
    'admin.form.type.budget_select': 'Cost-centre picker',
    'admin.form.type.checkbox': 'Checkbox',
    'admin.form.type.computed': 'Computed field',
    'admin.form.type.currency': 'Amount (€)',
    'admin.form.type.date': 'Date',
    'admin.form.type.daterange': 'Date range',
    'admin.form.type.email': 'Email',
    'admin.form.type.file': 'File attachment',
    'admin.form.type.funding': 'Requested funding (€)',
    'admin.form.type.gremium_select': 'Committee picker',
    'admin.form.type.iban': 'IBAN',
    'admin.form.type.markdown': 'Info text (Markdown)',
    'admin.form.type.multiselect': 'Choice (multiple)',
    'admin.form.type.number': 'Number',
    'admin.form.type.positions': 'Cost positions',
    'admin.form.type.section': 'Section (new step)',
    'admin.form.type.select': 'Choice (single)',
    'admin.form.type.table': 'Table',
    'admin.form.type.text': 'Short text',
    'admin.form.type.textarea': 'Long text',
    'admin.forms.rules.block': 'Blocks the submit',
    'admin.forms.rules.warn': 'Warning only',
    'admin.common.key': 'Key',
    'admin.flow.guardCombinator.and': 'AND (all)',
    'admin.flow.guardCombinator.not': 'NOT',
    'admin.flow.guardCombinator.or': 'OR (any)',
    'admin.flow.guardDesc.and': 'all conditions hold',
    'admin.flow.guardDesc.not': 'the condition does not hold',
    'admin.flow.guardDesc.or': 'at least one condition holds',
    'admin.flow.guardOp.actorIsApplicant': 'Actor is the applicant',
    'admin.flow.guardOp.applicantCommitteeIs': 'Applicant in committee',
    'admin.flow.guardOp.applicantRoleIs': 'Applicant has role',
    'admin.flow.guardOp.applicationTypeIs': 'Application type is',
    'admin.flow.guardOp.attachmentPresent': 'Attachment present',
    'admin.flow.guardOp.budgetFitsApplication': 'Budget fits application',
    'admin.flow.guardOp.budgetHasDecisionGremium': 'Cost centre has a deciding committee',
    'admin.flow.guardOp.budgetIs': 'Cost centre is',
    'admin.flow.guardOp.compare': 'Field comparison',
    'admin.flow.guardOp.fieldsComplete': 'Required fields complete',
    'admin.flow.guardOp.hasField': 'Field is filled',
    'admin.flow.guardOp.isInCommittee': 'Actor in committee',
    'admin.flow.guardOp.isInVoteGremium': 'Actor in the committee of the vote',
    'admin.flow.guardOp.manual': 'Manual only',
    'admin.flow.guardOp.permissionIs': 'Actor has permission',
    'admin.flow.guardOp.roleIs': "Actor's role is",
    'admin.flow.guardOp.voteResult': 'Vote result is',
  },
};

/** The texts of the views that were created (002237). */
class RegisteredTexts {
  private seen: ReadonlySet<object> = new Set();
  messages: Readonly<Record<UiLang, Partial<UiKitMessages>>> = {
    de: {},
    en: {},
  };

  add(texts: Readonly<Record<UiLang, Partial<UiKitMessages>>>): void {
    if (this.seen.has(texts)) return;
    this.seen = new Set([...this.seen, texts]);
    this.messages = {
      de: { ...this.messages.de, ...texts.de },
      en: { ...this.messages.en, ...texts.en },
    };
  }
}

const registered = new RegisteredTexts();

/**
 * Add the texts of a view to the kit catalogue and return them. Each view calls it when it is
 * created, so its texts load in the chunk of the view and not in the start bundle of the app.
 * A second call with the same texts does nothing.
 */
export function registerUiKitTexts<K extends UiKitTextKey>(texts: UiKitTexts<K>): UiKitTexts<K> {
  registered.add(texts);
  return texts;
}

/**
 * The kit's i18n contract. The host app provides one (see {@link provideUiKit} /
 * {@link uiKitIntlFromLang}) to drive language + strings from its own system; if it
 * does nothing, a built-in DE/EN {@link DefaultUiKitIntl} is used.
 */
export interface UiKitIntl {
  /** Active language as a signal — components react to changes without re-render hacks. */
  readonly lang: Signal<UiLang>;
  /**
   * The `Intl` tag for numbers and dates (`de-DE` / `en-GB`). Every `Intl.NumberFormat`
   * and `Intl.DateTimeFormat` of the kit reads it, never the bare {@link lang}.
   */
  readonly formatLocale: Signal<string>;
  translate(key: UiKitTextKey, params?: Record<string, string | number>): string;
}

const DEFAULT_LANG: UiLang = 'de';

function detectLang(): UiLang {
  if (typeof navigator === 'undefined') return DEFAULT_LANG;
  return navigator.language.slice(0, 2).toLowerCase() === 'en' ? 'en' : 'de';
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export interface UiKitIntlOptions {
  /** External language signal (e.g. the host app's locale). Omit for an internal, settable one. */
  readonly lang?: Signal<UiLang>;
  /**
   * External format-locale signal (e.g. the host app's `Intl` tag). Omit to map the
   * language through {@link UI_KIT_FORMAT_LOCALES}.
   */
  readonly formatLocale?: Signal<string>;
  /** Partial message overrides merged over the built-in DE/EN catalogue. */
  readonly messages?: Partial<Record<UiLang, Partial<UiKitMessages>>>;
}

/**
 * Default {@link UiKitIntl}: ships the built-in DE/EN catalogue. Language follows an
 * injected signal when given (so it tracks the host app's locale), otherwise an
 * internal signal seeded from the browser and settable via {@link setLang}.
 */
export class DefaultUiKitIntl implements UiKitIntl {
  private readonly internalLang = signal<UiLang>(detectLang());
  readonly lang: Signal<UiLang>;
  readonly formatLocale: Signal<string>;
  private readonly overrides: Partial<Record<UiLang, Partial<UiKitMessages>>>;

  constructor(options: UiKitIntlOptions = {}) {
    this.lang = options.lang ?? this.internalLang.asReadonly();
    const lang = this.lang;
    this.formatLocale = options.formatLocale ?? computed(() => UI_KIT_FORMAT_LOCALES[lang()]);
    this.overrides = options.messages ?? {};
  }

  /** Set the language. Only effective when no external `lang` signal was provided. */
  setLang(lang: UiLang): void {
    this.internalLang.set(lang);
  }

  translate(key: UiKitTextKey, params?: Record<string, string | number>): string {
    const raw = this.text(this.lang(), key) ?? this.text(DEFAULT_LANG, key) ?? key;
    return interpolate(raw, params);
  }

  /** The override of the app, else the text of a registered view, else the core text. */
  private text(lang: UiLang, key: UiKitTextKey): string | undefined {
    const core: Partial<UiKitMessages> = UI_KIT_DEFAULT_MESSAGES[lang];
    return this.overrides[lang]?.[key] ?? registered.messages[lang][key] ?? core[key];
  }
}

/** DI token for the kit's i18n. Defaults to a built-in DE/EN {@link DefaultUiKitIntl}. */
export const UI_KIT_INTL = new InjectionToken<UiKitIntl>('UI_KIT_INTL', {
  providedIn: 'root',
  factory: () => new DefaultUiKitIntl(),
});

/**
 * Build a {@link UiKitIntl} whose language tracks the given signal (e.g. an app locale).
 * Pass `formatLocale` when the host app has its own `Intl` tag, so kit numbers and dates
 * format like the app.
 */
export function uiKitIntlFromLang(
  lang: Signal<UiLang>,
  messages?: UiKitIntlOptions['messages'],
  formatLocale?: Signal<string>,
): UiKitIntl {
  return new DefaultUiKitIntl({ lang, messages, formatLocale });
}

/** Options of {@link provideUiKit}. */
export interface UiKitOptions extends UiKitIntlOptions {
  /**
   * A ready {@link UiKitIntl}, or a factory for one. It wins over `lang`, `formatLocale` and
   * `messages`. The factory runs in an injection context when the kit first needs its
   * texts, so it can `inject()` the i18n service of the app, and the order of the providers
   * does not matter.
   */
  readonly intl?: UiKitIntl | (() => UiKitIntl);
  /**
   * The settings of the `ThemeService`: the storage key of the preference, the manifest
   * URL per theme and the page background per theme. Omit a field to keep its default.
   */
  readonly theme?: UiKitThemeOptions;
}

/**
 * Register the kit's i18n and theme settings. Pass a ready {@link UiKitIntl} via `intl`, or
 * `lang`/`messages` to configure the default implementation. With no argument the
 * built-in catalogue and the default theme settings are used.
 */
export function provideUiKit(options: UiKitOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: UI_KIT_INTL,
      useFactory: (): UiKitIntl => {
        const intl = options.intl;
        if (typeof intl === 'function') return intl();
        return intl ?? new DefaultUiKitIntl(options);
      },
    },
    { provide: UI_KIT_THEME, useValue: uiKitThemeConfig(options.theme) },
  ]);
}
