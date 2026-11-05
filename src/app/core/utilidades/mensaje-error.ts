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
  // Se revisan tres casos, del más raro al más común. Cada `if` que se cumple
  // devuelve su mensaje y termina la función.

  // CASO 1: no es un error HTTP (por ejemplo, un error de programación en el
  // propio código). No hay nada que leer del backend: mensaje genérico.
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }

  // CASO 2: status 0 significa que la petición ni siquiera llegó a tener
  // respuesta: backend apagado, sin red, o CORS bloqueando la llamada. Es lo
  // que se ve en la defensa si se apaga el backend.
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verificá que el backend esté levantado.';
  }

  // CASO 3: el backend respondió con un error (400, 403, 409...). Su cuerpo
  // tiene el formato uniforme { codigo, estado, datos } y en `estado` viene el
  // motivo listo para mostrar ("Ese horario ya fue tomado..."). Se controla
  // que sea un texto no vacío antes de usarlo.
  const estado: unknown = error.error?.estado;
  if (typeof estado === 'string' && estado.trim() !== '') {
    return estado;
  }

  // Si el backend no mandó un `estado` usable, se muestra al menos el código.
  return `Error ${error.status} al comunicarse con el servidor.`;
}
