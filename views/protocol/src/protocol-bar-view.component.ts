import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { Meeting, Protocol, Uuid } from './protocol.types';
import {
  ButtonComponent,
  ButtonLinkComponent,
  ConfirmDialogComponent,
  IconComponent,
  UI_KIT_INTL,
  type UiKitTextKey,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import { type ProtocolAction, protocolActions, protocolMenuItems } from './protocol-actions.util';

/** A PDF of the protocol to open: its name, its path and its kind. */
export interface ProtocolPdf {
  readonly name: string;
  readonly url: string;
  readonly kind: 'pdf';
}

/** A PDF to open in the file viewer of the app; `event` is the click of a link, else null. */
export interface ProtocolPdfOpen {
  readonly file: ProtocolPdf;
  readonly event: MouseEvent | null;
}

/**
 * The protocol of a closed meeting in the head of the meeting page (spec 001304).
 *
 * The status of the head names the state of the protocol (`protocolStatus`), so this
 * component draws no state line. It draws the one protocol action of the head and the
 * confirmations, and it gives the session menu its "Protokoll" section (`menuItems`, `select`).
 *
 * - The head action: "Finalisieren & senden" for a draft and a holder of `canFinalize`
 *   (write access plus the gremium right `protocol.finalize`). A writer without the right
 *   sees the button disabled, with the missing right as its reason. A final protocol shows
 *   "PDF" (or "PDF intern" when a public variant exists). On a phone the head has no action
 *   (spec 000197), so the action is the first item of the section.
 * - Draft: "Entwurf senden" sends the PDF with the watermark "Entwurf" to the members,
 *   after a confirmation. The protocol stays a draft (§ 000925). A second send names the
 *   date of the last one in the confirmation (§ 000937). "PDF intern" and "PDF öffentlich"
 *   open the draft as a PDF with the watermark "Entwurf". The server renders it for this
 *   read and stores nothing (§ 000950).
 * - Final: "PDF öffentlich" when an item is non-public. For a holder of `canFinalize`
 *   "Als genehmigt markieren" asks for the meeting that approved the protocol, and with the
 *   mark "Genehmigung entfernen" asks before it removes the mark (§ 000924). Without the
 *   mark "Zurück in Entwurf" asks before it sets the protocol back (§ 000983).
 * - Final, gremium publishes its protocols: for a holder of `canFinalize`
 *   "Nicht veröffentlichen" or "Veröffentlichen" (the protocol is held back from the public
 *   protocol page, or published again).
 *
 * The finalize is a step of its own after the close; a live meeting has no protocol actions.
 *
 * The head action is a segment of the button group of the meeting head (spec 001354): the
 * host carries `btn-grp__seg`, so the action and the ⋮ menu after it form one group, and
 * `btn-grp--main`, so "Finalisieren & senden" keeps its accent fill. Without an action the
 * host carries neither class and leaves no gap in the shape.
 *
 * Copy of `app-protocol-bar` of STUPA-Workflow (S/framework/views/002273). The view saves
 * nothing: it emits `sendDraft`, `reopen`, `approve`, `publish`, `approvalRequest` and `pdfOpen`,
 * and the app runs them (the approval dialog and the file viewer are the app's).
 */
@Component({
  selector: 'app-protocol-bar-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiKitTranslatePipe,
    ButtonComponent,
    ButtonLinkComponent,
    ConfirmDialogComponent,
    IconComponent,
  ],
  host: {
    '[class.btn-grp__seg]': 'hasAction()',
    '[class.btn-grp--main]': 'hasAction()',
  },
  templateUrl: './protocol-bar-view.component.html',
  styleUrl: './protocol-bar-view.component.scss',
})
export class ProtocolBarViewComponent {
  readonly meeting = input.required<Meeting>();
  readonly protocol = input.required<Protocol>();
  readonly finalizing = input(false);
  /** A phone: the head has no action, so the head action is an item of the menu. */
  readonly compact = input(false);

  /** The meeting page holds the session that saves the changes; elsewhere the bar only reads. */
  readonly hasSession = input(false);

  readonly finalize = output<void>();
  /** "Entwurf senden", after the confirmation. */
  readonly sendDraft = output<void>();
  /** "Zurück in Entwurf", after the confirmation. */
  readonly reopen = output<void>();
  /** The approval mark: the meeting that approved the protocol, or null to remove the mark. */
  readonly approve = output<Uuid | null>();
  /** "Veröffentlichen" (true) or "Nicht veröffentlichen" (false). */
  readonly publish = output<boolean>();
  /** "Als genehmigt markieren": the app opens its approval dialog. */
  readonly approvalRequest = output<void>();
  /** A PDF to open in the file viewer of the app. */
  readonly pdfOpen = output<ProtocolPdfOpen>();

