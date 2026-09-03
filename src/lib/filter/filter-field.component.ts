import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Ein Filter-Feld im {@link FilterBarComponent}-Popover: Label + projizierte
 * Steuerung (native input/select oder `<app-select>`). Einheitliche Optik für
 * alle Listen. Controls erben `.filter-field__control`-Styling über `::ng-deep`,
 * sodass Konsumenten nur ihr Control projizieren müssen.
 */
@Component({
  selector: 'app-filter-field',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-field.component.html',
  styleUrl: './filter-field.component.scss',
})
export class FilterFieldComponent {
  /** Sichtbares Label über dem Control. */
  readonly label = input('');
  /**
   * Der Inhalt ist eine GRUPPE von Controls statt eines einzelnen.
   *
   * Ein `<label>` verbindet sich mit dem ersten Control darin. Bei einem Segment-Filter
   * heißt der erste Knopf dann wie das Feld statt wie er selbst — gemessen kam eine
   * Gruppe als "Archiv Nur archivierte Alle" heraus, der eigene Name des ersten Knopfs
   * fehlte. Mit `group` wird das Set über `role="group"` benannt.
   */
  readonly group = input(false);
}
