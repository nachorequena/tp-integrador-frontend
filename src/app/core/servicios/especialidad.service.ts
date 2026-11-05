/**
 * SERVICIO DE ESPECIALIDADES
 * ==========================
 *
 * Habla con `/especialidades` del backend.
 *
 *   - `listar()` → cualquier usuario con sesión (solicitud de turno, alta de
 *     médicos, filtros).
 *   - `crear()`, `actualizar()`, `eliminar()` → solo administrador (pantalla
 *     `paginas/admin/especialidades`).
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatosEspecialidad, Especialidad } from '../modelos/especialidad';
import { RespuestaApi } from '../modelos/respuesta-api';
import { datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class EspecialidadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/especialidades`;

  /** @returns Todas las especialidades. */
  listar(): Observable<Especialidad[]> {
    return this.http.get<RespuestaApi<Especialidad[]>>(this.url).pipe(datosDe());
  }

  /** @returns La especialidad creada. */
  crear(datos: DatosEspecialidad): Observable<Especialidad> {
    return this.http.post<RespuestaApi<Especialidad>>(this.url, datos).pipe(datosDe());
  }

  /** @returns La especialidad modificada. */
  actualizar(id: number, datos: DatosEspecialidad): Observable<Especialidad> {
    return this.http
      .put<RespuestaApi<Especialidad>>(`${this.url}/${id}`, datos)
      .pipe(datosDe());
  }

  /**
   * Elimina una especialidad.
   *
   * @returns Completa sin datos. Falla con 409 si hay médicos o agendas que la
   *   usan.
   */
  eliminar(id: number): Observable<null> {
    return this.http.delete<RespuestaApi<null>>(`${this.url}/${id}`).pipe(datosDe());
  }
}
