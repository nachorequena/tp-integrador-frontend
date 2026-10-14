/**
 * ESTADO DE LA SESIÓN
 * ===================
 *
 * Guarda quién está logueado y su token, y es la única pieza que toca el
 * `localStorage`. El resto de la app (header, menú, guards, interceptor) lee
 * la sesión desde acá, nunca del almacenamiento directamente.
 *
 * Se guarda en `localStorage` y no en memoria para cumplir "la sesión se
 * mantiene al recargar la página": la memoria se pierde con cada recarga.
 *
 * El estado se expone como signals: cuando la sesión cambia, todo lo que la
 * muestra (nombre en el header, opciones del menú) se actualiza solo.
 */

import { computed, Injectable, signal } from '@angular/core';
import { Rol, Usuario } from '../modelos/usuario';

/** Claves usadas en el `localStorage`. */
const CLAVE_TOKEN = 'clinica.token';
const CLAVE_USUARIO = 'clinica.usuario';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly _token = signal<string | null>(null);
  private readonly _usuario = signal<Usuario | null>(null);

  /** JWT de la sesión actual, o `null` si no hay sesión. */
  readonly token = this._token.asReadonly();

  /** Usuario logueado, o `null` si no hay sesión. */
  readonly usuario = this._usuario.asReadonly();

  /** `true` mientras haya una sesión iniciada. */
  readonly haySesion = computed(() => this._usuario() !== null);

  /** Rol del usuario logueado, o `null` sin sesión. */
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);

  constructor() {
    this.restaurar();
  }

  /**
   * Abre la sesión con lo que devolvió el login y la persiste en el navegador.
   *
   * Se guarda también el usuario (no solo el token) porque el backend ya lo
   * devuelve en el login: así el header puede mostrar el nombre al recargar sin
   * pedirle nada a la API.
   *
   * @param token JWT firmado por el backend.
   * @param usuario Datos públicos del usuario logueado.
   */
  iniciar(token: string, usuario: Usuario): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this._token.set(token);
    this._usuario.set(usuario);
  }

  /** Cierra la sesión: borra el token y el usuario del navegador y de memoria. */
  cerrar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this._token.set(null);
    this._usuario.set(null);
  }

  /**
   * Recupera la sesión guardada al arrancar la app (por ejemplo, tras recargar).
   *
   * Si el token ya venció, la sesión se descarta acá mismo. Sin este control,
   * la app mostraría al usuario como logueado y recién la primera petición a la
   * API revelaría que no lo está.
   */
  private restaurar(): void {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO);
    if (!token || !usuarioGuardado || tokenVencido(token)) {
      this.cerrar();
      return;
    }

    try {
      this._usuario.set(JSON.parse(usuarioGuardado) as Usuario);
      this._token.set(token);
    } catch {
      // Un valor corrupto (editado a mano, por ejemplo) no debe romper la app.
      this.cerrar();
    }
  }
}

/**
 * Indica si un JWT ya venció, leyendo su campo `exp`.
 *
 * El payload de un JWT es JSON en base64url y NO está cifrado, así que se
 * puede leer sin el secreto. Esto NO valida la firma: de eso se encarga el
 * backend en cada petición. Acá solo interesa evitar mostrar como abierta una
 * sesión que ya expiró.
 *
 * @param token JWT tal como lo devolvió el backend.
 * @returns `true` si venció o si no se puede leer.
 */
function tokenVencido(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadBase64)) as { exp?: number };
    // `exp` viene en segundos desde 1970; Date.now() está en milisegundos.
    return payload.exp !== undefined && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
