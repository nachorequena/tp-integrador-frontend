/**
 * TEXTOS DEL DATEPICKER EN ESPAÑOL
 * ================================
 *
 * Material trae en inglés las etiquetas de los botones del calendario ("Open
 * calendar", "Next month"...). No se ven, pero las lee un lector de pantalla
 * y aparecen como tooltip, así que se traducen para que toda la app esté en
 * español. Se registra en el componente que usa el datepicker (ver por qué
 * en `registro.ts`).
 */

import { Injectable } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

@Injectable()
export class TextosDatepicker extends MatDatepickerIntl {
  override calendarLabel = 'Calendario';
  override openCalendarLabel = 'Abrir calendario';
  override closeCalendarLabel = 'Cerrar calendario';
  override prevMonthLabel = 'Mes anterior';
  override nextMonthLabel = 'Mes siguiente';
  override prevYearLabel = 'Año anterior';
  override nextYearLabel = 'Año siguiente';
  override prevMultiYearLabel = 'Años anteriores';
  override nextMultiYearLabel = 'Años siguientes';
  override switchToMonthViewLabel = 'Elegir fecha';
  override switchToMultiYearViewLabel = 'Elegir mes y año';
}
