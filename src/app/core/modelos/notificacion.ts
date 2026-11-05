/**
 * MODELO DE NOTIFICACIÓN
 * ======================
 *
 * Notificación de un usuario, tal como la devuelve `GET /notificaciones`
 * (tabla `notificacion`). Las genera el backend al confirmar, cancelar o
 * atender un turno.
 *
 * Lo usan `NotificacionService` y la campana del encabezado.
 */

/** Una notificación. */
export interface Notificacion {
  id: number;
  id_usuario: number;
  /** Por ejemplo `turno_confirmado`. */
  tipo: string;
  /** Texto listo para mostrar (el backend ya formatea la fecha dd/mm/aaaa). */
  mensaje: string;
  /** `tinyint(1)` en la base: llega como 0 o 1, no como booleano. */
  leida: number;
  /** `YYYY-MM-DD HH:MM:SS`. */
  fecha: string;
}
