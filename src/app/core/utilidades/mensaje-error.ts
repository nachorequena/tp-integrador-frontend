/**
 * TRADUCCIÓN DE ERRORES HTTP A MENSAJES
 * =====================================
 *
 * Convierte cualquier error de una petición en un texto que se le pueda mostrar
 * al usuario. Lo usan todas las pantallas que hablan con la API, para que un
 * mismo tipo de error se vea igual en toda la app.
 */

import { HttpErrorResponse } from '@angular/common/http';

/**
 * Obtiene un mensaje legible a partir de un error de `HttpClient`.
 *
 * El backend manda el motivo del error en el campo `estado` (por ejemplo "El
 * DNI ya está registrado"), así que ese es el primer lugar donde mirar.
 *
 * @param error Lo que llega al callback `error` de una suscripción.
 * @returns El mensaje del backend o, si no hay, uno genérico según el caso.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }

  // Status 0 significa que la petición ni siquiera llegó a tener respuesta:
  // backend apagado, sin red, o CORS bloqueando la llamada.
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verificá que el backend esté levantado.';
  }

  const estado: unknown = error.error?.estado;
  if (typeof estado === 'string' && estado.trim() !== '') {
    return estado;
  }

  return `Error ${error.status} al comunicarse con el servidor.`;
}
