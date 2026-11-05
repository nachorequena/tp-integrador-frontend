/**
 * SERVICIO DE HISTORIAL CLÍNICO
 * =============================
 *
 * Habla con `/historial` del backend.
 *
 *   - `mio()` → `GET /historial/mio`: el paciente ve todo su historial
 *     (`paginas/paciente/historial`).
 *   - `dePaciente()` → `GET /historial/paciente/:id`: el médico ve SOLO los
 *     registros de los turnos que atendió él (`paginas/medico/historial`). El
 *     filtro lo aplica el backend, no la interfaz: así no hay forma de ver
 *     registros ajenos ni modificando el código del navegador.
 *
 * Con qué se conecta: lo usan `paginas/paciente/historial` y
 * `paginas/medico/historial`, que muestran los registros con
 * `compartido/lista-historial`.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroHistorial } from '../modelos/historial';
import { RespuestaApi } from '../modelos/respuesta-api';
import { datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/historial`;

  /** @returns El historial del paciente logueado, lo más reciente primero. */
  mio(): Observable<RegistroHistorial[]> {
    return this.http.get<RespuestaApi<RegistroHistorial[]>>(`${this.url}/mio`).pipe(datosDe());
  }

  /** @returns Los registros que el médico logueado cargó sobre ese paciente. */
  dePaciente(idPaciente: number): Observable<RegistroHistorial[]> {
    return this.http
      .get<RespuestaApi<RegistroHistorial[]>>(`${this.url}/paciente/${idPaciente}`)
      .pipe(datosDe());
  }
}
