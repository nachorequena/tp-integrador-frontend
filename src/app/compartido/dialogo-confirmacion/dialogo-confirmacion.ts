/**
 * DIÁLOGO DE CONFIRMACIÓN
 * =======================
 *
 * Ventana "¿Está seguro de…?" que la consigna pide antes de cada baja y de
 * cada cancelación de turno. Es un `MatDialog` que se cierra con `true`
 * (confirmó) o `false`/`undefined` (se arrepintió).
 *
 * Quién lo usa (siempre a través de `confirmar()`): las bajas de sedes,
 * especialidades, coberturas y rangos de agenda, y la cancelación de turnos
 * (mis turnos, turnos del día y turnos de la sede).
 */

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { map, Observable } from 'rxjs';

/** Qué muestra el diálogo. */
export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  /** Texto del botón que confirma (por defecto "Confirmar"). */
  textoConfirmar?: string;
}

@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>
      <p>{{ datos.mensaje }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <!-- Cerrar con false = "no hacer nada"; el foco arranca acá para que un
           Enter apurado no confirme una baja. -->
      <button mat-button [mat-dialog-close]="false" cdkFocusInitial>Volver</button>
      <button mat-flat-button [mat-dialog-close]="true">
        {{ datos.textoConfirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogoConfirmacion {
  /** Datos que pasó quien abrió el diálogo. */
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}

/**
 * Abre el diálogo de confirmación y devuelve la respuesta del usuario.
 *
 * Uso típico en una pantalla:
 *
 * ```ts
 * confirmar(this.dialogo, { titulo: 'Eliminar sede', mensaje: '¿Está seguro…?' })
 *   .subscribe((ok) => { if (ok) this.eliminar(sede); });
 * ```
 *
 * @param dialogo Servicio `MatDialog` inyectado en la pantalla.
 * @param datos Título, mensaje y texto del botón.
 * @returns Un observable que emite `true` solo si el usuario confirmó.
 */
export function confirmar(dialogo: MatDialog, datos: DatosConfirmacion): Observable<boolean> {
  return dialogo
    .open(DialogoConfirmacion, { data: datos, width: '420px' })
    .afterClosed()
    .pipe(map((respuesta: unknown) => respuesta === true));
}
