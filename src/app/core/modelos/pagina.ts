/**
 * MODELO DE PÁGINA (LISTADOS PAGINADOS)
 * =====================================
 *
 * Forma de las respuestas paginadas del backend (`GET /usuarios` y
 * `GET /auditoria`). La consumen las pantallas de usuarios y auditoría junto
 * con el `mat-paginator`, que necesita el `total` para saber cuántas páginas
 * hay.
 */

/**
 * Una página de resultados.
 *
 * @typeParam T Tipo de cada fila.
 */
export interface Pagina<T> {
  items: T[];
  /** Filas que cumplen los filtros, sumando todas las páginas. */
  total: number;
  /** Número de página, empezando en 1. */
  pagina: number;
  /** Filas por página. */
  limite: number;
}
