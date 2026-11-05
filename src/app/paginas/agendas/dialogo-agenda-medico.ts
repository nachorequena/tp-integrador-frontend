/**
 * DIÁLOGO "EDITAR AGENDA DEL MÉDICO" (lápiz del operador / administrador)
 * ======================================================================
 *
 * Se abre desde la tabla de `paginas/agendas` al tocar el ícono de lápiz de
 * un médico. Muestra los rangos horarios de ese médico en la fecha y sede
 * filtradas, con las acciones de agregar, modificar y eliminar (la consigna:
 * "editar la agenda del médico, para agregar, modificar o eliminar sus rangos
 * horarios").
 *
 * Todo el trabajo lo hace `compartido/rangos-agenda`; este diálogo solo lo
 * envuelve y, al cerrarse, le avisa a la pantalla si hubo cambios para que
 * recargue su tabla.
 */

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RangosAgenda } from '../../compartido/rangos-agenda/rangos-agenda';
import { Medico } from '../../core/modelos/medico';
import { Sede } from '../../core/modelos/sede';
import { deFechaApi } from '../../core/utilidades/adaptador-fecha';

/** Datos que recibe el diálogo. */
export interface DatosDialogoAgendaMedico {
  medico: Medico;
  fecha: string;
  idSede: number;
  sedes: Sede[];
  /** Sede fija del operador, o `null` para el administrador. */
  idSedeFija: number | null;
}

@Component({
  selector: 'app-dialogo-agenda-medico',
  imports: [MatDialogModule, MatButtonModule, RangosAgenda],
  template: `
    <h2 mat-dialog-title>
      Agenda de {{ datos.medico.apellido }}, {{ datos.medico.nombre }}
      <small class="subtitulo-dialogo">· {{ deFechaApi(datos.fecha) }}</small>
    </h2>
    <mat-dialog-content>
      <!-- (cambio) marca que hubo modificaciones, para recargar al cerrar. -->
      <app-rangos-agenda
        [medico]="datos.medico"
        [fecha]="datos.fecha"
        [idSede]="datos.idSede"
        [sedes]="datos.sedes"
        [idSedeFija]="datos.idSedeFija"
        (cambio)="huboCambios = true"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button (click)="cerrar()">Listo</button>
    </mat-dialog-actions>
  `,
})
export class DialogoAgendaMedico {
  protected readonly datos = inject<DatosDialogoAgendaMedico>(MAT_DIALOG_DATA);
  private readonly referencia = inject(MatDialogRef<DialogoAgendaMedico, boolean>);
  protected readonly deFechaApi = deFechaApi;

  /** Se pone en `true` si se agregó, modificó o eliminó algún rango. */
  protected huboCambios = false;

  /** Cierra avisando si hubo cambios. */
  protected cerrar(): void {
    this.referencia.close(this.huboCambios);
  }
}
