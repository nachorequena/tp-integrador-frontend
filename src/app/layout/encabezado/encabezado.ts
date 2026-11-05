/**
 * ENCABEZADO (HEADER)
 * ===================
 *
 * Barra superior de la app. Cambia según haya sesión:
 *   - sin sesión: el saludo "Bienvenido a la clínica virtual";
 *   - con sesión: a la derecha, el nombre del usuario, un ícono de
 *     información con su tipo de usuario, la campana de notificaciones y el
 *     botón para cerrar sesión.
 *
 * La campana (consigna final, "Notificaciones"):
 *   - muestra en un `matBadge` la cantidad de no leídas, y lo oculta si es 0;
 *   - al hacer click despliega un `mat-menu` con las notificaciones, de la más
 *     reciente a la más antigua, con las no leídas resaltadas;
 *   - cada no leída tiene un botón para marcarla como leída: el contador baja
 *     al instante.
 * El estado (listado y contador) vive en `NotificacionService`, que también
 * lo recarga al navegar y después de cada acción sobre un turno.
 *
 * Lo usa `app.html` (layout general).
 */

import { Component, computed, inject, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { NOMBRE_ROL } from '../../core/modelos/usuario';
import { NotificacionService } from '../../core/servicios/notificacion.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { deFechaHoraApi } from '../../core/utilidades/adaptador-fecha';

@Component({
  selector: 'app-encabezado',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink,
  ],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.scss',
})
export class Encabezado {
  protected readonly sesion = inject(SesionService);
  protected readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);

  /** Se emite al tocar el botón de menú, para abrir o cerrar el menú lateral. */
  readonly alternarMenu = output<void>();

  /** "Nombre Apellido" del usuario logueado. */
  protected readonly nombreCompleto = computed(() => {
    const usuario = this.sesion.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  /** Tipo de usuario legible ("Paciente", "Médico"...), para el tooltip. */
  protected readonly tipoDeUsuario = computed(() => {
    const rol = this.sesion.rol();
    return rol ? `Tipo de usuario: ${NOMBRE_ROL[rol]}` : '';
  });

  protected readonly deFechaHoraApi = deFechaHoraApi;

  /**
   * Marca una notificación como leída sin cerrar el menú.
   *
   * `stopPropagation` evita que el click llegue al `mat-menu`, que si no se
   * cerraría con cada notificación marcada.
   */
  protected marcarLeida(evento: MouseEvent, id: number): void {
    evento.stopPropagation();
    this.notificaciones.marcarLeida(id);
  }

  /** Cierra la sesión y vuelve a la pantalla principal, como pide la consigna. */
  protected cerrarSesion(): void {
    this.sesion.cerrar();
    this.router.navigate(['/']);
    this.avisos.open('Cerraste sesión.', 'Cerrar', { duration: 3000 });
  }
}
