/**
 * PANTALLA "MI HISTORIAL CLÍNICO" (rol paciente)
 * ==============================================
 *
 * Todo el historial clínico del paciente logueado, lo más reciente primero.
 *
 * Ruta: `/paciente/historial`. Servicio: `HistorialService.mio()`
 * (`GET /historial/mio`; el paciente sale del token, nunca de la URL).
 * Componente: `compartido/lista-historial`.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ListaHistorial } from '../../../compartido/lista-historial/lista-historial';
import { RegistroHistorial } from '../../../core/modelos/historial';
import { HistorialService } from '../../../core/servicios/historial.service';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-historial-paciente',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, ListaHistorial],
  template: `
    <section class="pagina">
      <header class="encabezado-pagina">
        <h1>Mi historial clínico</h1>
      </header>
      @if (cargando()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (error()) {
        <p class="error-servidor" role="alert">
          <mat-icon>error</mat-icon>
          {{ error() }}
          <button mat-button (click)="cargar()">Reintentar</button>
        </p>
      } @else if (!cargando()) {
        <app-lista-historial
          [registros]="registros()"
          textoVacio="Todavía no tenés registros en tu historial clínico."
        />
      }
    </section>
  `,
})
export class HistorialPaciente implements OnInit {
  private readonly historialService = inject(HistorialService);

  protected readonly registros = signal<RegistroHistorial[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  /** `GET /historial/mio`. */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.historialService.mio().subscribe({
      next: (registros) => {
        this.registros.set(registros);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }
}
