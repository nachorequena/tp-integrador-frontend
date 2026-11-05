/**
 * PANTALLA DE TURNOS DEL DÍA (médico y operador)
 * ==============================================
 *
 * Una sola pantalla para los dos roles que trabajan con los turnos de una
 * fecha. Mira el rol de la sesión y se adapta:
 *
 * MÉDICO — "Turnos del día" (`/medico/turnos`):
 *   - por defecto los turnos de HOY en todas las sedes donde atiende, con
 *     selector de fecha y filtro de sede (`GET /turnos/medico`);
 *   - tabla con hora, paciente, edad (calculada con la fecha de nacimiento) y
 *     sede, ordenada por hora (proximidad); al hacer click en un turno se
 *     despliegan las notas del paciente;
 *   - cada turno confirmado tiene "Marcar como atendido" (con el historial
 *     clínico, `dialogo-atencion`) y "Cancelar" (con confirmación).
 *
 * OPERADOR — "Turnos de la sede" (`/operador/turnos`):
 *   - los turnos de SU sede (la sede sale del token en el backend,
 *     `GET /turnos/sede`), con fecha, médico y estado como filtros;
 *   - es el destino del ícono de "ojo" de la agenda: llega con
 *     `?fecha=&id_medico=` en la URL y muestra los turnos confirmados de ese
 *     médico ese día, que se pueden cancelar.
 *
 * Después de atender o cancelar, se recargan la tabla y las notificaciones
 * (el backend acaba de generar una para quien hizo la acción).
 */

import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, of } from 'rxjs';
import { confirmar } from '../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { Medico } from '../../core/modelos/medico';
import { Sede } from '../../core/modelos/sede';
import { EstadoTurno, NOMBRE_ESTADO, Turno } from '../../core/modelos/turno';
import { MedicoService } from '../../core/servicios/medico.service';
import { NotificacionService } from '../../core/servicios/notificacion.service';
import { SedeService } from '../../core/servicios/sede.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { TurnoService } from '../../core/servicios/turno.service';
import {
  aDate,
  aFechaApi,
  calcularEdad,
  deFechaApi,
} from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../core/utilidades/textos-datepicker';
import { DialogoAtencion } from './dialogo-atencion';

