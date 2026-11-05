/**
 * LISTA DE REGISTROS DEL HISTORIAL CLÍNICO
 * ========================================
 *
 * Muestra registros del historial clínico como tarjetas: fecha y hora del
 * turno, médico, especialidad, sede, diagnóstico, tratamiento y
 * observaciones. Si la lista está vacía, muestra un mensaje en lugar de nada.
 *
 * Quién la usa: `paginas/paciente/historial` (todo su historial) y
 * `paginas/medico/historial` (solo los turnos que atendió el médico logueado;
 * ese filtro lo hace el backend).
 */

import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RegistroHistorial } from '../../core/modelos/historial';
import { deFechaApi } from '../../core/utilidades/adaptador-fecha';

@Component({
  selector: 'app-lista-historial',
  imports: [MatCardModule, MatIconModule],
  template: `
    @if (registros().length === 0) {
      <div class="estado-vacio">
        <mat-icon>folder_off</mat-icon>
        <span>{{ textoVacio() }}</span>
      </div>
    } @else {
      <div class="pila-tarjetas">
        @for (registro of registros(); track registro.id) {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-icon mat-card-avatar>medical_information</mat-icon>
              <mat-card-title>
                {{ deFechaApi(registro.fecha_turno) }} · {{ registro.hora_turno }}
              </mat-card-title>
              <mat-card-subtitle>
                {{ registro.especialidad }} · {{ registro.medico }} · {{ registro.sede }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <dl class="datos-detalle">
                <dt>Diagnóstico</dt>
                <dd>{{ registro.diagnostico }}</dd>
                <dt>Tratamiento</dt>
                <dd>{{ registro.tratamiento ?? '—' }}</dd>
                <dt>Observaciones</dt>
                <dd>{{ registro.observaciones ?? '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
})
export class ListaHistorial {
  /** Registros a mostrar, ya ordenados por el backend (lo más reciente primero). */
  readonly registros = input.required<RegistroHistorial[]>();

  /** Mensaje cuando no hay registros. */
  readonly textoVacio = input('No hay registros en el historial clínico.');

  protected readonly deFechaApi = deFechaApi;
}
