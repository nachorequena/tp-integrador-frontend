/**
 * CONFIGURACIÓN DEL ENTORNO
 * =========================
 *
 * Único lugar del proyecto donde se escribe la URL base de la API, como pide la
 * consigna. Todos los servicios la leen de acá y le agregan solo el recurso
 * (`/auth/login`, `/coberturas/disponibles`...), así que si el backend cambia
 * de puerto o de host se toca una sola línea.
 */
export const environment = {
  /** URL base del backend (el `PORT` del `.env` del backend, por defecto 3000). */
  apiUrl: 'http://localhost:3000',
};
