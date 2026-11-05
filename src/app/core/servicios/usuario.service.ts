/**
 * SERVICIO DE GESTIÓN DE USUARIOS (administrador)
 * ===============================================
 *
 * Habla con `/usuarios` del backend: listado paginado con filtros, alta de
 * operadores, médicos y administradores, y edición de cualquier usuario.
 * Lo usa `paginas/admin/usuarios` y su diálogo `dialogo-usuario`.
 *
 * Cada alta y edición queda registrada en la auditoría (lo hace el backend).
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../modelos/pagina';
import { RespuestaApi } from '../modelos/respuesta-api';
import { DatosUsuarioAdmin, FiltrosUsuarios, UsuarioListado } from '../modelos/usuario';
import { aParametros, datosDe } from '../utilidades/http';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  /** @returns La página pedida y el total que cumple los filtros. */
  listar(filtros: FiltrosUsuarios): Observable<Pagina<UsuarioListado>> {
    return this.http
      .get<RespuestaApi<Pagina<UsuarioListado>>>(this.url, { params: aParametros(filtros) })
      .pipe(datosDe());
  }

  /** @returns El usuario creado. Falla con 409 si el DNI o el email ya existen. */
  crear(datos: DatosUsuarioAdmin): Observable<UsuarioListado> {
    return this.http.post<RespuestaApi<UsuarioListado>>(this.url, datos).pipe(datosDe());
  }

  /** @returns El usuario modificado. */
  actualizar(id: number, datos: DatosUsuarioAdmin): Observable<UsuarioListado> {
    return this.http
      .put<RespuestaApi<UsuarioListado>>(`${this.url}/${id}`, datos)
      .pipe(datosDe());
  }
}
