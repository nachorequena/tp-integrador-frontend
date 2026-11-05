/**
 * SERVICIO DE TURNOS Y DISPONIBILIDAD
 * ===================================
 *
 * Habla con `/turnos` y `/disponibilidad` del backend.
 *
 * | Método            | Endpoint                         | Quién / dónde                         |
 * | ----------------- | -------------------------------- | ------------------------------------- |
 * | `fechasLibres`    | GET /disponibilidad/fechas       | solicitud de turno (paso fecha)       |
 * | `horariosLibres`  | GET /disponibilidad/horarios     | solicitud de turno (paso horario)     |
 * | `crear`           | POST /turnos                     | paciente y operador                   |
 * | `misTurnos`       | GET /turnos/mios                 | paciente → "Mis turnos"               |
 * | `delMedico`       | GET /turnos/medico               | médico → "Turnos del día"             |
 * | `deLaSede`        | GET /turnos/sede                 | operador → "Turnos de la sede"        |
 * | `cancelar`        | PATCH /turnos/:id/cancelar       | paciente, médico y operador           |
 * | `atender`         | PATCH /turnos/:id/atender        | médico (con el historial clínico)     |
 *
 * Después de crear, cancelar o atender, la pantalla que llama recarga las
 * notificaciones (`NotificacionService.cargar()`), porque el backend acaba de
 * generar una para quien hizo la acción.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api';
import {
  ConsultaDisponibilidad,
  DatosAtencion,
  DatosNuevoTurno,
  HorarioLibre,
  Turno,
} from '../modelos/turno';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/turnos`;
  private readonly urlDisponibilidad = `${environment.apiUrl}/disponibilidad`;

  /**
   * Fechas (desde hoy) en que el médico tiene agenda con algún horario libre.
   *
   * @returns Fechas `YYYY-MM-DD`, ordenadas.
   */
  fechasLibres(consulta: ConsultaDisponibilidad): Observable<string[]> {
    return this.http
      .get<RespuestaApi<string[]>>(`${this.urlDisponibilidad}/fechas`, {
        params: aParametros(consulta),
      })
      .pipe(datosDe());
  }

  /**
   * Horarios que siguen libres en una fecha (rangos de agenda menos turnos
   * confirmados, cada 30 minutos).
   */
  horariosLibres(consulta: ConsultaDisponibilidad, fecha: string): Observable<HorarioLibre[]> {
    return this.http
      .get<RespuestaApi<HorarioLibre[]>>(`${this.urlDisponibilidad}/horarios`, {
        params: aParametros({ ...consulta, fecha }),
      })
      .pipe(datosDe());
  }

  /**
   * Pide un turno.
   *
   * @returns El turno confirmado. Falla con 409 si el horario se ocupó
   *   mientras tanto: la pantalla lo informa y vuelve al paso de horario.
   */
  crear(datos: DatosNuevoTurno): Observable<Turno> {
    return this.http.post<RespuestaApi<Turno>>(this.url, datos).pipe(datosDe());
  }

  /** @returns Los turnos del paciente logueado, del más próximo al menos próximo. */
  misTurnos(): Observable<Turno[]> {
    return this.http.get<RespuestaApi<Turno[]>>(`${this.url}/mios`).pipe(datosDe());
  }

  /**
   * @param fecha `YYYY-MM-DD`.
   * @param idSede Opcional: sin sede, trae todas las sedes donde atiende.
   * @returns Los turnos del médico logueado ese día, por hora.
   */
  delMedico(fecha: string, idSede?: number): Observable<Turno[]> {
    return this.http
      .get<RespuestaApi<Turno[]>>(`${this.url}/medico`, {
        params: aParametros({ fecha, id_sede: idSede }),
      })
      .pipe(datosDe());
  }

  /**
   * @param fecha `YYYY-MM-DD`.
   * @param idMedico Opcional: los turnos de un solo médico (ícono de "ojo").
   * @returns Los turnos de la sede del operador ese día, por hora.
   */
  deLaSede(fecha: string, idMedico?: number): Observable<Turno[]> {
    return this.http
      .get<RespuestaApi<Turno[]>>(`${this.url}/sede`, {
        params: aParametros({ fecha, id_medico: idMedico }),
      })
      .pipe(datosDe());
  }

  /** @returns El turno ya cancelado. */
  cancelar(id: number): Observable<Turno> {
    return this.http.patch<RespuestaApi<Turno>>(`${this.url}/${id}/cancelar`, {}).pipe(datosDe());
  }

  /**
   * Marca el turno como atendido y guarda su historial clínico, todo junto.
   *
   * @returns El turno atendido, con el historial.
   */
  atender(id: number, historial: DatosAtencion): Observable<Turno> {
    return this.http
      .patch<RespuestaApi<Turno>>(`${this.url}/${id}/atender`, historial)
      .pipe(datosDe());
  }
}
