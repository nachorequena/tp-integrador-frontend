/**
 * SERVICIO DE AUTENTICACIÓN
 * =========================
 *
 * Habla con los tres endpoints de `/auth` del backend. No guarda estado: el
 * login devuelve la respuesta y es la pantalla quien decide abrir la sesión
 * con `SesionService`. Así este servicio solo sabe de HTTP.
 *
 * Todas las respuestas llegan envueltas en `{ codigo, estado, datos }`; acá se
 * desenvuelven con `map` para que los componentes reciban directamente los
 * datos. Los errores HTTP siguen de largo y los maneja quien se suscribe.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos/respuesta-api';
import { DatosLogin, DatosRegistro, RespuestaLogin, Usuario } from '../modelos/usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  /**
   * Inicia sesión con DNI y contraseña.
   *
   * @returns El token y los datos del usuario. Si las credenciales son
   *   incorrectas, el observable falla con un 401.
   */
  login(datos: DatosLogin): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaApi<RespuestaLogin>>(`${this.url}/login`, datos)
      .pipe(map((respuesta) => respuesta.datos));
  }

  /**
   * Registra un paciente nuevo. El backend le asigna el rol `paciente`.
   *
   * @returns El usuario creado. Falla con 409 si el DNI o el email ya existen,
   *   y con 400 si algún dato no pasa la validación del backend.
   */
  registrar(datos: DatosRegistro): Observable<Usuario> {
    return this.http
      .post<RespuestaApi<Usuario>>(`${this.url}/registro`, datos)
      .pipe(map((respuesta) => respuesta.datos));
  }

  /**
   * Trae los datos del usuario logueado. El token lo agrega el interceptor.
   *
   * @returns El usuario, leído de la base en el momento (no del token).
   */
  perfil(): Observable<Usuario> {
    return this.http
      .get<RespuestaApi<Usuario>>(`${this.url}/perfil`)
      .pipe(map((respuesta) => respuesta.datos));
  }
}
