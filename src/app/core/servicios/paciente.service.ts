/**
 * SERVICIO DE PACIENTES
 * =====================
 *
 * Habla con `/pacientes` del backend.
 *
 *   - `buscar()` → `GET /pacientes?busqueda=` (operador, médico y admin): por
 *     DNI o apellido. Lo usa `compartido/buscador-pacientes`.
 *   - `crear()` → `POST /pacientes` (operador): alta con los mismos datos y
 *     validaciones que el registro. Lo usa `paginas/operador/pacientes` a
 *     través de `compartido/formulario-paciente`.
 *   - `actualizarMisDatos()` → `PUT /pacientes/mis-datos` (paciente): solo
 *     email, teléfono, cobertura y contraseña (`paginas/paciente/mis-datos`).
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatosMisDatos, PacienteEncontrado } from '../modelos/paciente';
import { RespuestaApi } from '../modelos/respuesta-api';
import { DatosRegistro, Usuario } from '../modelos/usuario';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pacientes`;

  /**
   * @param busqueda DNI (desde el principio) o apellido (en cualquier parte),
   *   al menos 2 caracteres.
   * @returns Hasta 20 pacientes.
   */
  buscar(busqueda: string): Observable<PacienteEncontrado[]> {
    return this.http
      .get<RespuestaApi<PacienteEncontrado[]>>(this.url, { params: aParametros({ busqueda }) })
      .pipe(datosDe());
  }

  /** @returns El paciente creado. Falla con 409 si el DNI o el email ya existen. */
  crear(datos: DatosRegistro): Observable<Usuario> {
    return this.http.post<RespuestaApi<Usuario>>(this.url, datos).pipe(datosDe());
  }

  /** @returns El paciente actualizado (sin contraseña). */
  actualizarMisDatos(datos: DatosMisDatos): Observable<Usuario> {
    return this.http.put<RespuestaApi<Usuario>>(`${this.url}/mis-datos`, datos).pipe(datosDe());
  }
}
