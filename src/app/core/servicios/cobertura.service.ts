/**
 * SERVICIO DE COBERTURAS
 * ======================
 *
 * Trae el listado público de coberturas que usa el formulario de registro.
 *
 * Se consume `/coberturas/disponibles` y no `/coberturas`: esta última es el
 * CRUD del administrador y responde 403 a cualquier otro rol (y 401 sin
 * sesión, que es justamente el caso de quien se está registrando).
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cobertura } from '../modelos/cobertura';
import { RespuestaApi } from '../modelos/respuesta-api';

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  private readonly http = inject(HttpClient);

  /**
   * Lista las coberturas que se pueden elegir al registrarse.
   *
   * @returns Las coberturas cargadas en la base, sin necesidad de sesión.
   */
  listarDisponibles(): Observable<Cobertura[]> {
    return this.http
      .get<RespuestaApi<Cobertura[]>>(`${environment.apiUrl}/coberturas/disponibles`)
      .pipe(map((respuesta) => respuesta.datos));
  }
}
