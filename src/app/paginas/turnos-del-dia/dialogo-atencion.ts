/**
 * DIÁLOGO "MARCAR COMO ATENDIDO" (rol médico)
 * ===========================================
 *
 * Se abre desde `paginas/turnos-del-dia` sobre un turno confirmado. Pide el
 * historial clínico de la consulta (diagnóstico obligatorio, tratamiento y
 * observaciones opcionales) y lo manda junto con el cambio de estado en un
 * solo pedido: `PATCH /turnos/:id/atender` (`TurnoService.atender`). El
 * backend guarda las dos cosas en una transacción.
 *
 * Los máximos (255) son los de las columnas de `historial_clinico`.
 * Se cierra devolviendo el turno ya atendido.
 */

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Turno } from '../../core/modelos/turno';
import { TurnoService } from '../../core/servicios/turno.service';
import { deFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { textoNoVacio } from '../../core/utilidades/validadores';

/** Largo de las columnas de texto de `historial_clinico`. */
const MAXIMO = 255;

@Component({
  selector: 'app-dialogo-atencion',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './dialogo-atencion.html',
})
export class DialogoAtencion {
  private readonly turnoService = inject(TurnoService);
  private readonly referencia = inject(MatDialogRef<DialogoAtencion, Turno>);
  /** Turno que se está atendiendo. */
  protected readonly turno = inject<Turno>(MAT_DIALOG_DATA);

  protected readonly maximo = MAXIMO;
  protected readonly deFechaApi = deFechaApi;

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    diagnostico: ['', [Validators.required, textoNoVacio, Validators.maxLength(MAXIMO)]],
    tratamiento: ['', Validators.maxLength(MAXIMO)],
    observaciones: ['', Validators.maxLength(MAXIMO)],
  });

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Valida y marca el turno como atendido con su historial. */
  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    this.turnoService
      .atender(this.turno.id, {
        diagnostico: valores.diagnostico.trim(),
        // Los opcionales vacíos no se mandan: el backend los guarda como NULL.
        tratamiento: valores.tratamiento.trim() || undefined,
        observaciones: valores.observaciones.trim() || undefined,
      })
      .subscribe({
        next: (turno) => this.referencia.close(turno),
        error: (error: unknown) => {
          this.error.set(mensajeDeError(error));
          this.guardando.set(false);
        },
      });
  }
}
