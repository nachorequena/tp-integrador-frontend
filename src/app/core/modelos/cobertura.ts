/**
 * MODELO DE COBERTURA
 * ===================
 *
 * Una obra social o prepaga, tal como la devuelve `GET /coberturas/disponibles`.
 */

/** Fila de la tabla `cobertura`. */
export interface Cobertura {
  id: number;
  nombre: string;
}
