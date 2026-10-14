/**
 * PANTALLA PRINCIPAL
 * ==================
 *
 * Lo primero que se ve al entrar. Tiene dos versiones, como pide la consigna:
 *   - sin sesión: invita a iniciar sesión o registrarse y explica qué puede
 *     hacer un paciente registrado;
 *   - con sesión: saluda e invita a elegir una función del menú, mostrando
 *     las mismas opciones del menú como accesos directos.
 */

import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MENU_POR_ROL, rutaDeOpcion } from '../../core/navegacion/menu';
import { SesionService } from '../../core/servicios/sesion.service';

/** Una funcionalidad para pacientes, descripta en la pantalla sin sesión. */
interface Funcionalidad {
  icono: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-inicio',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly sesion = inject(SesionService);

  /**
   * Lo que puede hacer un paciente registrado. Describe las funciones que la
   * API ya ofrece al rol `paciente`, aunque sus pantallas lleguen en las
   * semanas siguientes.
   */
  protected readonly funcionalidades: Funcionalidad[] = [
    {
      icono: 'event_available',
      titulo: 'Sacar turnos',
      descripcion: 'Elegí especialidad, médico, sede y horario disponible.',
    },
    {
      icono: 'event_note',
      titulo: 'Ver y cancelar tus turnos',
      descripcion: 'Consultá tus próximos turnos y cancelalos si no podés asistir.',
    },
    {
      icono: 'medical_information',
      titulo: 'Tu historial clínico',
      descripcion: 'Accedé a los diagnósticos y tratamientos de tus consultas.',
    },
    {
      icono: 'notifications',
      titulo: 'Notificaciones',
      descripcion: 'Enterate de cada cambio en tus turnos.',
    },
  ];

  /** Accesos directos a las funciones del rol logueado (las mismas del menú). */
  protected readonly accesos = computed(() => {
    const rol = this.sesion.rol();
    if (!rol) return [];
    return MENU_POR_ROL[rol].map((opcion) => ({ ...opcion, ruta: rutaDeOpcion(rol, opcion) }));
  });
}
