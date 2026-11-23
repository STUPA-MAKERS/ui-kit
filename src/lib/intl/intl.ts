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
export const UI_KIT_FORMAT_LOCALES: Record<UiLang, string> = { de: 'de-DE', en: 'en-GB' };

/** Every translatable string the kit renders itself. */
export type UiKitTextKey =
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
  | 'activity.loading'
  | 'activity.new'
  | 'activity.more'
  | 'chat.attach'
  | 'chat.cancel'
  | 'chat.copy'
  | 'chat.delete'
  | 'chat.deleteConfirm'
  | 'chat.deleteShort'
  | 'chat.deleteTitle'
  | 'chat.deletedPerson'
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
  | 'chat.yesterday'
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
  | 'editorTable.menu'
  | 'editorTable.insertColumnLeft'
  | 'editorTable.insertColumnRight'
  | 'editorTable.deleteColumn'
  | 'editorTable.insertRowAbove'
  | 'editorTable.insertRowBelow'
  | 'editorTable.deleteRow'
  | 'editorTable.addRow'
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
  | 'meetings.agenda.top'
  | 'meetings.dock.insertResult'
  | 'meetings.dock.of'
  | 'meetings.dock.yourVote'
  | 'meetings.toast.actionFailed'
  | 'meetings.vote.attempt'
  | 'meetings.vote.attemptElection'
  | 'meetings.vote.cancel'
  | 'meetings.vote.card.cancelled'
  | 'meetings.vote.card.closed'
  | 'meetings.vote.card.draft'
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
  | 'voting.progress.eligible'
  | 'action.cancel'
  | 'action.close'
  | 'action.remove'
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
  | 'meetings.agenda.done'
  | 'meetings.agenda.duration'
  | 'meetings.agenda.durationEdit'
  | 'meetings.agenda.durationRange'
  | 'meetings.agenda.durationUnit'
  | 'meetings.agenda.empty'
  | 'meetings.agenda.kindApplication'
  | 'meetings.agenda.kindTodo'
  | 'meetings.agenda.link'
  | 'meetings.agenda.markDone'
  | 'meetings.agenda.markOpen'
  | 'meetings.agenda.moveDown'
  | 'meetings.agenda.moveUp'
  | 'meetings.agenda.nonPublic'
  | 'meetings.agenda.nonPublicLabel'
  | 'meetings.agenda.planActual'
  | 'meetings.agenda.planMinutes'
  | 'meetings.agenda.planStart'
  | 'meetings.agenda.remove'
  | 'meetings.agenda.removeBlocked'
  | 'meetings.agenda.removeConfirm'
  | 'meetings.agenda.removeNeedsVoteRight'
  | 'meetings.agenda.removeTitle'
  | 'meetings.agenda.rename'
  | 'meetings.agenda.renamePlaceholder'
  | 'meetings.agenda.rowMenu'
  | 'meetings.agenda.title'
  | 'meetings.agenda.todo'
  | 'meetings.agenda.untitled'
  | 'meetings.agenda.voteOpen'
  | 'meetings.attendance.absent'
  | 'meetings.attendance.bySession'
  | 'meetings.attendance.empty'
  | 'meetings.attendance.excused'
  | 'meetings.attendance.note'
  | 'meetings.attendance.notePlaceholder'
  | 'meetings.attendance.present'
  | 'meetings.attendance.reset'
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
  | 'meetings.dock.protokollantIs'
  | 'meetings.dock.protokollantMissing'
  | 'meetings.dock.searchMember'
  | 'meetings.dock.top'
  | 'meetings.dock.tops'
  | 'meetings.dock.topsOne'
  | 'meetings.dock.topsPrepared'
  | 'meetings.editor.modeRaw'
  | 'meetings.editor.toolbar'
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
  | 'participant.top.protocol'
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
  | 'todos.link.top'
  | 'todos.linkKind.application'
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

export type UiKitMessages = Record<UiKitTextKey, string>;

