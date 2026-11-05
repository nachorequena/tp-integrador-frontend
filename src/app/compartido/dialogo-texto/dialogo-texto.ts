/**
 * DIÁLOGO DE ALTA / MODIFICACIÓN DE UN SOLO CAMPO DE TEXTO
 * ========================================================
 *
 * Formulario de un único campo obligatorio con largo máximo. Lo comparten las
 * dos entidades del administrador que solo tienen un dato:
 *
 *   - `paginas/admin/especialidades` → `descripcion` (máx. 30);
 *   - `paginas/admin/coberturas` → `nombre` (máx. 30).
 *
 * Igual que `dialogo-sede`, guarda él mismo (con la función `guardar` que le
 * pasa la pantalla) para poder mostrar el error del backend sin cerrarse. Se
 * cierra con `true` si se guardó.
 *
 * Con qué se conecta: lo abren `paginas/admin/especialidades` y
 * `paginas/admin/coberturas`, que le pasan en `guardar` la llamada a su
 * servicio.
 */

import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { textoNoVacio } from '../../core/utilidades/validadores';

/** Configuración del diálogo, la arma la pantalla que lo abre. */
export interface DatosDialogoTexto {
  titulo: string;
  /** Etiqueta del campo ("Descripción", "Nombre"). */
  etiqueta: string;
  /** Valor actual en una modificación; vacío en un alta. */
  valorInicial: string;
  /** Largo máximo: el de la columna de la base. */
  maximo: number;
  /** Llamada al servicio que guarda el texto (POST o PUT). */
  guardar: (texto: string) => Observable<unknown>;
}

@Component({
  selector: 'app-dialogo-texto',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <!-- El submit llama a guardar(); el error del backend queda visible acá. -->
    <form [formGroup]="formulario" (ngSubmit)="guardar()">
      <mat-dialog-content class="formulario-dialogo">
        @if (guardando()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @if (error()) {
          <p class="error-servidor" role="alert">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </p>
        }
        <mat-form-field appearance="outline">
          <mat-label>{{ datos.etiqueta }}</mat-label>
          <input matInput formControlName="campo" [attr.maxlength]="datos.maximo" />
          <mat-hint align="end">{{ campo.value.length }} / {{ datos.maximo }}</mat-hint>
          @if (campo.hasError('required')) {
            <mat-error>Este campo es obligatorio.</mat-error>
          } @else if (campo.hasError('maxlength')) {
            <mat-error>Máximo {{ datos.maximo }} caracteres.</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="guardando()">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class DialogoTexto {
  protected readonly datos = inject<DatosDialogoTexto>(MAT_DIALOG_DATA);
  private readonly referencia = inject(MatDialogRef<DialogoTexto, boolean>);

  protected readonly campo = new FormControl(this.datos.valorInicial, {
    nonNullable: true,
    validators: [Validators.required, textoNoVacio, Validators.maxLength(this.datos.maximo)],
  });

  /**
   * Grupo que envuelve al campo: sin `[formGroup]` en el `<form>`, Angular no
   * intercepta el envío y el navegador recarga la página al tocar "Guardar".
   */
  protected readonly formulario = new FormGroup({ campo: this.campo });

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Valida, guarda con la función recibida y cierra con `true` si salió bien. */
  protected guardar(): void {
    if (this.campo.invalid) {
      this.campo.markAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.datos.guardar(this.campo.value.trim()).subscribe({
      next: () => this.referencia.close(true),
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.guardando.set(false);
      },
    });
  }
}