@Component({
  selector: 'app-turnos-del-dia',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './turnos-del-dia.html',
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class TurnosDelDia implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly sedeService = inject(SedeService);
  private readonly medicoService = inject(MedicoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly sesion = inject(SesionService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  /** `?fecha=YYYY-MM-DD` de la URL (lo manda el "ojo" de la agenda del operador). */
  readonly fecha = input<string | undefined>(undefined);
  /** `?id_medico=` de la URL (idem). */
  readonly id_medico = input<string | undefined>(undefined);

  private readonly usuario = this.sesion.usuario()!;
  protected readonly esMedico = this.usuario.rol === 'medico';

  protected readonly filtros = inject(FormBuilder).group({
    fecha: [new Date()],
    /** Filtro de sede (solo médico). */
    id_sede: [null as number | null],
    /** Filtro de médico (solo operador). */
    id_medico: [null as number | null],
    /** Filtro de estado, se aplica en el navegador. */
    estado: ['' as EstadoTurno | ''],
  });

  protected readonly turnos = signal<Turno[]>([]);
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  /** Id del turno cuya fila está desplegada (notas del paciente). */
  protected readonly desplegado = signal<number | null>(null);
  /** Filtro de estado como signal, para el `computed` de abajo. */
  private readonly estadoFiltro = signal<EstadoTurno | ''>('');

  protected readonly NOMBRE_ESTADO = NOMBRE_ESTADO;
  protected readonly estados = Object.keys(NOMBRE_ESTADO) as EstadoTurno[];
  protected readonly deFechaApi = deFechaApi;
  protected readonly calcularEdad = calcularEdad;

  /** Columnas: el médico ve la sede; el operador (una sola sede) ve el médico. */
  protected readonly columnas = this.esMedico
    ? ['hora', 'paciente', 'edad', 'sede', 'estado', 'acciones']
    : ['hora', 'paciente', 'edad', 'medico', 'estado', 'acciones'];

  /** Turnos que pasan el filtro de estado. */
  protected readonly turnosFiltrados = computed(() => {
    const estado = this.estadoFiltro();
    return estado ? this.turnos().filter((t) => t.estado === estado) : this.turnos();
  });

  constructor() {
    this.filtros.valueChanges.pipe(takeUntilDestroyed()).subscribe(({ fecha, estado }) => {
      this.estadoFiltro.set(estado ?? '');
      if (fecha && !Number.isNaN(fecha.getTime())) this.cargar();
    });
  }

  ngOnInit(): void {
    // Si se llegó desde el "ojo" de la agenda, se precargan fecha y médico y
    // se muestran solo los confirmados (la consigna: "ver los turnos
    // confirmados de ese médico para esa fecha").
    const fechaUrl = this.fecha();
    const medicoUrl = Number(this.id_medico());
    if (fechaUrl) this.filtros.controls.fecha.setValue(aDate(fechaUrl), { emitEvent: false });
    if (medicoUrl) {
      this.filtros.controls.id_medico.setValue(medicoUrl, { emitEvent: false });
      this.filtros.controls.estado.setValue('confirmado', { emitEvent: false });
      this.estadoFiltro.set('confirmado');
    }

    this.cargarListados();
    this.cargar();
  }

  /** Sedes (filtro del médico) o médicos de la sede (filtro del operador). */
  private cargarListados(): void {
    if (this.esMedico) {
      this.sedeService
        .listar()
        .pipe(catchError(() => of<Sede[]>([])))
        .subscribe((sedes) => this.sedes.set(sedes));
    } else {
      this.medicoService
        .listar({ id_sede: this.usuario.id_sede ?? undefined })
        .pipe(catchError(() => of<Medico[]>([])))
        .subscribe((medicos) => this.medicos.set(medicos));
    }
  }

  /** Pide los turnos de la fecha con el endpoint que corresponde al rol. */
  protected cargar(): void {
    const { fecha, id_sede, id_medico } = this.filtros.getRawValue();
    if (!fecha || Number.isNaN(fecha.getTime())) return;
    const fechaApi = aFechaApi(fecha);

    this.cargando.set(true);
    this.error.set(null);
    const pedido = this.esMedico
      ? this.turnoService.delMedico(fechaApi, id_sede ?? undefined)
      : this.turnoService.deLaSede(fechaApi, id_medico ?? undefined);

    pedido.subscribe({
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

  /**
   * Texto legible de un estado. Existe porque la fila de `mat-table` llega
   * sin tipo y el template no puede indexar `NOMBRE_ESTADO` con ella.
   */
  protected nombreEstado(estado: EstadoTurno): string {
    return NOMBRE_ESTADO[estado] ?? estado;
  }

  /** Click en una fila: despliega (o pliega) las notas del paciente. */
  protected alternarDetalle(turno: Turno): void {
    this.desplegado.set(this.desplegado() === turno.id ? null : turno.id);
  }

  /** Abre el diálogo de atención (historial clínico) para un turno confirmado. */
  protected atender(turno: Turno, evento: MouseEvent): void {
    // Sin esto, el click del botón también desplegaría la fila.
    evento.stopPropagation();
    this.dialogo
      .open(DialogoAtencion, { data: turno, width: '560px' })
      .afterClosed()
      .subscribe((atendido?: Turno) => {
        if (!atendido) return;
        this.avisos.open('Turno marcado como atendido.', 'Cerrar', { duration: 3000 });
        this.notificaciones.cargar();
        this.cargar();
      });
  }

  /** Pide confirmación y cancela el turno. */
  protected cancelar(turno: Turno, evento: MouseEvent): void {
    evento.stopPropagation();
    confirmar(this.dialogo, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno de ${turno.paciente} del ${deFechaApi(turno.fecha)} a las ${turno.hora}?`,
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
