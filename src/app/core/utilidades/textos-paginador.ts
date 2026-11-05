/**
 * TEXTOS DEL PAGINADOR EN ESPAÑOL
 * ===============================
 *
 * `mat-paginator` trae sus textos en inglés ("Items per page", "1 – 10 of
 * 30"). Esta clase los reemplaza. Se provee globalmente en `app.config.ts` y
 * la usan las pantallas paginadas: usuarios y auditoría.
 *
 * (A diferencia del datepicker, `MatPaginatorModule` no registra un provider
 * propio, así que acá alcanza con el global.)
 */

import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class TextosPaginador extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Registros por página';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';

  /**
   * Texto del rango visible, por ejemplo "11 – 20 de 35".
   *
   * @param pagina Página actual, empezando en 0 (convención de Material).
   * @param tamanio Registros por página.
   * @param total Registros en total.
   */
  override getRangeLabel = (pagina: number, tamanio: number, total: number): string => {
    if (total === 0 || tamanio === 0) return `0 de ${total}`;
    const desde = pagina * tamanio + 1;
    const hasta = Math.min(desde + tamanio - 1, total);
    return `${desde} – ${hasta} de ${total}`;
  };
}
