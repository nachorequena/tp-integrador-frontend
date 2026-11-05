/**
 * SERVICIO DE AUDITORÍA
 * =====================
 *
 * Habla con `GET /auditoria` (solo administrador): listado paginado del
 * registro de acciones sensibles, de lo más reciente a lo más antiguo. Lo usa
 * `paginas/admin/auditoria`.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EntradaAuditoria, FiltrosAuditoria } from '../modelos/auditoria';
import { Pagina } from '../modelos/pagina';
import { RespuestaApi } from '../modelos/respuesta-api';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auditoria`;

  /** @returns La página pedida y el total que cumple los filtros. */
  listar(filtros: FiltrosAuditoria): Observable<Pagina<EntradaAuditoria>> {
    return this.http
      .get<RespuestaApi<Pagina<EntradaAuditoria>>>(this.url, { params: aParametros(filtros) })
      .pipe(datosDe());
  }
}
