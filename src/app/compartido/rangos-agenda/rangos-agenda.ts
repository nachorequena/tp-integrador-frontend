/**
 * RANGOS HORARIOS DE UN MÉDICO EN UNA FECHA
 * =========================================
 *
 * Tabla con los rangos de agenda de UN médico para UNA fecha, con las
 * acciones de agregar, modificar y eliminar (la consigna: "puede cargar más de
 * un rango para el mismo día" y "puede modificar y eliminar sus rangos").
 *
 * Quién lo usa:
 *   - `paginas/agendas` en modo médico ("Mi agenda"): su propia agenda del día
 *     elegido, en todas las sedes donde atiende;
 *   - `paginas/agendas/dialogo-agenda-medico` (lápiz del operador o del
 *     administrador): la agenda de un médico en una sede.
 *
 * Datos: `AgendaService.listar` (`GET /agendas?id_medico&fecha&id_sede`).
 * Formulario: `compartido/dialogo-rango`. Baja: `compartido/dialogo-confirmacion`.
 *
 * Un rango con turnos confirmados no se puede eliminar: el botón aparece
 * deshabilitado con el motivo en el tooltip. Si igual el backend rechaza algo
 * (por ejemplo, un recorte que deja turnos afuera), se muestra su mensaje.
 * Cada cambio exitoso recarga la tabla y emite `cambio`, para que la pantalla
 * que lo contiene se actualice también.
 */

import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Agenda } from '../../core/modelos/agenda';
import { Medico } from '../../core/modelos/medico';
import { Sede } from '../../core/modelos/sede';
import { AgendaService } from '../../core/servicios/agenda.service';
import { deFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { confirmar } from '../dialogo-confirmacion/dialogo-confirmacion';
import { DatosDialogoRango, DialogoRango } from '../dialogo-rango/dialogo-rango';

@Component({
  selector: 'app-rangos-agenda',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressBarModule],
  templateUrl: './rangos-agenda.html',
})
export class RangosAgenda {
  private readonly agendaService = inject(AgendaService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  /** Médico cuya agenda se muestra (con sus especialidades). */
  readonly medico = input.required<Medico>();
  /** Fecha a mostrar, `YYYY-MM-DD`. */
  readonly fecha = input.required<string>();
  /** Sede a la que se limita la tabla; `null` = todas las sedes. */
  readonly idSede = input<number | null>(null);
  /** Sedes para el formulario. */
  readonly sedes = input.required<Sede[]>();
  /** Sede fija para el formulario (operador), o `null` si se puede elegir. */
  readonly idSedeFija = input<number | null>(null);
  /** `false` para mostrar la agenda sin acciones (solo lectura). */
  readonly editable = input(true);

  /** Se emite después de cada alta, modificación o baja exitosa. */
  readonly cambio = output<void>();

  protected readonly columnas = ['horario', 'especialidad', 'sede', 'turnos', 'acciones'];
  protected readonly rangos = signal<Agenda[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly deFechaApi = deFechaApi;

  constructor() {
    // Se recarga solo cuando cambian el médico, la fecha o la sede. El resto se
    // lee con `untracked` para no disparar recargas de más.
    effect(() => {
      const medico = this.medico();
      const fecha = this.fecha();
      const idSede = this.idSede();
      untracked(() => this.cargar(medico.id, fecha, idSede));
    });
  }

  /** Recarga la tabla con los datos actuales. */
  recargar(): void {
    this.cargar(this.medico().id, this.fecha(), this.idSede());
  }

  /** `GET /agendas?id_medico=&fecha=&id_sede=`. */
  private cargar(idMedico: number, fecha: string, idSede: number | null): void {
    this.cargando.set(true);
    this.error.set(null);
    this.agendaService
      .listar({ id_medico: idMedico, fecha, id_sede: idSede ?? undefined })
      .subscribe({
        next: (rangos) => {
          this.rangos.set(rangos);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  /** Abre el formulario de alta (sin rango) o de modificación (con rango). */
  protected abrirFormulario(rango: Agenda | null = null): void {
    const datos: DatosDialogoRango = {
      rango,
      medico: this.medico(),
      sedes: this.sedes(),
      idSedeFija: this.idSedeFija(),
      // Preselección de la consigna: la sede filtrada o, si no, la del médico.
      idSedePorDefecto: this.idSede() ?? this.medico().id_sede,
      fecha: this.fecha(),
    };
    this.dialogo
      .open(DialogoRango, { data: datos, width: '520px' })
      .afterClosed()
      .subscribe((guardado?: Agenda) => {
        if (!guardado) return;
        this.avisos.open(rango ? 'Rango modificado.' : 'Rango agregado.', 'Cerrar', {
          duration: 3000,
        });
        this.recargar();
        this.cambio.emit();
      });
  }

  /** Pide confirmación y elimina el rango; si el backend lo rechaza, avisa. */
  protected eliminar(rango: Agenda): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar rango horario',
      mensaje: `¿Está seguro de eliminar el rango de ${rango.hora_entrada} a ${rango.hora_salida} del ${deFechaApi(rango.fecha)} en ${rango.sede}?`,
      textoConfirmar: 'Eliminar',
    }).subscribe((confirmado) => {
      if (!confirmado) return;
      this.agendaService.eliminar(rango.id).subscribe({
        next: () => {
          this.avisos.open('Rango eliminado.', 'Cerrar', { duration: 3000 });
          this.recargar();
          this.cambio.emit();
        },
        error: (error: unknown) =>
          this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 7000 }),
      });
    });
  }
}
