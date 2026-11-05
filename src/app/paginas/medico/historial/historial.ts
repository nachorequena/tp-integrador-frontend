/**
 * PANTALLA "HISTORIAL DE PACIENTES" (rol médico)
 * ==============================================
 *
 * El médico busca un paciente por DNI o apellido (`compartido/buscador-
 * pacientes`, `GET /pacientes`) y consulta su historial clínico.
 *
 * Solo se muestran los registros de los turnos que atendió el médico logueado
 * (consigna y criterio de aceptación). Ese filtro lo aplica el BACKEND en
 * `GET /historial/paciente/:id` usando el id del token: la interfaz no tiene
 * forma de pedir registros de otro médico.
 *
 * Ruta: `/medico/historial`. Componente: `compartido/lista-historial`.
 */

import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BuscadorPacientes } from '../../../compartido/buscador-pacientes/buscador-pacientes';
import { ListaHistorial } from '../../../compartido/lista-historial/lista-historial';
import { RegistroHistorial } from '../../../core/modelos/historial';
import { PacienteEncontrado } from '../../../core/modelos/paciente';
import { HistorialService } from '../../../core/servicios/historial.service';
import { calcularEdad } from '../../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-historial-medico',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    BuscadorPacientes,
    ListaHistorial,
  ],
  template: `
    <section class="pagina">
      <header class="encabezado-pagina">
        <div>
          <h1>Historial de pacientes</h1>
          <p>Solo se muestran los registros de los turnos que atendiste vos.</p>
        </div>
      </header>

      <!-- Buscador: al elegir un paciente se llama a elegir() y se carga su historial. -->
      <mat-card appearance="outlined" class="tarjeta-busqueda">
        <mat-card-content>
          <app-buscador-pacientes (elegido)="elegir($event)" />
        </mat-card-content>
      </mat-card>

      @if (paciente(); as elegido) {
        <h2 class="titulo-paciente">
          {{ elegido.apellido }}, {{ elegido.nombre }} · DNI {{ elegido.dni }} ·
          {{ calcularEdad(elegido.fecha_nacimiento) }} años
        </h2>
        @if (cargando()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @if (error()) {
          <p class="error-servidor" role="alert">
            <mat-icon>error</mat-icon>
            {{ error() }}
            <button mat-button (click)="elegir(elegido)">Reintentar</button>
          </p>
        } @else if (!cargando()) {
          <app-lista-historial
            [registros]="registros()"
            textoVacio="No hay registros de turnos que hayas atendido a este paciente."
          />
        }
      }
    </section>
  `,
  styles: `
    .tarjeta-busqueda {
      margin-bottom: 16px;
    }
    .titulo-paciente {
      font: var(--mat-sys-title-medium);
    }
  `,
})
export class HistorialMedico {
  private readonly historialService = inject(HistorialService);

  protected readonly paciente = signal<PacienteEncontrado | null>(null);
  protected readonly registros = signal<RegistroHistorial[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly calcularEdad = calcularEdad;

  /** Paciente elegido: pide su historial (`GET /historial/paciente/:id`). */
  protected elegir(paciente: PacienteEncontrado): void {
    this.paciente.set(paciente);
    this.cargando.set(true);
    this.error.set(null);
    this.historialService.dePaciente(paciente.id).subscribe({
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
