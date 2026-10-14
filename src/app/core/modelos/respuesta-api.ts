/**
 * FORMATO DE RESPUESTA DE LA API
 * ==============================
 *
 * El backend responde SIEMPRE con esta forma, tanto en éxito como en error
 * (es el formato uniforme que exige el enunciado general). Tiparlo una vez
 * acá permite que cada servicio declare solo qué viene en `datos`.
 */

/**
 * Cuerpo de cualquier respuesta del backend.
 *
 * @typeParam T Tipo de lo que viaja en `datos` cuando la respuesta es exitosa.
 */
export interface RespuestaApi<T> {
  /** Código HTTP, repetido dentro del cuerpo. */
  codigo: number;
  /** `"ok"` si salió bien; si no, el mensaje de error listo para mostrar. */
  estado: string;
  /** Lo pedido, o `null` cuando no hay nada que devolver (y en los errores). */
  datos: T;
}