  /** What the viewer can do (spec 001304): shared with the session menu of the page. */
  private readonly actions = computed(() =>
    protocolActions(this.meeting(), this.protocol(), this.hasSession()),
  );
  protected readonly publication = computed(() => this.actions().publication);
  protected readonly canFinalize = computed(() => this.actions().canFinalize);
  protected readonly needsRight = computed(() => this.actions().needsRight);
  protected readonly finalPdf = computed(() => this.actions().finalPdf);
  private readonly draftPdf = computed(() => this.actions().draftPdf);
  /** The head shows an action: not on a phone, and only when there is one. */
  protected readonly hasAction = computed(
    () => !this.compact() && (this.canFinalize() || this.needsRight() || this.finalPdf() !== null),
  );

  private readonly i18n = inject(UI_KIT_INTL);
  /** The confirmation of "Entwurf senden" is open. */
  protected readonly confirmDraft = signal(false);
  /** The confirmation text: a second send names the date of the last one (§ 000937). */
  protected readonly draftBody = computed(() => {
    const last = this.protocol().draftSentAt;
    return last
      ? this.i18n.translate('meetings.draftMail.again', {
          date: new Intl.DateTimeFormat(this.i18n.formatLocale(), { dateStyle: 'long' }).format(
            new Date(last),
          ),
        })
      : this.i18n.translate('meetings.draftMail.body');
  });
  /** The confirmation of "Genehmigung entfernen" is open. */
  protected readonly confirmUnapprove = signal(false);

  /**
   * A PDF link opens the PDF in the file viewer (spec 001080). A click with a modifier
   * keeps the new tab of the link.
   */
  protected openPdf(event: MouseEvent, url: string, label: UiKitTextKey): void {
    this.pdfOpen.emit({ file: this.pdfFile(url, label), event });
  }

  private pdfFile(url: string, label: UiKitTextKey): ProtocolPdf {
    return {
      name: `${this.meeting().title} · ${this.i18n.translate(label)}`,
      url,
      kind: 'pdf',
    };
  }

  private open(url: string, label: UiKitTextKey): void {
    this.pdfOpen.emit({ file: this.pdfFile(url, label), event: null });
  }

  /** The confirmation of "Zurück in Entwurf" is open. */
  protected readonly confirmReopen = signal(false);

  protected confirmSendDraft(): void {
    this.confirmDraft.set(false);
    this.sendDraft.emit();
  }

  protected unapprove(): void {
    this.confirmUnapprove.set(false);
    this.approve.emit(null);
  }

  protected confirmReopenDraft(): void {
    this.confirmReopen.set(false);
    this.reopen.emit();
  }

  protected togglePublication(): void {
    this.publish.emit(this.publication() === 'withheld');
  }

  /** The "Protokoll" section of the session menu, as the page builds it. */
  readonly menuItems = computed(() =>
    protocolMenuItems(this.actions(), this.protocol(), this.compact(), (key) =>
      this.i18n.translate(key),
    ),
  );

  /** Runs an item of the "Protokoll" section. Returns false for an id of another section. */
  select(id: string): boolean {
    const p = this.protocol();
    switch (id as ProtocolAction) {
      case 'protocol.finalize':
        this.finalize.emit();
        return true;
      case 'protocol.pdf': {
        const pdf = this.finalPdf();
        if (pdf) this.open(pdf.url, pdf.label);
        return true;
      }
      case 'protocol.pdfPublic':
        if (p.publicPdfUrl)
          this.open(p.publicPdfUrl, 'meetings.protocolBar.pdfPublic');
        return true;
      case 'protocol.draftPdf': {
        const draft = this.draftPdf();
        if (draft)
          this.open(draft.internal, 'meetings.protocolBar.pdfInternal');
        return true;
      }
      case 'protocol.draftPdfPublic': {
        const draft = this.draftPdf();
        if (draft) this.open(draft.public, 'meetings.protocolBar.pdfPublic');
        return true;
      }
      case 'protocol.sendDraft':
        this.confirmDraft.set(true);
        return true;
      case 'protocol.approve':
        this.approvalRequest.emit();
        return true;
      case 'protocol.unapprove':
        this.confirmUnapprove.set(true);
        return true;
      case 'protocol.reopen':
        this.confirmReopen.set(true);
        return true;
      case 'protocol.publish':
      case 'protocol.withhold':
        this.togglePublication();
        return true;
      default:
        return false;
    }
  }
}
