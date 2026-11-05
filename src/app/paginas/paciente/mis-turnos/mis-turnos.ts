/**
 * PANTALLA "MIS TURNOS" (rol paciente)
 * ====================================
 *
 * Listado de los turnos del paciente, del más próximo al menos próximo (el
 * orden lo arma el backend), como un acordeón de `mat-expansion-panel`:
 *   - encabezado: fecha, hora, especialidad y un chip de color por estado
 *     (confirmado, cancelado, atendido se distinguen visualmente);
 *   - detalle desplegable: fecha completa, especialista, especialidad, sede,
 *     nota y, si el turno ya fue atendido, el resumen del historial clínico
 *     (diagnóstico, tratamiento y observaciones);
 *   - los turnos confirmados se pueden cancelar, previa confirmación.
 *
 * Ruta: `/paciente/mis-turnos`. Servicio: `TurnoService` (`GET /turnos/mios`,
 * `PATCH /turnos/:id/cancelar`). Después de cancelar se recargan el listado y
 * las notificaciones.
 */

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { confirmar } from '../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { NOMBRE_ESTADO, Turno } from '../../../core/modelos/turno';
import { NotificacionService } from '../../../core/servicios/notificacion.service';
import { TurnoService } from '../../../core/servicios/turno.service';
import { aDate, deFechaApi } from '../../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-mis-turnos',
  imports: [
    DatePipe,
    RouterLink,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './mis-turnos.html',
})
export class MisTurnos implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  protected readonly turnos = signal<Turno[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly NOMBRE_ESTADO = NOMBRE_ESTADO;
  protected readonly aDate = aDate;
  protected readonly deFechaApi = deFechaApi;

  ngOnInit(): void {
    this.cargar();
  }

  /** `GET /turnos/mios`. */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.turnoService.misTurnos().subscribe({
      next: (turnos) => {
        this.turnos.set(turnos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Pide confirmación y cancela un turno confirmado. */
  protected cancelar(turno: Turno): void {
    confirmar(this.dialogo, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar su turno de ${turno.especialidad} del ${deFechaApi(turno.fecha)} a las ${turno.hora}?`,
      textoConfirmar: 'Cancelar turno',
    }).subscribe((confirmado) => {
      if (!confirmado) return;
      this.turnoService.cancelar(turno.id).subscribe({
        next: () => {
          this.avisos.open('Turno cancelado.', 'Cerrar', { duration: 3000 });
          this.notificaciones.cargar();
          this.cargar();
        },
        error: (error: unknown) =>
          this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 7000 }),
      });
    });
  }
}
