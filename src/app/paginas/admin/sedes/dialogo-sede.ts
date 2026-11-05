/**
 * DIÁLOGO DE ALTA / MODIFICACIÓN DE SEDE
 * ======================================
 *
 * Formulario con validaciones (nombre, dirección y teléfono) que se abre desde
 * `paginas/admin/sedes`. Guarda él mismo contra el backend (`SedeService`):
 * así, si el backend rechaza el dato, el error se muestra dentro del diálogo
 * y el usuario puede corregir sin volver a cargar todo. Se cierra devolviendo
 * la sede guardada, y la pantalla recarga el listado.
 *
 * Los largos máximos son los de las columnas de la tabla `sede`.
 */

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Sede } from '../../../core/modelos/sede';
import { SedeService } from '../../../core/servicios/sede.service';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { textoNoVacio } from '../../../core/utilidades/validadores';

@Component({
  selector: 'app-dialogo-sede',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './dialogo-sede.html',
})
export class DialogoSede {
  private readonly sedeService = inject(SedeService);
  private readonly referencia = inject(MatDialogRef<DialogoSede, Sede>);

  /** Sede a modificar, o `null` si es un alta. */
  protected readonly sede = inject<Sede | null>(MAT_DIALOG_DATA);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre: [
      this.sede?.nombre ?? '',
      [Validators.required, textoNoVacio, Validators.maxLength(50)],
    ],
    direccion: [
      this.sede?.direccion ?? '',
      [Validators.required, textoNoVacio, Validators.maxLength(100)],
    ],
    telefono: [this.sede?.telefono ?? '', [Validators.required, Validators.pattern(/^\d{1,15}$/)]],
  });

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Valida, guarda (POST o PUT) y cierra el diálogo con la sede guardada. */
  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      direccion: valores.direccion.trim(),
      telefono: valores.telefono,
    };

    this.guardando.set(true);
    this.error.set(null);
    const pedido = this.sede
      ? this.sedeService.actualizar(this.sede.id, datos)
      : this.sedeService.crear(datos);

    pedido.subscribe({
      next: (guardada) => this.referencia.close(guardada),
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.guardando.set(false);
      },
    });
  }
}
