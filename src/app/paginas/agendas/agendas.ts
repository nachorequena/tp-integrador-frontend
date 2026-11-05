/**
 * PANTALLA DE AGENDA (médico, operador y administrador)
 * ====================================================
 *
 * Una sola pantalla para los tres roles que gestionan agenda. Mira el rol de
 * la sesión y se adapta (así no hay pantallas duplicadas):
 *
 * MÉDICO — "Mi agenda" (`/medico/agenda`):
 *   - ve su propia agenda, por defecto la del día actual, con selector de
 *     fecha y filtro opcional de sede (puede atender en más de una);
 *   - agrega, modifica y elimina sus rangos con `compartido/rangos-agenda`.
 *
 * OPERADOR — "Agendas médicas" (`/operador/agendas`):
 *   - filtro de fecha (por defecto hoy) y de sede (por defecto la suya);
 *   - tabla con los médicos que tienen agenda ese día en esa sede: nombre,
 *     especialidad y horario de atención; al cambiar un filtro se actualiza;
 *   - "Nueva agenda": elige un médico de un listado y le carga un rango en su
 *     sede, aunque el médico no tenga agenda previa;
 *   - por fila: lápiz (editar los rangos de ese médico, `dialogo-agenda-medico`)
 *     y ojo (ver sus turnos confirmados de esa fecha en "Turnos de la sede",
 *     donde se pueden cancelar);
 *   - esas acciones y "Nueva agenda" SOLO están disponibles en su sede: las
 *     demás sedes se consultan pero no se modifican.
 *
 * ADMINISTRADOR — "Agendas médicas" (`/admin/agendas`): igual que el
 * operador, pero puede modificar todas las sedes (el backend lo permite) y no
 * tiene el ojo, porque los turnos no son parte de su rol.
 *
 * Servicios: `AgendaService` (`GET /agendas`), `MedicoService`
 * (`GET /medicos`), `SedeService` (`GET /sedes`).
 */

import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DatosDialogoRango, DialogoRango } from '../../compartido/dialogo-rango/dialogo-rango';
import { RangosAgenda } from '../../compartido/rangos-agenda/rangos-agenda';
import { Agenda } from '../../core/modelos/agenda';
import { Medico } from '../../core/modelos/medico';
import { Sede } from '../../core/modelos/sede';
import { AgendaService } from '../../core/servicios/agenda.service';
import { MedicoService } from '../../core/servicios/medico.service';
import { SedeService } from '../../core/servicios/sede.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { aFechaApi, deFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../core/utilidades/textos-datepicker';
import { DatosDialogoAgendaMedico, DialogoAgendaMedico } from './dialogo-agenda-medico';

/** Una fila de la tabla del operador: un médico con sus rangos del día. */
interface FilaMedico {
  idMedico: number;
  medico: string;
  /** Especialidades de sus rangos de ese día, sin repetir. */
  especialidades: string;
  /** Horarios de atención, por ejemplo "08:00 a 12:00 · 15:00 a 19:00". */
  horarios: string;
  /** Turnos confirmados sumando todos sus rangos de ese día. */
  turnosConfirmados: number;
}

