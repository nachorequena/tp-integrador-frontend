/**
 * AYUDANTES PARA LAS PETICIONES HTTP
 * ==================================
 *
 * Dos piezas que repetían todos los servicios de `core/servicios/`:
 *
 *   - `datosDe()`: desenvuelve el `datos` de la respuesta uniforme del backend
 *     (`{ codigo, estado, datos }`), para que los componentes reciban
 *     directamente lo pedido.
 *   - `aParametros()`: arma los query params de un listado con filtros,
 *     salteando los vacíos.
 *
 * Los errores HTTP NO se tocan acá: siguen de largo hasta el componente, que
 * los muestra con `mensajeDeError` (`mensaje-error.ts`).
 */

import { HttpParams } from '@angular/common/http';
import { map, OperatorFunction } from 'rxjs';
import { RespuestaApi } from '../modelos/respuesta-api';

/**
 * Operador de RxJS que extrae `datos` de una respuesta de la API.
 *
 * Uso: `this.http.get<RespuestaApi<Sede[]>>(url).pipe(datosDe())`.
 *
 * @typeParam T Tipo de lo que viaja en `datos`.
 * @returns Un operador que transforma la respuesta en su `datos`.
 */
export function datosDe<T>(): OperatorFunction<RespuestaApi<T>, T> {
  return map((respuesta) => respuesta.datos);
}

/**
 * Convierte un objeto de filtros en query params.
 *
 * Saltea `undefined`, `null` y texto vacío: un filtro que el usuario no
 * completó no tiene que viajar como `?id_sede=` (el backend lo tomaría como
 * presente y mal formado).
 *
 * @param filtros Objeto plano con los filtros (`{ fecha: '2026-11-04', id_sede: 1 }`).
 * @returns Los parámetros listos para `HttpClient`.
 */
export function aParametros(filtros: object): HttpParams {
  let parametros = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === '') continue;
    parametros = parametros.set(clave, String(valor));
  }
  return parametros;
}
