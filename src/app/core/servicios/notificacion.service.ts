/**
 * SERVICIO (Y ESTADO) DE NOTIFICACIONES
 * =====================================
 *
 * Habla con `/notificaciones` del backend y además GUARDA el listado en
 * signals, para que la campana del encabezado (`layout/encabezado`) y
 * cualquier pantalla compartan el mismo contador.
 *
 * Cuándo se recarga el listado (consigna final, "Notificaciones"):
 *   - al iniciar sesión o al recargar la página con sesión abierta;
 *   - en cada navegación entre pantallas: así el "otro" usuario de un turno
 *     ve su notificación nueva la próxima vez que navega (no se pide tiempo
 *     real);
 *   - después de confirmar, cancelar o atender un turno: lo llaman
 *     `paginas/nuevo-turno`, `paginas/turnos-del-dia` y
 *     `paginas/paciente/mis-turnos`, para que el contador de quien hizo la
 *     acción se actualice sin recargar.
 *
 * Marcar una como leída actualiza el signal en el momento (el contador baja
 * al instante) y recién después confirma contra el backend.
 *
 * Con qué se conecta: lo lee `layout/encabezado` (campana); llaman a
 * `cargar()` `paginas/nuevo-turno`, `paginas/turnos-del-dia` y
 * `paginas/paciente/mis-turnos`. Depende de `SesionService` y del `Router`.
 */

import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../modelos/notificacion';
import { RespuestaApi } from '../modelos/respuesta-api';
import { datosDe } from '../utilidades/http';
import { mensajeDeError } from '../utilidades/mensaje-error';
import { SesionService } from './sesion.service';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);
  private readonly url = `${environment.apiUrl}/notificaciones`;

  // Signals PRIVADAS (con guion bajo): solo este servicio las puede cambiar.
  private readonly _items = signal<Notificacion[]>([]);
  private readonly _error = signal<string | null>(null);

  /**
   * Notificaciones del usuario, de la más reciente a la más antigua.
   * `asReadonly()` entrega una versión de solo lectura: el encabezado puede
   * leerla pero no modificarla por error.
   */
  readonly items = this._items.asReadonly();

  /** Mensaje si la última carga falló (se muestra dentro del menú de la campana). */
  readonly error = this._error.asReadonly();

  /**
   * Cantidad de no leídas: es el número del contador de la campana.
   * `filter` se queda con las que tienen `leida` en 0 y `.length` las cuenta.
   * Como es un `computed`, se recalcula solo cada vez que cambia `_items`,
   * y el número de la campana se actualiza sin hacer nada más.
   */
  readonly noLeidas = computed(() => this._items().filter((n) => !n.leida).length);

  constructor() {
    // Reacciona a la sesión: al abrirse carga, al cerrarse vacía. Así un
    // usuario nunca ve el contador del anterior si comparten la computadora.
    // `effect` ejecuta la función ahora y otra vez cada vez que cambia una
    // signal que lee adentro (acá, `haySesion()`): login → carga, logout → vacía.
    effect(() => {
      if (this.sesion.haySesion()) {
        this.cargar();
      } else {
        this._items.set([]);
        this._error.set(null);
      }
    });

    // Además se recarga en cada cambio de pantalla: el router emite un evento
    // `NavigationEnd` al terminar de navegar. Así, si otro usuario generó una
    // notificación (por ejemplo el médico atendió el turno), el paciente la ve
    // la próxima vez que navega (la consigna no pide tiempo real).
    inject(Router)
      .events.pipe(filter((evento) => evento instanceof NavigationEnd))
      .subscribe(() => {
        if (this.sesion.haySesion()) this.cargar();
      });
  }

  /**
   * Pide el listado al backend (`GET /notificaciones`) y actualiza el estado.
   * Es público porque también lo llaman las pantallas después de confirmar,
   * cancelar o atender un turno (por ejemplo `nuevo-turno.ts → confirmar()`).
   */
  cargar(): void {
    this.http
      .get<RespuestaApi<Notificacion[]>>(this.url)
      .pipe(datosDe())
      .subscribe({
        // OK: se reemplaza el listado → `noLeidas` se recalcula → la campana
        // muestra el número nuevo.
        next: (notificaciones) => {
          this._items.set(notificaciones);
          this._error.set(null);
        },
        // Error: se guarda el mensaje para mostrarlo dentro del menú.
        error: (error: unknown) => this._error.set(mensajeDeError(error)),
      });
  }

  /**
   * Marca una notificación como leída (`PATCH /notificaciones/:id/leida`).
   *
   * Actualización "optimista": primero se cambia en pantalla (el contador baja
   * al instante, como pide la consigna) y después se avisa al backend. Si el
   * backend falla, se recarga el listado para volver al estado real.
   *
   * @param id Id de la notificación.
   */
  marcarLeida(id: number): void {
    // 1) En pantalla, ya: `update` recibe la lista actual y devuelve una
    //    nueva donde la notificación con ese id tiene `leida: 1` (las demás
    //    quedan igual). El contador baja en el mismo instante.
    this._items.update((lista) => lista.map((n) => (n.id === id ? { ...n, leida: 1 } : n)));
    // 2) Después se avisa al backend. Si sale bien no hay nada más que hacer;
    //    si falla, se vuelve a pedir el listado real para no mostrar algo falso.
    this.http.patch<RespuestaApi<unknown>>(`${this.url}/${id}/leida`, {}).subscribe({
      error: () => this.cargar(),
    });
  }
}
