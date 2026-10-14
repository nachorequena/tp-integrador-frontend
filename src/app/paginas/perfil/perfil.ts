/**
 * PANTALLA "MI PERFIL"
 * ====================
 *
 * Muestra los datos del usuario logueado obtenidos de `GET /auth/perfil`, como
 * pide la consigna. Se piden a la API y no se leen de la sesión guardada
 * porque el perfil tiene que reflejar lo que hay HOY en la base.
 *
 * El perfil trae `id_cobertura` pero no su nombre, así que para los pacientes
 * se cruza con el listado público de coberturas.
 */

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Cobertura } from '../../core/modelos/cobertura';
import { NOMBRE_ROL, Usuario } from '../../core/modelos/usuario';
import { AuthService } from '../../core/servicios/auth.service';
import { CoberturaService } from '../../core/servicios/cobertura.service';
import { deFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';

/** Un renglón de la ficha del perfil. */
interface DatoPerfil {
  icono: string;
  etiqueta: string;
  valor: string;
}

@Component({
  selector: 'app-perfil',
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressBarModule,
  ],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly coberturaService = inject(CoberturaService);

  protected readonly usuario = signal<Usuario | null>(null);
  private readonly coberturas = signal<Cobertura[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Los datos del usuario, ya formateados para mostrar. */
  protected readonly datos = computed<DatoPerfil[]>(() => {
    const usuario = this.usuario();
    if (!usuario) return [];

    const datos: DatoPerfil[] = [
      { icono: 'badge', etiqueta: 'DNI', valor: usuario.dni },
      { icono: 'mail', etiqueta: 'Email', valor: usuario.email },
      { icono: 'call', etiqueta: 'Teléfono', valor: usuario.telefono },
      {
        icono: 'cake',
        etiqueta: 'Fecha de nacimiento',
        valor: deFechaApi(usuario.fecha_nacimiento),
      },
      { icono: 'person', etiqueta: 'Tipo de usuario', valor: NOMBRE_ROL[usuario.rol] },
    ];

    // Solo los pacientes tienen cobertura: para el personal llega en null.
    if (usuario.id_cobertura !== null) {
      const cobertura = this.coberturas().find((c) => c.id === usuario.id_cobertura);
      datos.push({
        icono: 'health_and_safety',
        etiqueta: 'Cobertura',
        valor: cobertura?.nombre ?? `Cobertura n.º ${usuario.id_cobertura}`,
      });
    }

    return datos;
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide el perfil y las coberturas a la vez. Se puede reintentar si falló. */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      usuario: this.auth.perfil(),
      // Si el listado de coberturas fallara, el perfil se muestra igual con el
      // número de cobertura: no vale la pena perder toda la pantalla por eso.
      coberturas: this.coberturaService
        .listarDisponibles()
        .pipe(catchError(() => of<Cobertura[]>([]))),
    }).subscribe({
      next: ({ usuario, coberturas }) => {
        this.usuario.set(usuario);
        this.coberturas.set(coberturas);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }
}
