/**
 * MENÚ DE NAVEGACIÓN
 * ==================
 *
 * Lista de opciones del menú lateral. Muestra solo lo que corresponde a quien
 * está mirando:
 *   - sin sesión: inicio, iniciar sesión y registrarse;
 *   - con sesión: inicio, "Mi perfil" y las opciones de su rol, que salen de
 *     `MENU_POR_ROL` (la misma lista que genera las rutas).
 */

import { Component, computed, inject, output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MENU_POR_ROL, rutaDeOpcion } from '../../core/navegacion/menu';
import { NOMBRE_ROL } from '../../core/modelos/usuario';
import { SesionService } from '../../core/servicios/sesion.service';

/** Una opción ya lista para pintar: con la URL completa armada. */
interface EnlaceMenu {
  etiqueta: string;
  icono: string;
  ruta: string;
}

@Component({
  selector: 'app-menu-lateral',
  imports: [MatListModule, MatIconModule, MatDividerModule, RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss',
})
export class MenuLateral {
  protected readonly sesion = inject(SesionService);

  /**
   * Se emite al elegir una opción. En celulares el menú se superpone al
   * contenido, y el contenedor lo usa para cerrarlo después de navegar.
   */
  readonly navego = output<void>();

  /** Título de la sección del rol ("Paciente", "Médico"...). */
  protected readonly tituloSeccion = computed(() => {
    const rol = this.sesion.rol();
    return rol ? NOMBRE_ROL[rol] : '';
  });

  /** Opciones del rol logueado, o ninguna sin sesión. */
  protected readonly opcionesDelRol = computed<EnlaceMenu[]>(() => {
    const rol = this.sesion.rol();
    if (!rol) return [];
    return MENU_POR_ROL[rol].map((opcion) => ({
      etiqueta: opcion.etiqueta,
      icono: opcion.icono,
      ruta: rutaDeOpcion(rol, opcion),
    }));
  });
}
