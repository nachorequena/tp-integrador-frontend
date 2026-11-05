/**
 * SERVICIO DE REPORTES
 * ====================
 *
 * Habla con los cuatro endpoints de `/reportes` (solo administrador). Lo usa
 * `paginas/admin/reportes`.
 *
 * `indicadores()` pide los cuatro A LA VEZ con el mismo rango de fechas
 * (`forkJoin`): la consigna pide un filtro de fechas "que actualiza todos los
 * indicadores a la vez", y con `forkJoin` la pantalla recibe los cuatro juntos
 * o un único error, nunca un dashboard mezclando rangos.
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConteoTurnos,
  Indicadores,
  MedicoRanking,
  RangoFechas,
  TasaCancelacion,
} from '../modelos/reporte';
import { RespuestaApi } from '../modelos/respuesta-api';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  /**
   * @param rango Desde/hasta opcionales (inclusivos). Sin rango, todo el histórico.
   * @returns Los cuatro indicadores calculados sobre el mismo rango.
   */
  indicadores(rango: RangoFechas): Observable<Indicadores> {
    const params = aParametros(rango);
    return forkJoin({
      porEspecialidad: this.pedir<ConteoTurnos[]>('turnos-por-especialidad', params),
      porSede: this.pedir<ConteoTurnos[]>('turnos-por-sede', params),
      ranking: this.pedir<MedicoRanking[]>('ranking-medicos', params),
      cancelacion: this.pedir<TasaCancelacion>('tasa-cancelacion', params),
    });
  }

  /** Pide un reporte puntual y desenvuelve sus datos. */
  private pedir<T>(reporte: string, params: HttpParams): Observable<T> {
    return this.http.get<RespuestaApi<T>>(`${this.url}/${reporte}`, { params }).pipe(datosDe());
  }
}