@Component({
  selector: 'app-agendas',
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
    RangosAgenda,
  ],
  templateUrl: './agendas.html',
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class Agendas implements OnInit {
  private readonly agendaService = inject(AgendaService);
  private readonly medicoService = inject(MedicoService);
  private readonly sedeService = inject(SedeService);
  private readonly sesion = inject(SesionService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly router = inject(Router);

  /** Usuario logueado (la ruta garantiza que hay sesión). */
  private readonly usuario = this.sesion.usuario()!;
  protected readonly esMedico = this.usuario.rol === 'medico';
  protected readonly esOperador = this.usuario.rol === 'operador';

  /** Filtros: fecha (hoy por defecto) y sede (la del usuario, o todas para el médico). */
  protected readonly filtros = inject(FormBuilder).group({
    fecha: [new Date()],
    id_sede: [this.esMedico ? null : this.usuario.id_sede],
  });

  /** Fecha y sede filtradas como signals (los usa `rangos-agenda` del médico). */
  protected readonly fecha = signal(aFechaApi(new Date()));
  protected readonly idSede = signal<number | null>(this.filtros.controls.id_sede.value);

  protected readonly sedes = signal<Sede[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  /** El médico logueado con sus especialidades (solo en modo médico). */
  protected readonly yo = computed(() => this.medicos().find((m) => m.id === this.usuario.id) ?? null);

  protected readonly agendas = signal<Agenda[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly columnas = ['medico', 'especialidad', 'horarios', 'turnos', 'acciones'];
  protected readonly deFechaApi = deFechaApi;

  /**
   * Si el usuario puede modificar la sede filtrada: el admin siempre; el
   * operador solo si está mirando SU sede.
   */
  protected readonly puedeModificar = computed(
    () => !this.esOperador || this.idSede() === this.usuario.id_sede,
  );

  /** Nombre de la sede filtrada, para los textos de la pantalla. */
  protected readonly nombreSede = computed(
    () => this.sedes().find((s) => s.id === this.idSede())?.nombre ?? '',
  );

  /** Agendas agrupadas por médico: una fila por médico, como pide la consigna. */
  protected readonly filas = computed<FilaMedico[]>(() => {
    const porMedico = new Map<number, Agenda[]>();
    for (const rango of this.agendas()) {
      porMedico.set(rango.id_medico, [...(porMedico.get(rango.id_medico) ?? []), rango]);
    }
    return [...porMedico.entries()].map(([idMedico, rangos]) => ({
      idMedico,
      medico: rangos[0].medico,
      especialidades: [...new Set(rangos.map((r) => r.especialidad))].join(', '),
      horarios: rangos.map((r) => `${r.hora_entrada} a ${r.hora_salida}`).join(' · '),
      turnosConfirmados: rangos.reduce((suma, r) => suma + Number(r.turnos_confirmados), 0),
    }));
  });

  constructor() {
    // Al cambiar cualquiera de los filtros, la tabla se actualiza (consigna).
    this.filtros.valueChanges.pipe(takeUntilDestroyed()).subscribe(({ fecha, id_sede }) => {
      // Una fecha mal tipeada llega como fecha inválida: se ignora hasta corregirla.
      if (!fecha || Number.isNaN(fecha.getTime())) return;
      this.fecha.set(aFechaApi(fecha));
      this.idSede.set(id_sede ?? null);
      if (!this.esMedico) this.cargarAgendas();
    });
  }

  ngOnInit(): void {
    this.cargarListados();
  }

  /**
   * Trae sedes y médicos (para filtros, formulario y "Nueva agenda") y,
   * después, la agenda del día.
   */
  protected cargarListados(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      sedes: this.sedeService.listar(),
      medicos: this.medicoService.listar().pipe(catchError(() => of<Medico[]>([]))),
    }).subscribe({
      next: ({ sedes, medicos }) => {
        this.sedes.set(sedes);
        this.medicos.set(medicos);
        // El administrador no tiene sede: arranca mirando la primera.
        if (this.idSede() === null && !this.esMedico && sedes.length > 0) {
          this.filtros.controls.id_sede.setValue(sedes[0].id, { emitEvent: false });
          this.idSede.set(sedes[0].id);
        }
        if (this.esMedico) this.cargando.set(false);
        else this.cargarAgendas();
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** `GET /agendas?fecha=&id_sede=` (modo operador/administrador). */
  protected cargarAgendas(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.agendaService
      .listar({ fecha: this.fecha(), id_sede: this.idSede() ?? undefined })
      .subscribe({
        next: (agendas) => {
          this.agendas.set(agendas);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  /**
   * "Nueva agenda": formulario con selector de médico (de TODOS los médicos,
   * tengan o no agenda) y la sede fija en la del operador.
   */
  protected nuevaAgenda(): void {
    const datos: DatosDialogoRango = {
      rango: null,
      medico: null,
      medicos: this.medicos(),
      sedes: this.sedes(),
      idSedeFija: this.esOperador ? this.usuario.id_sede : null,
      idSedePorDefecto: this.idSede(),
      fecha: this.fecha(),
    };
    this.dialogo
      .open(DialogoRango, { data: datos, width: '520px' })
      .afterClosed()
      .subscribe((guardado?: Agenda) => {
        if (!guardado) return;
        this.avisos.open('Agenda cargada.', 'Cerrar', { duration: 3000 });
        this.cargarAgendas();
      });
  }

  /** Lápiz: editar los rangos del médico de esa fila. Al cerrar, recarga. */
  protected editarAgenda(fila: FilaMedico): void {
    const medico = this.medicos().find((m) => m.id === fila.idMedico);
    if (!medico) {
      this.avisos.open('No se pudieron cargar los datos del médico.', 'Cerrar', { duration: 5000 });
      return;
    }
    const datos: DatosDialogoAgendaMedico = {
      medico,
      fecha: this.fecha(),
      idSede: this.idSede()!,
      sedes: this.sedes(),
      idSedeFija: this.esOperador ? this.usuario.id_sede : null,
    };
    this.dialogo
      .open(DialogoAgendaMedico, { data: datos, width: '860px' })
      .afterClosed()
      // Se recarga siempre: el diálogo puede cerrarse con Escape o tocando
      // afuera aunque haya habido cambios.
      .subscribe(() => this.cargarAgendas());
  }

  /** Ojo: los turnos de ese médico en esa fecha, en "Turnos de la sede". */
  protected verTurnos(fila: FilaMedico): void {
    this.router.navigate(['/operador/turnos'], {
      queryParams: { fecha: this.fecha(), id_medico: fila.idMedico },
    });
  }
}
