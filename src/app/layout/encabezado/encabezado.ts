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
 * La campana queda ubicada pero sin funcionalidad: la consigna la completa en
 * la semana 3 del frontend.
 */

import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { NOMBRE_ROL } from '../../core/modelos/usuario';
import { SesionService } from '../../core/servicios/sesion.service';

@Component({
  selector: 'app-encabezado',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.scss',
})
export class Encabezado {
  protected readonly sesion = inject(SesionService);
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

  /** Cierra la sesión y vuelve a la pantalla principal, como pide la consigna. */
  protected cerrarSesion(): void {
    this.sesion.cerrar();
    this.router.navigate(['/']);
    this.avisos.open('Cerraste sesión.', 'Cerrar', { duration: 3000 });
  }
}
