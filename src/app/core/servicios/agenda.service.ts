/**
 * SERVICIO DE AGENDA
 * ==================
 *
 * Habla con `/agendas` del backend (médico, operador y administrador).
 *
 * El backend aplica las reglas por fila: el médico solo ve y toca su agenda,
 * el operador solo modifica la de su sede, y nadie puede eliminar un rango con
 * turnos confirmados ni recortarlo dejando alguno afuera. Si se intenta,
 * responde 403/409 con un mensaje que la pantalla muestra tal cual.
 *
 * Lo usan `paginas/agendas` y `compartido/rangos-agenda`.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agenda, DatosAgenda, FiltrosAgenda } from '../modelos/agenda';
import { RespuestaApi } from '../modelos/respuesta-api';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/agendas`;

  /**
   * @param filtros Médico, sede y/o fecha. Al médico el backend le fuerza el
   *   filtro a su propia agenda.
   * @returns Los rangos ordenados por fecha y hora de entrada.
   */
  listar(filtros: FiltrosAgenda = {}): Observable<Agenda[]> {
    return this.http
      .get<RespuestaApi<Agenda[]>>(this.url, { params: aParametros(filtros) })
      .pipe(datosDe());
  }

  /** @returns El rango creado. Falla con 409 si se superpone con otro. */
  crear(datos: DatosAgenda): Observable<Agenda> {
    return this.http.post<RespuestaApi<Agenda>>(this.url, datos).pipe(datosDe());
  }

  /** @returns El rango modificado. Falla con 409 si deja turnos afuera. */
  actualizar(id: number, datos: DatosAgenda): Observable<Agenda> {
    return this.http.put<RespuestaApi<Agenda>>(`${this.url}/${id}`, datos).pipe(datosDe());
  }

  /** @returns Completa sin datos. Falla con 409 si el rango tiene turnos. */
  eliminar(id: number): Observable<null> {
    return this.http.delete<RespuestaApi<null>>(`${this.url}/${id}`).pipe(datosDe());
  }
}
