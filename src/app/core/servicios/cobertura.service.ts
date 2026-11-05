/**
 * SERVICIO DE COBERTURAS
 * ======================
 *
 * Habla con `/coberturas` del backend. Hay dos listados distintos, y la
 * diferencia importa:
 *
 *   - `listarDisponibles()` → `GET /coberturas/disponibles`, PÚBLICO. Lo usan
 *     el registro (todavía no hay sesión), el alta de pacientes del operador,
 *     "Mis datos" del paciente y el formulario de usuarios.
 *   - `listar()` → `GET /coberturas`, solo administrador. Es el listado del
 *     CRUD (pantalla `paginas/admin/coberturas`) y responde 403 a cualquier
 *     otro rol.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cobertura, DatosCobertura } from '../modelos/cobertura';
import { RespuestaApi } from '../modelos/respuesta-api';
import { datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/coberturas`;

  /**
   * Lista las coberturas que se pueden elegir (registro, mis datos).
   *
   * @returns Las coberturas cargadas en la base, sin necesidad de sesión.
   */
  listarDisponibles(): Observable<Cobertura[]> {
    return this.http.get<RespuestaApi<Cobertura[]>>(`${this.url}/disponibles`).pipe(datosDe());
  }

  /** @returns Todas las coberturas (CRUD del administrador). */
  listar(): Observable<Cobertura[]> {
    return this.http.get<RespuestaApi<Cobertura[]>>(this.url).pipe(datosDe());
  }

  /** @returns La cobertura creada. */
  crear(datos: DatosCobertura): Observable<Cobertura> {
    return this.http.post<RespuestaApi<Cobertura>>(this.url, datos).pipe(datosDe());
  }

  /** @returns La cobertura modificada. */
  actualizar(id: number, datos: DatosCobertura): Observable<Cobertura> {
    return this.http.put<RespuestaApi<Cobertura>>(`${this.url}/${id}`, datos).pipe(datosDe());
  }

  /**
   * Elimina una cobertura.
   *
   * @returns Completa sin datos. Falla con 409 si hay pacientes o turnos que
   *   la usan.
   */
  eliminar(id: number): Observable<null> {
    return this.http.delete<RespuestaApi<null>>(`${this.url}/${id}`).pipe(datosDe());
  }
}
