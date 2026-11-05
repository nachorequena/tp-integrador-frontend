/**
 * SERVICIO DE MÉDICOS
 * ===================
 *
 * Habla con `GET /medicos` (cualquier usuario con sesión): médicos con sus
 * especialidades, filtrables por especialidad y sede.
 *
 * Quién lo usa:
 *   - la solicitud de turno (`paginas/nuevo-turno`), en el paso "médico";
 *   - la agenda del operador ("Nueva agenda": elegir el médico);
 *   - la agenda del médico (para conocer sus propias especialidades).
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FiltrosMedico, Medico } from '../modelos/medico';
import { RespuestaApi } from '../modelos/respuesta-api';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medicos`;

  /**
   * @param filtros Especialidad y/o sede (opcionales).
   * @returns Los médicos ordenados por apellido.
   */
  listar(filtros: FiltrosMedico = {}): Observable<Medico[]> {
    return this.http
      .get<RespuestaApi<Medico[]>>(this.url, { params: aParametros(filtros) })
      .pipe(datosDe());
  }
}