/** Built-in DE/EN strings — the kit renders identically out of the box. */
export const UI_KIT_DEFAULT_MESSAGES: Record<UiLang, UiKitMessages> = {
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
    'activity.loading': 'Aktivität wird geladen',
    'activity.new': 'Neu',
    'activity.more': 'Mehr laden',
    'chat.attach': 'Datei anhängen',
    'chat.cancel': 'Abbrechen',
    'chat.copy': 'Text kopieren',
    'chat.delete': 'Nachricht löschen',
    'chat.deleteConfirm': 'Die Nachricht wird gelöscht. Das lässt sich nicht rückgängig machen.',
    'chat.deleteShort': 'Löschen',
    'chat.deleteTitle': 'Nachricht löschen?',
    'chat.deletedPerson': 'Gelöschte Person',
    'chat.discard': 'Verwerfen',
    'chat.download': 'Herunterladen',
    'chat.drop': 'Dateien zum Anhängen ablegen',
    'chat.edit': 'Nachricht bearbeiten',
    'chat.editShort': 'Bearbeiten',
    'chat.edited': 'bearbeitet',
    'chat.empty': 'Noch keine Nachrichten.',
    'chat.error.delete': 'Die Datei konnte nicht entfernt werden.',
    'chat.error.fileTooLarge': 'Datei zu groß (max. {mb} MB).',
    'chat.error.fileType': 'Dieser Dateityp ist nicht erlaubt.',
    'chat.error.tooManyFiles': 'Höchstens {max} Dateien pro Nachricht.',
    'chat.error.upload': 'Die Datei konnte nicht hochgeladen werden.',
    'chat.failed': 'Nicht gesendet',
    'chat.fileLost': 'Nicht mehr vorhanden',
    'chat.internal': 'Intern',
    'chat.loading': 'Nachrichten werden geladen …',
    'chat.log': 'Verlauf',
    'chat.mentions': 'Personen erwähnen',
    'chat.newCount': '{count} neue',
    'chat.newMessages.one': '1 neue Nachricht',
    'chat.newMessages.other': '{count} neue Nachrichten',
    'chat.ownMessage': 'Deine Nachricht · {time}',
    'chat.pastedImage': 'Bild',
    'chat.placeholder': 'Nachricht schreiben …',
    'chat.public': 'Öffentlich',
    'chat.removeFile': '{name} entfernen',
    'chat.removeFileAction': 'Entfernen',
    'chat.removeFileConfirm': '„{name}“ wird entfernt. Das lässt sich nicht rückgängig machen.',
    'chat.removeFileTitle': 'Anhang entfernen?',
    'chat.retry': 'Erneut senden',
    'chat.save': 'Speichern',
    'chat.scan.clean': 'Gescannt',
    'chat.scan.quarantined': 'Quarantäne',
    'chat.scan.scanning': 'In Prüfung',
    'chat.send': 'Senden',
    'chat.sending': 'wird gesendet …',
    'chat.today': 'Heute',
    'chat.uploading': 'wird hochgeladen …',
    'chat.visibility': 'Sichtbarkeit',
    'chat.yesterday': 'Gestern',
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
    'editorTable.menu': 'Tabelle',
    'editorTable.insertColumnLeft': 'Spalte links einfügen',
    'editorTable.insertColumnRight': 'Spalte rechts einfügen',
    'editorTable.deleteColumn': 'Spalte löschen',
    'editorTable.insertRowAbove': 'Zeile oberhalb einfügen',
    'editorTable.insertRowBelow': 'Zeile unterhalb einfügen',
    'editorTable.deleteRow': 'Zeile löschen',
    'editorTable.addRow': 'Zeile hinzufügen',
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
    'circular.status.objection': 'Abgebrochen durch Widerspruch',
    'election.abstentions.one': '1 Enthaltung',
    'election.abstentions.other': '{n} Enthaltungen',
    'election.abstentionsLabel': 'Enthaltungen',
    'election.ballot.abstainAll': 'Ganz enthalten',
    'election.ballot.counter': '{n} von {m} Stimmen vergeben',
    'election.ballot.sole': 'Zur Wahl steht: {name}',
    'election.candidate.erased': 'Gelöscht',
    'election.kind': 'Wahl',
    'election.lot.cancel': 'Abbrechen',
    'election.lot.confirm': 'Jetzt Los ziehen',
    'election.lot.confirmHint': 'Das Los ist endgültig und lässt sich nicht zurücknehmen.',
    'election.lot.draw': 'Los ziehen',
    'election.lot.drawn': 'Das Los ist gezogen.',
    'election.lot.note': 'Durch Los entschieden: {names}',
    'election.lot.pending': 'Gleichstand zwischen {names}. Das Los entscheidet.',
    'election.lot.waiting': 'Die Sitzungsleitung zieht das Los.',
    'election.names.one': '1 Name',
    'election.names.other': '{n} Namen',
    'election.nextRound.created': 'Der nächste Wahlgang ist vorbereitet.',
    'election.nextRound.lotNote': 'Das Los bestimmt für den dritten Wahlgang: {names}',
    'election.nextRound.second': 'Zweiter Wahlgang',
    'election.nextRound.third': 'Dritter Wahlgang',
    'election.result.elected': 'Gewählt: {names}',
    'election.result.noMajority': 'Keine Mehrheit der Mitglieder',
    'election.result.nobody': 'Niemand gewählt',
    'election.result.runoff': 'Stichwahl nötig',
    'election.result.tie': 'Gleichstand: das Los steht aus',
    'election.runoff.banner': 'Gleichstand an der Grenze: Stichwahl um {seats} zwischen {names}.',
    'election.runoff.exists': 'Die Stichwahl ist angelegt.',
    'election.runoffRound': 'Stichwahl ({n}. Wahlgang)',
    'election.seats.one': '1 Posten',
    'election.seats.other': '{n} Posten',
    'election.status.elected': 'Gewählt',
    'election.status.noMajority': 'Keine Mehrheit',
    'election.status.rejected': 'Niemand gewählt',
    'election.status.runoff': 'Stichwahl',
    'election.status.tie': 'Los steht aus',
    'election.tag.elected': 'gewählt',
    'election.tag.tie': 'Gleichstand',
    'guests.vote.cast': 'Abgegeben',
    'guests.vote.castN': 'Abgegeben {n}',
    'guests.vote.composition': '{members} Mitglieder + {guests} Gäste anwesend',
    'guests.vote.majorityOfCast': 'Mehrheit der abgegebenen Stimmen',
    'guests.vote.notReached': 'nicht erreicht',
    'guests.vote.reached': 'erreicht',
    'guests.vote.resultCaption': 'Ergebnis ohne Quorum',
    'meetings.agenda.top': 'TOP {n}',
    'meetings.dock.insertResult': 'Ins Protokoll übernehmen',
    'meetings.dock.of': '{n} von {m}',
    'meetings.dock.yourVote': 'Deine Stimme',
    'meetings.toast.actionFailed': 'Aktion fehlgeschlagen.',
    'meetings.vote.attempt': '{n}. Abstimmung',
    'meetings.vote.attemptElection': '{n}. Wahlgang',
    'meetings.vote.cancel': 'Abstimmung abbrechen',
    'meetings.vote.card.cancelled': 'Abstimmung abgebrochen',
    'meetings.vote.card.closed': 'Abstimmung geschlossen',
    'meetings.vote.card.draft': 'Abstimmung vorbereitet',
    'meetings.vote.card.open': 'Abstimmung offen',
    'meetings.vote.close': 'Abstimmung schließen',
    'meetings.vote.delete': 'Beschlussfrage löschen',
    'meetings.vote.edit': 'Bearbeiten',
    'meetings.vote.endedAt': 'beendet {time}',
    'meetings.vote.kind.circular': 'Umlaufverfahren',
    'meetings.vote.menu': 'Aktionen der Abstimmung',
    'meetings.vote.open': 'Abstimmung öffnen',
    'meetings.vote.openBlocked': 'Erst die offene Abstimmung schließen oder abbrechen.',
    'meetings.vote.opensLater': 'Öffnen kannst du sie, sobald die Sitzung eröffnet ist.',
    'meetings.vote.progress': '{voted} von {present} Anwesenden haben abgestimmt',
    'meetings.vote.quorumCount': 'Quorum {n}',
    'meetings.vote.quorumPercent': 'Quorum {n} %',
    'meetings.vote.repeat': 'Erneut abstimmen',
    'meetings.vote.repeatElection': 'Wahlgang wiederholen',
    'meetings.vote.repeated': 'Wiederholt',
    'meetings.vote.rule.members_majority': 'Mehrheit der Mitglieder',
    'meetings.vote.rule.simple': 'Einfache Mehrheit',
    'meetings.vote.since': 'seit {time}',
    'meetings.vote.tally': 'Zwischenstand',
    'meetings.vote.untitled': 'Beschlussfrage',
    'meetings.voteResult.inProtocol': 'Im Protokoll',
    'meetings.voteStatus.cancelled': 'Abgebrochen',
    'meetings.voteStatus.closed': 'Geschlossen',
    'meetings.voteStatus.draft': 'Geplant',
    'meetings.voteStatus.open': 'Offen',
    'poll.answer.maybe': 'Vielleicht',
    'poll.ballot.counter': '{n} von höchstens {m} gewählt',
    'poll.ballot.submitDate': 'Antworten abgeben',
    'poll.caption': 'Umfrage · {mode}',
    'poll.mode.date': 'Terminumfrage',
    'poll.mode.multi': 'Mehrfachwahl',
    'poll.mode.multiMax': 'Mehrfachwahl, höchstens {n}',
    'poll.mode.single': 'Einzelwahl',
    'poll.options.one': '1 Option',
    'poll.options.other': '{n} Optionen',
    'poll.result.dateCaption': 'Zahl = Ja, (+n) = Vielleicht',
    'poll.result.dateRow': '{option}: {yes} Ja, {maybe} Vielleicht',
    'poll.result.footer': '{n} von {m} haben geantwortet',
    'poll.status.closed': 'Umfrage beendet',
    'poll.status.open': 'Umfrage offen',
    'vote.failedQuorum': 'Quorum nicht erreicht',
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
    'vote.option.abstain': 'Enthaltung',
    'vote.option.no': 'Nein',
    'vote.option.yes': 'Ja',
    'vote.result.passed': 'Angenommen',
    'vote.result.rejected': 'Abgelehnt',
    'vote.tally.quorum': 'Quorum',
    'vote.tally.quorumMet': 'erreicht',
    'vote.tally.quorumMissed': 'nicht erreicht',
    'voting.ballot.confirm': 'Stimme abgeben: {choice}',
    'voting.ballot.confirmCount': 'Stimmen abgeben ({count})',
    'voting.ballot.confirmEmpty': 'Stimme abgeben',
    'voting.ballot.confirmNames': '{label}: {names}',
    'voting.ballot.confirmProxy': 'Für {name} abgeben: {choice}',
    'voting.ballot.confirmProxyCount': 'Für {name} abgeben ({count})',
    'voting.ballot.confirmProxyEmpty': 'Für {name} abgeben',
    'voting.ballot.locked': 'Eine Änderung der Stimme ist nicht möglich.',
    'voting.ballot.own': 'Deine Stimme',
    'voting.ballot.ownWith': 'Deine Stimme, auch für {name}',
    'voting.ballot.ownWithCount': 'Deine Stimme, {count} Stimmrechte, auch für {name}',
    'voting.ballot.proxy': 'Als Vertretung für {name}',
    'voting.ballot.proxyCount': '{count} Stimmrechte als Vertretung für {name}',
    'voting.ballot.proxyDone': 'Für {name} abgegeben: {choice}',
    'voting.ballot.proxyDoneSecret': 'Für {name} abgegeben.',
    'voting.ballot.thanks': 'Danke! Deine Stimme: {choice}',
    'voting.ballot.thanksSecret': 'Danke! Deine Stimme ist abgegeben.',
    'voting.bars.label': 'Ergebnis, {cast} Stimmen',
    'voting.bars.row': '{option}: {count} Stimmen, {pct} %',
    'voting.beamer.votesOf': '{cast} von {eligible} Stimmen',
    'voting.cast.toast.alreadyVoted': 'Deine Stimme ist bereits abgegeben.',
    'voting.cast.toast.asUnit': 'Gib zuerst deine eigene Stimme ab. Sie zählt auch für die Vertretenen.',
    'voting.cast.toast.noDelegationInElection': 'In einer Wahl stimmst du nur für dich selbst ab.',
    'voting.live.closed': 'Abstimmung beendet: {subject}. {result}',
    'voting.live.opened': 'Abstimmung geöffnet: {subject}',
    'voting.live.vote': 'Abstimmung',
    'voting.panel.application': 'Antrag öffnen',
    'voting.panel.where': '{meeting} · TOP {n}',
    'voting.progress.eligible': '{voted} von {total} Stimmberechtigten haben abgestimmt',
    'action.cancel': 'Abbrechen',
    'action.close': 'Schließen',
    'action.remove': 'Entfernen',
    'action.save': 'Speichern',
    'delegation.toast.revokeFailed': 'Widerruf fehlgeschlagen.',
    'delegation.toast.revoked': 'Vertretung widerrufen.',
    'guests.dock.pending': '{n} offene Beitrittsanfragen',
    'guests.dock.present': 'Anwesend {n} + {g} Gäste',
    'guests.dock.presentShort': '{n} + {g} Gäste',
    'guests.sheet.guests': 'Gäste',
    'guests.sheet.members': 'Mitglieder',
    'guests.sheet.present': 'anwesend:',
    'guests.tab.guests': 'Gäste {n}',
    'guests.tab.guestsWatching': 'Gäste (zuschauend) {n}',
    'guests.tab.members': 'Mitglieder {n} / {m}',
    'meetings.agenda.dialogTitle': 'TOP hinzufügen',
    'meetings.agenda.done': 'Erledigt',
    'meetings.agenda.duration': 'Dauer',
    'meetings.agenda.durationEdit': 'Dauer ändern',
    'meetings.agenda.durationRange': 'Ganze Minuten von 1 bis 480',
    'meetings.agenda.durationUnit': 'Min.',
    'meetings.agenda.empty': 'Noch keine Punkte auf der Tagesordnung.',
    'meetings.agenda.kindApplication': 'Antrag',
    'meetings.agenda.kindTodo': 'To-Do',
    'meetings.agenda.link': 'Verknüpfen',
    'meetings.agenda.markDone': 'Als erledigt markieren',
    'meetings.agenda.markOpen': 'Nicht mehr erledigt',
    'meetings.agenda.moveDown': 'Nach unten',
    'meetings.agenda.moveUp': 'Nach oben',
    'meetings.agenda.nonPublic': 'NÖ',
    'meetings.agenda.nonPublicLabel': 'Nicht öffentlich (NÖ)',
    'meetings.agenda.planActual': '{time}',
    'meetings.agenda.planMinutes': '{n} Min.',
    'meetings.agenda.planStart': 'ca. {time}',
    'meetings.agenda.remove': 'TOP entfernen',
    'meetings.agenda.removeBlocked': 'Dieser TOP hat eine offene oder abgeschlossene Abstimmung und bleibt auf der Tagesordnung.',
    'meetings.agenda.removeConfirm': '„{title}“ wird mit seinem Text von der Tagesordnung entfernt. Das lässt sich nicht rückgängig machen.',
    'meetings.agenda.removeNeedsVoteRight': 'Dieser TOP hat Abstimmungen. Nur wer die Abstimmungen der Sitzung leitet, kann ihn entfernen.',
    'meetings.agenda.removeTitle': 'TOP entfernen?',
    'meetings.agenda.rename': 'TOP umbenennen',
    'meetings.agenda.renamePlaceholder': 'TOP-Titel …',
    'meetings.agenda.rowMenu': 'Aktionen für {title}',
    'meetings.agenda.title': 'Tagesordnung',
    'meetings.agenda.todo': 'To-Do anlegen',
    'meetings.agenda.untitled': 'Unbenannter TOP',
    'meetings.agenda.voteOpen': 'Abstimmung offen',
    'meetings.attendance.absent': 'Unentschuldigt',
    'meetings.attendance.bySession': 'durch Sitzungsleitung',
    'meetings.attendance.empty': 'Noch keine Mitglieder erfasst.',
    'meetings.attendance.excused': 'Entschuldigt',
    'meetings.attendance.note': 'Grund',
    'meetings.attendance.notePlaceholder': 'Grund (optional)',
    'meetings.attendance.present': 'Anwesend',
    'meetings.attendance.reset': 'Auf „Offen“ zurücksetzen',
    'meetings.attendance.selfExcused': 'Abwesend',
    'meetings.attendance.selfPresent': 'Anwesend',
    'meetings.attendance.title': 'Anwesenheit',
    'meetings.attendance.unknown': 'Offen',
    'meetings.attendance.you': '(du)',
    'meetings.attendanceSheet.addReason': 'Grund eintragen',
    'meetings.attendanceSheet.delegationActive': 'Vertretung aktiv: erst widerrufen, dann als anwesend erfassen.',
    'meetings.attendanceSheet.delegationsTitle': 'Vertretungen',
    'meetings.attendanceSheet.editReason': 'Grund bearbeiten',
    'meetings.attendanceSheet.reason': 'Grund: {note}',
    'meetings.attendanceSheet.representedBy': 'vertreten durch {name}',
    'meetings.attendanceSheet.revoke': 'Widerrufen',
    'meetings.attendanceSheet.revokeDelegation': 'Vertretung widerrufen',
    'meetings.attendanceSheet.revokeFirst': 'Erst die Vertretung widerrufen.',
    'meetings.attendanceSheet.rowMenu': 'Aktionen für {name}',
    'meetings.attendanceSheet.statusOf': 'Anwesenheit von {name}',
    'meetings.attendanceSheet.withVote': 'mit Stimmrecht',
    'meetings.dock.backToNow': 'Zurück zu Jetzt',
    'meetings.dock.closedAt': 'Geschlossen um {time}',
    'meetings.dock.done': 'behandelt',
    'meetings.dock.formatBack': 'Zurück zur Navigation',
    'meetings.dock.keepersLocked': 'Sitzung geschlossen — die Protokollführung steht fest.',
    'meetings.dock.next': 'Nächster TOP',
    'meetings.dock.noKeeper': 'Kein Mitglied mit Protokollrecht gefunden.',
    'meetings.dock.noMember': 'Kein Mitglied gefunden.',
    'meetings.dock.none': '—',
    'meetings.dock.notStarted': 'Noch nicht eröffnet',
    'meetings.dock.now': 'jetzt',
    'meetings.dock.nowRunning': 'Jetzt läuft {top}',
    'meetings.dock.pickProtokollant': 'Protokollführung wählen',
    'meetings.dock.present': 'Anwesend {n} von {m}',
    'meetings.dock.presentShort': '{n} von {m}',
    'meetings.dock.prev': 'Vorheriger TOP',
    'meetings.dock.protokollantIs': 'Protokoll: {name}',
    'meetings.dock.protokollantMissing': 'Protokollführung fehlt',
    'meetings.dock.searchMember': 'Mitglied suchen',
    'meetings.dock.top': 'TOP',
    'meetings.dock.tops': '{n} TOPs',
    'meetings.dock.topsOne': '1 TOP',
    'meetings.dock.topsPrepared': '{n} TOPs vorbereitet',
    'meetings.editor.modeRaw': 'Markdown',
    'meetings.editor.toolbar': 'Format',
    'markdown.blackout.mark': 'Wird öffentlich geschwärzt',
    'markdown.image.uploading': 'Bild wird hochgeladen …',
    'meetings.agenda.planSub': 'Haushaltsplan',
    'meetings.approval.removeTitle': 'Genehmigung entfernen?',
    'meetings.dock.noTop': 'Noch kein TOP geöffnet',
    'meetings.draftMail.again': 'Der Entwurf ging zuletzt am {date} an die Mitglieder des Gremiums. Sie erhalten ihn jetzt noch einmal.',
    'meetings.draftMail.body': 'Die Mitglieder des Gremiums erhalten das Protokoll als PDF mit dem Wasserzeichen „Entwurf“. Das Protokoll bleibt ein Entwurf.',
    'meetings.draftMail.confirm': 'Senden',
    'meetings.draftMail.title': 'Entwurf senden?',
    'meetings.editor.blackout': 'Schwärzen (Strg+Umschalt+X)',
    'meetings.editor.blackoutOpen': 'Eine Schwärzung ist nicht geschlossen: Das schließende %% fehlt. So bleibt der Name öffentlich sichtbar, und das Protokoll lässt sich nicht finalisieren.',
    'meetings.editor.bold': 'Fett',
    'meetings.editor.document': 'PDF einfügen',
    'meetings.editor.heading': 'Überschrift',
    'meetings.editor.image': 'Bild einfügen',
    'meetings.editor.italic': 'Kursiv',
    'meetings.editor.list': 'Liste',
    'meetings.editor.mode': 'Ansicht des Texts',
    'meetings.editor.modeFormatted': 'Formatiert',
    'meetings.editor.quote': 'Zitat',
    'meetings.editor.table': 'Tabelle einfügen',
    'meetings.editor.timeNote': 'Anmerkung mit Uhrzeit einfügen',
    'meetings.editor.timeNoteSuffix': 'Uhr',
    'meetings.editor.timeNoteTime': 'Uhrzeit der Anmerkung',
    'meetings.follow.now': 'Jetzt',
    'meetings.protocol.finalize': 'Finalisieren & senden',
    'meetings.protocol.none': 'Für diese Sitzung gibt es noch kein Protokoll.',
    'meetings.protocol.placeholder': 'Protokolltext in Markdown … Bausteine über die Leiste einfügen.',
    'meetings.protocol.publicNotice': 'Dieses Protokoll wird öffentlich. Keine Namen Dritter im Freitext.',
    'meetings.protocol.saveFailed': 'Speichern fehlgeschlagen',
    'meetings.protocol.saved': 'Gespeichert',
    'meetings.protocol.saving': 'Wird gespeichert …',
    'meetings.protocol.selectTop': 'Wähle links einen TOP, um seinen Text zu bearbeiten.',
    'meetings.protocolBar.approve': 'Als genehmigt markieren',
    'meetings.protocolBar.needsRight': 'Finalisieren braucht das Gremien-Recht „Protokoll finalisieren & senden“.',
    'meetings.protocolBar.pdf': 'PDF',
    'meetings.protocolBar.pdfInternal': 'PDF intern',
    'meetings.protocolBar.pdfPublic': 'PDF öffentlich',
    'meetings.protocolBar.publish': 'Veröffentlichen',
    'meetings.protocolBar.reopen': 'Zurück in Entwurf',
    'meetings.protocolBar.sendDraft': 'Entwurf senden',
    'meetings.protocolBar.unapprove': 'Genehmigung entfernen',
    'meetings.protocolBar.withhold': 'Nicht veröffentlichen',
    'meetings.reopen.body': 'Das Protokoll verschwindet von den öffentlichen Seiten, bis es wieder final ist. Das nächste Finalisieren verschickt das PDF erneut an den Verteiler.',
    'meetings.reopen.confirm': 'Zurück in Entwurf',
    'meetings.reopen.title': 'Protokoll zurück in den Entwurf setzen?',
    'participant.top.empty': 'Noch kein Text zu diesem TOP.',
    'participant.top.keeper': '{name} führt das Protokoll',
    'participant.top.protocol': 'Protokoll',
    'meetings.handover.discard': 'Verwerfen',
    'meetings.handover.plannedShort': 'Übergabe geplant',
    'meetings.handover.title': 'Protokollführung übergeben',
    'meetings.keeper.assign': 'Protokollführung zuweisen',
    'meetings.keeper.handTo': 'Protokollführung übergeben an',
    'meetings.keeper.keeps': 'führt das Protokoll',
    'meetings.keeper.planned': 'Geplant',
    'meetings.keeper.takesOverAt': 'übernimmt ab {top}',
    'meetings.keeper.takesOverNext': 'übernimmt mit dem nächsten TOP',
    'meetings.leadSubstitute.action': 'Vertretung eintragen',
    'meetings.page.back': 'Zurück zu Sitzungen',
    'meetings.protokollant.label': 'Protokollführung',
    'meetings.status.closed': 'Geschlossen',
    'meetings.viewers.empty': 'Niemand hat die Sitzung gerade geöffnet.',
    'meetings.viewers.title': 'Live dabei',
    'meetings.vote.count': 'Abstimmungen',
    'todos.link.top': 'TOP {n}',
    'todos.linkKind.application': 'Antrag',
    'todos.board.addCard': 'To-Do anlegen',
    'todos.board.archive': 'Archiv',
    'todos.board.columnEmpty': 'Keine Karten',
    'todos.board.create': 'Anlegen',
    'todos.board.doneColumn': 'Erledigt-Spalte',
    'todos.board.more': '{n} weitere',
    'todos.board.quickTitle': 'Titel der neuen Karte in {column}',
    'todos.card.transfer': 'In anderes Board verschieben',
    'todos.column.add': 'To-Do in dieser Spalte',
    'todos.column.archive': 'Archiv öffnen',
    'todos.column.menu': 'Aktionen der Spalte {name}',
    'todos.column.settings': 'Spalten bearbeiten',
    'todos.drag.cancelled': 'Verschieben von „{title}“ abgebrochen.',
    'todos.drag.dropped': '„{title}“ abgelegt in {column}.',
    'todos.drag.lifted': '„{title}“ aufgenommen, Spalte {column}, Position {n} von {total}.',
    'todos.drag.moved': 'Spalte {column}, Position {n} von {total}.',
    'todos.due.change': 'Fälligkeit ändern: {date}',
    'todos.due.none': 'ohne Datum',
    'todos.due.overdue': 'überfällig',
    'todos.due.set': 'Datum setzen',
    'todos.due.today': 'heute',
    'todos.due.tomorrow': 'morgen',
    'todos.link.noAccess': '{kind} (kein Zugriff)',
    'todos.linkKind.agenda_item': 'TOP',
    'todos.linkKind.appointment': 'Termin',
    'todos.linkKind.budget': 'Kostenstelle',
    'todos.linkKind.expense': 'Buchung',
    'todos.linkKind.gremium': 'Gremium',
    'todos.linkKind.invoice': 'Rechnung',
    'todos.linkKind.meeting': 'Sitzung',
    'todos.linkKind.ticket': 'Ticket',
    'todos.linkKind.todo': 'To-Do',
    'todos.linkKind.vote': 'Abstimmung',
    'todos.list.due': 'Fällig',
    'todos.list.label': 'Label',
    'todos.list.linked': 'Verknüpft',
    'todos.list.title': 'Titel',
    'todos.list.who': 'Wer',
    'todos.move.bottom': 'Unten',
    'todos.move.column': 'Spalte',
    'todos.move.confirm': 'Verschieben',
    'todos.move.position': 'Position in der Spalte',
    'todos.move.title': 'Verschieben',
    'todos.move.top': 'Oben',
    'todos.new.short': 'To-Do',
    'todos.rows.openBoard': 'Board „{name}“ öffnen',
    'todos.rows.readOnly': 'Nur lesen',
    'todos.tile.checklist': 'Checkliste {done} von {total}',
    'todos.tile.comments': '{n} Kommentare',
    'todos.tile.nobody': 'Niemand zuständig',
    'todos.list.done': 'Erledigt',
    'todos.list.markDone': '„{title}“ erledigen',
    'todos.list.reopen': '„{title}“ wieder öffnen',
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
    'activity.loading': 'Loading activity',
    'activity.new': 'New',
    'activity.more': 'Load more',
    'chat.attach': 'Attach file',
    'chat.cancel': 'Cancel',
    'chat.copy': 'Copy text',
    'chat.delete': 'Delete message',
    'chat.deleteConfirm': 'The message is deleted. This cannot be undone.',
    'chat.deleteShort': 'Delete',
    'chat.deleteTitle': 'Delete message?',
    'chat.deletedPerson': 'Deleted person',
    'chat.discard': 'Discard',
    'chat.download': 'Download',
    'chat.drop': 'Drop files to attach',
    'chat.edit': 'Edit message',
    'chat.editShort': 'Edit',
    'chat.edited': 'edited',
    'chat.empty': 'No messages yet.',
    'chat.error.delete': 'The file could not be removed.',
    'chat.error.fileTooLarge': 'File too large (max {mb} MB).',
    'chat.error.fileType': 'This file type is not allowed.',
    'chat.error.tooManyFiles': 'At most {max} files per message.',
    'chat.error.upload': 'The file could not be uploaded.',
    'chat.failed': 'Not sent',
    'chat.fileLost': 'No longer available',
    'chat.internal': 'Internal',
    'chat.loading': 'Loading the messages…',
    'chat.log': 'Conversation',
    'chat.mentions': 'Mention people',
    'chat.newCount': '{count} new',
    'chat.newMessages.one': '1 new message',
    'chat.newMessages.other': '{count} new messages',
    'chat.ownMessage': 'Your message · {time}',
    'chat.pastedImage': 'image',
    'chat.placeholder': 'Write a message …',
    'chat.public': 'Public',
    'chat.removeFile': 'Remove {name}',
    'chat.removeFileAction': 'Remove',
    'chat.removeFileConfirm': '“{name}” is removed. This cannot be undone.',
    'chat.removeFileTitle': 'Remove attachment?',
    'chat.retry': 'Send again',
    'chat.save': 'Save',
    'chat.scan.clean': 'Ready',
    'chat.scan.quarantined': 'Quarantined',
    'chat.scan.scanning': 'Scanning',
    'chat.send': 'Send',
    'chat.sending': 'sending …',
    'chat.today': 'Today',
    'chat.uploading': 'uploading …',
    'chat.visibility': 'Visibility',
    'chat.yesterday': 'Yesterday',
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
    'editorTable.menu': 'Table',
    'editorTable.insertColumnLeft': 'Insert column left',
    'editorTable.insertColumnRight': 'Insert column right',
    'editorTable.deleteColumn': 'Delete column',
    'editorTable.insertRowAbove': 'Insert row above',
    'editorTable.insertRowBelow': 'Insert row below',
    'editorTable.deleteRow': 'Delete row',
    'editorTable.addRow': 'Add row',
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
    'circular.status.objection': 'Cancelled by an objection',
    'election.abstentions.one': '1 abstention',
    'election.abstentions.other': '{n} abstentions',
    'election.abstentionsLabel': 'Abstentions',
    'election.ballot.abstainAll': 'Abstain fully',
    'election.ballot.counter': '{n} of {m} votes given',
    'election.ballot.sole': 'Candidate: {name}',
    'election.candidate.erased': 'Deleted',
    'election.kind': 'Election',
    'election.lot.cancel': 'Cancel',
    'election.lot.confirm': 'Draw lot now',
    'election.lot.confirmHint': 'The lot is final and cannot be undone.',
    'election.lot.draw': 'Draw lot',
    'election.lot.drawn': 'The lot is drawn.',
    'election.lot.note': 'Decided by lot: {names}',
    'election.lot.pending': 'Tie between {names}. The lot decides.',
    'election.lot.waiting': 'The meeting lead draws the lot.',
    'election.names.one': '1 name',
    'election.names.other': '{n} names',
    'election.nextRound.created': 'The next round is prepared.',
    'election.nextRound.lotNote': 'The lot gives a place in the third round to: {names}',
    'election.nextRound.second': 'Second round',
    'election.nextRound.third': 'Third round',
    'election.result.elected': 'Elected: {names}',
    'election.result.noMajority': 'No majority of the members',
    'election.result.nobody': 'Nobody elected',
    'election.result.runoff': 'Runoff needed',
    'election.result.tie': 'Tie: the lot is pending',
    'election.runoff.banner': 'Tie at the boundary: runoff for {seats} between {names}.',
    'election.runoff.exists': 'The runoff exists.',
    'election.runoffRound': 'Runoff (round {n})',
    'election.seats.one': '1 seat',
    'election.seats.other': '{n} seats',
    'election.status.elected': 'Elected',
    'election.status.noMajority': 'No majority',
    'election.status.rejected': 'Nobody elected',
    'election.status.runoff': 'Runoff',
    'election.status.tie': 'Lot pending',
    'election.tag.elected': 'elected',
    'election.tag.tie': 'tie',
    'guests.vote.cast': 'Cast',
    'guests.vote.castN': 'Cast {n}',
    'guests.vote.composition': '{members} members + {guests} guests present',
    'guests.vote.majorityOfCast': 'Majority of the votes cast',
    'guests.vote.notReached': 'not reached',
    'guests.vote.reached': 'reached',
    'guests.vote.resultCaption': 'Result without quorum',
    'meetings.agenda.top': 'Item {n}',
    'meetings.dock.insertResult': 'Add to the minutes',
    'meetings.dock.of': '{n} of {m}',
    'meetings.dock.yourVote': 'Your vote',
    'meetings.toast.actionFailed': 'Action failed.',
    'meetings.vote.attempt': 'Vote {n}',
    'meetings.vote.attemptElection': 'Ballot {n}',
    'meetings.vote.cancel': 'Cancel vote',
    'meetings.vote.card.cancelled': 'Vote cancelled',
    'meetings.vote.card.closed': 'Vote closed',
    'meetings.vote.card.draft': 'Vote prepared',
    'meetings.vote.card.open': 'Vote open',
    'meetings.vote.close': 'Close vote',
    'meetings.vote.delete': 'Delete decision question',
    'meetings.vote.edit': 'Edit',
    'meetings.vote.endedAt': 'ended {time}',
    'meetings.vote.kind.circular': 'Circular vote',
    'meetings.vote.menu': 'Vote actions',
    'meetings.vote.open': 'Open vote',
    'meetings.vote.openBlocked': 'Close or cancel the open vote first.',
    'meetings.vote.opensLater': 'You can open it once the meeting is open.',
    'meetings.vote.progress': '{voted} of {present} present have voted',
    'meetings.vote.quorumCount': 'Quorum {n}',
    'meetings.vote.quorumPercent': 'Quorum {n} %',
    'meetings.vote.repeat': 'Vote again',
    'meetings.vote.repeatElection': 'Repeat ballot',
    'meetings.vote.repeated': 'Repeated',
    'meetings.vote.rule.members_majority': 'Majority of the members',
    'meetings.vote.rule.simple': 'Simple majority',
    'meetings.vote.since': 'since {time}',
    'meetings.vote.tally': 'Current tally',
    'meetings.vote.untitled': 'Decision question',
    'meetings.voteResult.inProtocol': 'In the minutes',
    'meetings.voteStatus.cancelled': 'Cancelled',
    'meetings.voteStatus.closed': 'Closed',
    'meetings.voteStatus.draft': 'Planned',
    'meetings.voteStatus.open': 'Open',
    'poll.answer.maybe': 'Maybe',
    'poll.ballot.counter': '{n} of at most {m} chosen',
    'poll.ballot.submitDate': 'Submit answers',
    'poll.caption': 'Poll · {mode}',
    'poll.mode.date': 'Date poll',
    'poll.mode.multi': 'Multiple choice',
    'poll.mode.multiMax': 'Multiple choice, at most {n}',
    'poll.mode.single': 'Single choice',
    'poll.options.one': '1 option',
    'poll.options.other': '{n} options',
    'poll.result.dateCaption': 'Number = Yes, (+n) = Maybe',
    'poll.result.dateRow': '{option}: {yes} yes, {maybe} maybe',
    'poll.result.footer': '{n} of {m} answered',
    'poll.status.closed': 'Poll ended',
    'poll.status.open': 'Poll open',
    'vote.failedQuorum': 'Quorum not reached',
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
    'vote.option.abstain': 'Abstain',
    'vote.option.no': 'No',
    'vote.option.yes': 'Yes',
    'vote.result.passed': 'Passed',
    'vote.result.rejected': 'Rejected',
    'vote.tally.quorum': 'Quorum',
    'vote.tally.quorumMet': 'met',
    'vote.tally.quorumMissed': 'not met',
    'voting.ballot.confirm': 'Cast vote: {choice}',
    'voting.ballot.confirmCount': 'Cast votes ({count})',
    'voting.ballot.confirmEmpty': 'Cast vote',
    'voting.ballot.confirmNames': '{label}: {names}',
    'voting.ballot.confirmProxy': 'Cast for {name}: {choice}',
    'voting.ballot.confirmProxyCount': 'Cast for {name} ({count})',
    'voting.ballot.confirmProxyEmpty': 'Cast for {name}',
    'voting.ballot.locked': 'You cannot change the vote.',
    'voting.ballot.own': 'Your vote',
    'voting.ballot.ownWith': 'Your vote, also for {name}',
    'voting.ballot.ownWithCount': 'Your vote, {count} voting rights, also for {name}',
    'voting.ballot.proxy': 'As proxy for {name}',
    'voting.ballot.proxyCount': '{count} voting rights as proxy for {name}',
    'voting.ballot.proxyDone': 'Cast for {name}: {choice}',
    'voting.ballot.proxyDoneSecret': 'Cast for {name}.',
    'voting.ballot.thanks': 'Thank you! Your vote: {choice}',
    'voting.ballot.thanksSecret': 'Thank you! Your vote is cast.',
    'voting.bars.label': 'Result, {cast} votes',
    'voting.bars.row': '{option}: {count} votes, {pct} %',
    'voting.beamer.votesOf': '{cast} of {eligible} votes',
    'voting.cast.toast.alreadyVoted': 'Your vote is already cast.',
    'voting.cast.toast.asUnit': 'Cast your own vote first. It also counts for the members you represent.',
    'voting.cast.toast.noDelegationInElection': 'In an election you vote only for yourself.',
    'voting.live.closed': 'Vote closed: {subject}. {result}',
    'voting.live.opened': 'Vote opened: {subject}',
    'voting.live.vote': 'Vote',
    'voting.panel.application': 'Open application',
    'voting.panel.where': '{meeting} · item {n}',
    'voting.progress.eligible': '{voted} of {total} eligible voters have voted',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.remove': 'Remove',
    'action.save': 'Save',
    'delegation.toast.revokeFailed': 'Revocation failed.',
    'delegation.toast.revoked': 'Proxy revoked.',
    'guests.dock.pending': '{n} open join requests',
    'guests.dock.present': 'Present {n} + {g} guests',
    'guests.dock.presentShort': '{n} + {g} guests',
    'guests.sheet.guests': 'guests',
    'guests.sheet.members': 'members',
    'guests.sheet.present': 'present:',
    'guests.tab.guests': 'Guests {n}',
    'guests.tab.guestsWatching': 'Guests (watching) {n}',
    'guests.tab.members': 'Members {n} / {m}',
    'meetings.agenda.dialogTitle': 'Add agenda item',
    'meetings.agenda.done': 'Done',
    'meetings.agenda.duration': 'Duration',
    'meetings.agenda.durationEdit': 'Change duration',
    'meetings.agenda.durationRange': 'Whole minutes from 1 to 480',
    'meetings.agenda.durationUnit': 'min',
    'meetings.agenda.empty': 'No items on the agenda yet.',
    'meetings.agenda.kindApplication': 'Application',
    'meetings.agenda.kindTodo': 'To-do',
    'meetings.agenda.link': 'Link',
    'meetings.agenda.markDone': 'Mark as done',
    'meetings.agenda.markOpen': 'Mark as not done',
    'meetings.agenda.moveDown': 'Move down',
    'meetings.agenda.moveUp': 'Move up',
    'meetings.agenda.nonPublic': 'Non-public',
    'meetings.agenda.nonPublicLabel': 'Non-public',
    'meetings.agenda.planActual': '{time}',
    'meetings.agenda.planMinutes': '{n} min',
    'meetings.agenda.planStart': 'approx. {time}',
    'meetings.agenda.remove': 'Remove item',
    'meetings.agenda.removeBlocked': 'This item has an open or closed vote and stays on the agenda.',
    'meetings.agenda.removeConfirm': '“{title}” is removed from the agenda with its text. This cannot be undone.',
    'meetings.agenda.removeNeedsVoteRight': 'This item has votes. Only a person who manages the votes of the meeting can remove it.',
    'meetings.agenda.removeTitle': 'Remove agenda item?',
    'meetings.agenda.rename': 'Rename item',
    'meetings.agenda.renamePlaceholder': 'Item title …',
    'meetings.agenda.rowMenu': 'Actions for {title}',
    'meetings.agenda.title': 'Agenda',
    'meetings.agenda.todo': 'Add a to-do',
    'meetings.agenda.untitled': 'Untitled item',
    'meetings.agenda.voteOpen': 'Vote open',
    'meetings.attendance.absent': 'Unexcused',
    'meetings.attendance.bySession': 'set by chair',
    'meetings.attendance.empty': 'No members recorded yet.',
    'meetings.attendance.excused': 'Excused',
    'meetings.attendance.note': 'Reason',
    'meetings.attendance.notePlaceholder': 'Reason (optional)',
    'meetings.attendance.present': 'Present',
    'meetings.attendance.reset': 'Reset to “open”',
    'meetings.attendance.selfExcused': 'Absent',
    'meetings.attendance.selfPresent': 'Present',
    'meetings.attendance.title': 'Attendance',
    'meetings.attendance.unknown': 'Open',
    'meetings.attendance.you': '(you)',
    'meetings.attendanceSheet.addReason': 'Add reason',
    'meetings.attendanceSheet.delegationActive': 'Delegation active: revoke it first, then record the member as present.',
    'meetings.attendanceSheet.delegationsTitle': 'Delegations',
    'meetings.attendanceSheet.editReason': 'Edit reason',
    'meetings.attendanceSheet.reason': 'Reason: {note}',
    'meetings.attendanceSheet.representedBy': 'represented by {name}',
    'meetings.attendanceSheet.revoke': 'Revoke',
    'meetings.attendanceSheet.revokeDelegation': 'Revoke delegation',
    'meetings.attendanceSheet.revokeFirst': 'Revoke the delegation first.',
    'meetings.attendanceSheet.rowMenu': 'Actions for {name}',
    'meetings.attendanceSheet.statusOf': 'Attendance of {name}',
    'meetings.attendanceSheet.withVote': 'with vote',
    'meetings.dock.backToNow': 'Back to now',
    'meetings.dock.closedAt': 'Closed at {time}',
    'meetings.dock.done': 'done',
    'meetings.dock.formatBack': 'Back to the navigation',
    'meetings.dock.keepersLocked': 'Meeting closed – the minute-takers are fixed.',
    'meetings.dock.next': 'Next item',
    'meetings.dock.noKeeper': 'No member who can keep the minutes found.',
    'meetings.dock.noMember': 'No member found.',
    'meetings.dock.none': '–',
    'meetings.dock.notStarted': 'Not opened yet',
    'meetings.dock.now': 'now',
    'meetings.dock.nowRunning': 'Now: {top}',
    'meetings.dock.pickProtokollant': 'Choose minute-taker',
    'meetings.dock.present': 'Present {n} of {m}',
    'meetings.dock.presentShort': '{n} of {m}',
    'meetings.dock.prev': 'Previous item',
    'meetings.dock.protokollantIs': 'Minutes: {name}',
    'meetings.dock.protokollantMissing': 'No minute-taker',
    'meetings.dock.searchMember': 'Search member',
    'meetings.dock.top': 'Item',
    'meetings.dock.tops': '{n} items',
    'meetings.dock.topsOne': '1 item',
    'meetings.dock.topsPrepared': '{n} items prepared',
    'meetings.editor.modeRaw': 'Markdown',
    'meetings.editor.toolbar': 'Format',
    'markdown.blackout.mark': 'Blacked out in public',
    'markdown.image.uploading': 'Uploading image …',
    'meetings.agenda.planSub': 'Budget plan',
    'meetings.approval.removeTitle': 'Remove the approval?',
    'meetings.dock.noTop': 'No item open yet',
    'meetings.draftMail.again': 'The draft last went to the members of the committee on {date}. They now get it once more.',
    'meetings.draftMail.body': 'The members of the committee get the minutes as a PDF with the watermark “Entwurf”. The minutes stay a draft.',
    'meetings.draftMail.confirm': 'Send',
    'meetings.draftMail.title': 'Send the draft?',
    'meetings.editor.blackout': 'Black out (Ctrl+Shift+X)',
    'meetings.editor.blackoutOpen': 'A blackout is not closed: the closing %% is missing. The name stays visible in public, and the minutes cannot be finalized.',
    'meetings.editor.bold': 'Bold',
    'meetings.editor.document': 'Insert PDF',
    'meetings.editor.heading': 'Heading',
    'meetings.editor.image': 'Insert image',
    'meetings.editor.italic': 'Italic',
    'meetings.editor.list': 'List',
    'meetings.editor.mode': 'View of the text',
    'meetings.editor.modeFormatted': 'Formatted',
    'meetings.editor.quote': 'Quote',
    'meetings.editor.table': 'Insert table',
    'meetings.editor.timeNote': 'Insert note with time',
    'meetings.editor.timeNoteSuffix': 'h',
    'meetings.editor.timeNoteTime': 'Time of the note',
    'meetings.follow.now': 'Now',
    'meetings.protocol.finalize': 'Finalize & send',
    'meetings.protocol.none': 'There are no minutes for this meeting yet.',
    'meetings.protocol.placeholder': 'Minutes text in Markdown … insert snippets via the toolbar.',
    'meetings.protocol.publicNotice': 'These minutes become public. Do not name third persons in the free text.',
    'meetings.protocol.saveFailed': 'Save failed',
    'meetings.protocol.saved': 'Saved',
    'meetings.protocol.saving': 'Saving …',
    'meetings.protocol.selectTop': 'Select an item on the left to edit its text.',
    'meetings.protocolBar.approve': 'Mark as approved',
    'meetings.protocolBar.needsRight': 'Finalizing needs the committee right “Finalize & send minutes”.',
    'meetings.protocolBar.pdf': 'PDF',
    'meetings.protocolBar.pdfInternal': 'Internal PDF',
    'meetings.protocolBar.pdfPublic': 'Public PDF',
    'meetings.protocolBar.publish': 'Publish',
    'meetings.protocolBar.reopen': 'Back to draft',
    'meetings.protocolBar.sendDraft': 'Send draft',
    'meetings.protocolBar.unapprove': 'Remove approval',
    'meetings.protocolBar.withhold': 'Do not publish',
    'meetings.reopen.body': 'The minutes leave the public pages until they are final again. The next finalization sends the PDF to the mailing list again.',
    'meetings.reopen.confirm': 'Back to draft',
    'meetings.reopen.title': 'Set the minutes back to draft?',
    'participant.top.empty': 'No text for this item yet.',
    'participant.top.keeper': '{name} keeps the minutes',
    'participant.top.protocol': 'Minutes',
    'meetings.handover.discard': 'Discard',
    'meetings.handover.plannedShort': 'handover planned',
    'meetings.handover.title': 'Hand over the minutes',
    'meetings.keeper.assign': 'Assign the minute-taker',
    'meetings.keeper.handTo': 'Hand the minutes to',
    'meetings.keeper.keeps': 'keeps the minutes',
    'meetings.keeper.planned': 'Planned',
    'meetings.keeper.takesOverAt': 'takes over from {top}',
    'meetings.keeper.takesOverNext': 'takes over with the next item',
    'meetings.leadSubstitute.action': 'Enter substitute',
    'meetings.page.back': 'Back to meetings',
    'meetings.protokollant.label': 'Minute-taker',
    'meetings.status.closed': 'Closed',
    'meetings.viewers.empty': 'Nobody has the session open right now.',
    'meetings.viewers.title': 'Viewing live',
    'meetings.vote.count': 'Votes',
    'todos.link.top': 'Item {n}',
    'todos.linkKind.application': 'Application',
    'todos.board.addCard': 'Create to-do',
    'todos.board.archive': 'Archive',
    'todos.board.columnEmpty': 'No cards',
    'todos.board.create': 'Create',
    'todos.board.doneColumn': 'Done column',
    'todos.board.more': '{n} more',
    'todos.board.quickTitle': 'Title of the new card in {column}',
    'todos.card.transfer': 'Move to another board',
    'todos.column.add': 'To-do in this column',
    'todos.column.archive': 'Open the archive',
    'todos.column.menu': 'Actions of the column {name}',
    'todos.column.settings': 'Edit the columns',
    'todos.drag.cancelled': 'Moving “{title}” cancelled.',
    'todos.drag.dropped': 'Dropped “{title}” in {column}.',
    'todos.drag.lifted': 'Picked up “{title}”, column {column}, position {n} of {total}.',
    'todos.drag.moved': 'Column {column}, position {n} of {total}.',
    'todos.due.change': 'Change the due date: {date}',
    'todos.due.none': 'no date',
    'todos.due.overdue': 'overdue',
    'todos.due.set': 'Set a date',
    'todos.due.today': 'today',
    'todos.due.tomorrow': 'tomorrow',
    'todos.link.noAccess': '{kind} (no access)',
    'todos.linkKind.agenda_item': 'Agenda item',
    'todos.linkKind.appointment': 'Appointment',
    'todos.linkKind.budget': 'Cost centre',
    'todos.linkKind.expense': 'Booking',
    'todos.linkKind.gremium': 'Committee',
    'todos.linkKind.invoice': 'Invoice',
    'todos.linkKind.meeting': 'Meeting',
    'todos.linkKind.ticket': 'Ticket',
    'todos.linkKind.todo': 'To-do',
    'todos.linkKind.vote': 'Vote',
    'todos.list.due': 'Due',
    'todos.list.label': 'Label',
    'todos.list.linked': 'Linked',
    'todos.list.title': 'Title',
    'todos.list.who': 'Who',
    'todos.move.bottom': 'Bottom',
    'todos.move.column': 'Column',
    'todos.move.confirm': 'Move',
    'todos.move.position': 'Position in the column',
    'todos.move.title': 'Move',
    'todos.move.top': 'Top',
    'todos.new.short': 'To-do',
    'todos.rows.openBoard': 'Open board “{name}”',
    'todos.rows.readOnly': 'Read only',
    'todos.tile.checklist': 'Checklist {done} of {total}',
    'todos.tile.comments': '{n} comments',
    'todos.tile.nobody': 'Nobody assigned',
    'todos.list.done': 'Done',
    'todos.list.markDone': 'Mark “{title}” done',
    'todos.list.reopen': 'Reopen “{title}”',
  },
};

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
  private readonly messages: Record<UiLang, UiKitMessages>;

  constructor(options: UiKitIntlOptions = {}) {
    this.lang = options.lang ?? this.internalLang.asReadonly();
    const lang = this.lang;
    this.formatLocale = options.formatLocale ?? computed(() => UI_KIT_FORMAT_LOCALES[lang()]);
    this.messages = {
      de: { ...UI_KIT_DEFAULT_MESSAGES.de, ...(options.messages?.de ?? {}) },
      en: { ...UI_KIT_DEFAULT_MESSAGES.en, ...(options.messages?.en ?? {}) },
    };
  }

  /** Set the language. Only effective when no external `lang` signal was provided. */
  setLang(lang: UiLang): void {
    this.internalLang.set(lang);
  }

  translate(key: UiKitTextKey, params?: Record<string, string | number>): string {
    const raw = this.messages[this.lang()][key] ?? this.messages[DEFAULT_LANG][key] ?? key;
    return interpolate(raw, params);
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
