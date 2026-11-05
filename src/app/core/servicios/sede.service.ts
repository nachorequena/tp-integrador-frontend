/**
 * SERVICIO DE SEDES
 * =================
 *
 * Habla con `/sedes` del backend.
 *
 *   - `listar()` → `GET /sedes`: cualquier usuario con sesión. Lo usan todos
 *     los selectores de sede (agenda, turnos, usuarios, solicitud de turno).
 *   - `crear()`, `actualizar()`, `eliminar()` → solo administrador. Los usa la
 *     pantalla `paginas/admin/sedes`.
 *
 * El token lo agrega `token.interceptor.ts`; los errores siguen de largo hasta
 * el componente.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api';
import { DatosSede, Sede } from '../modelos/sede';
import { datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/sedes`;

  /** @returns Todas las sedes, ordenadas como las devuelve el backend. */
  listar(): Observable<Sede[]> {
    return this.http.get<RespuestaApi<Sede[]>>(this.url).pipe(datosDe());
  }

  /** @returns La sede creada. Falla con 400 si los datos no validan. */
  crear(datos: DatosSede): Observable<Sede> {
    return this.http.post<RespuestaApi<Sede>>(this.url, datos).pipe(datosDe());
  }

  /** @returns La sede modificada. Falla con 404 si no existe. */
  actualizar(id: number, datos: DatosSede): Observable<Sede> {
    return this.http.put<RespuestaApi<Sede>>(`${this.url}/${id}`, datos).pipe(datosDe());
  }

  /**
   * Elimina una sede.
   *
   * @returns Completa sin datos. Falla con 409 si tiene usuarios o agendas
   *   asociadas: la pantalla muestra ese mensaje del backend tal cual.
   */
  eliminar(id: number): Observable<null> {
    return this.http.delete<RespuestaApi<null>>(`${this.url}/${id}`).pipe(datosDe());
  }
}
