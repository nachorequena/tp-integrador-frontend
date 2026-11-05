/**
 * SOLICITUD DE TURNO PASO A PASO (paciente y operador)
 * ===================================================
 *
 * Una sola pantalla para los dos roles que sacan turnos (no hay pantallas
 * duplicadas, como pide el criterio de aceptación):
 *
 *   - PACIENTE — "Solicitar turno" (`/paciente/solicitar-turno`): saca un turno
 *     para sí mismo.
 *   - OPERADOR — "Nuevo turno" (`/operador/nuevo-turno`): primero busca al
 *     paciente (`compartido/buscador-pacientes`) y después sigue el MISMO
 *     flujo, con la sede fija en la suya. Puede llegar con `?dni=` desde la
 *     pantalla de pacientes ("Asignar turno").
 *
 * Pasos (`mat-stepper` lineal): especialidad → sede → médico → fecha →
 * horario → nota (obligatoria) y confirmación. Cada paso filtra el siguiente:
 *   - médicos: solo los de la especialidad y sede elegidas (`GET /medicos`);
 *   - fechas: solo las que el médico tiene agenda con lugar
 *     (`GET /disponibilidad/fechas`);
 *   - horarios: solo los libres de ese día (`GET /disponibilidad/horarios`).
 * Cambiar una elección borra las que dependen de ella.
 *
 * Antes de confirmar se muestra un resumen con especialidad, médico, sede,
 * fecha, hora y cobertura. La cobertura NO se elige: es la registrada por el
 * paciente (el backend la toma de ahí).
 *
 * Si el backend rechaza el turno (por ejemplo, el horario se ocupó mientras
 * tanto, 409), se muestra el mensaje, se recargan los horarios y se vuelve al
 * paso de horario para elegir otro.
 */

import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { BuscadorPacientes } from '../../compartido/buscador-pacientes/buscador-pacientes';
import { Cobertura } from '../../core/modelos/cobertura';
import { Especialidad } from '../../core/modelos/especialidad';
import { Medico } from '../../core/modelos/medico';
import { PacienteEncontrado } from '../../core/modelos/paciente';
import { Sede } from '../../core/modelos/sede';
import { HorarioLibre } from '../../core/modelos/turno';
import { CoberturaService } from '../../core/servicios/cobertura.service';
import { EspecialidadService } from '../../core/servicios/especialidad.service';
import { MedicoService } from '../../core/servicios/medico.service';
import { NotificacionService } from '../../core/servicios/notificacion.service';
import { SedeService } from '../../core/servicios/sede.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { TurnoService } from '../../core/servicios/turno.service';
import { aDate } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { textoNoVacio } from '../../core/utilidades/validadores';

/** Índice del paso "horario" (para volver ahí si el turno se ocupó). */
const PASO_HORARIO_PACIENTE = 4;

@Component({
  selector: 'app-nuevo-turno',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatStepperModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    BuscadorPacientes,
  ],
  templateUrl: './nuevo-turno.html',
  styleUrl: './nuevo-turno.scss',
})
export class NuevoTurno implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly especialidadService = inject(EspecialidadService);
  private readonly sedeService = inject(SedeService);
  private readonly medicoService = inject(MedicoService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly sesion = inject(SesionService);
  private readonly avisos = inject(MatSnackBar);
  private readonly router = inject(Router);

  /** `?dni=` de la URL: lo manda "Asignar turno" desde la pantalla de pacientes. */
  readonly dni = input<string | undefined>(undefined);

  private readonly usuario = this.sesion.usuario()!;
  protected readonly esOperador = this.usuario.rol === 'operador';

  private readonly stepper = viewChild.required(MatStepper);

  // ── Un control por paso: el stepper lineal no deja avanzar si es inválido ──
  private readonly fb = inject(FormBuilder);
  /** Paso 0 del operador: el paciente elegido (su id). */
  protected readonly pasoPaciente = new FormControl<number | null>(null, Validators.required);
  protected readonly pasoEspecialidad = this.fb.group({
    id_especialidad: [null as number | null, Validators.required],
  });
  protected readonly pasoSede = this.fb.group({
    // El operador saca turnos solo en su sede: queda fija y deshabilitada.
    id_sede: [
      { value: this.esOperador ? this.usuario.id_sede : (null as number | null), disabled: this.esOperador },
      Validators.required,
    ],
  });
  protected readonly pasoMedico = this.fb.group({
    id_medico: [null as number | null, Validators.required],
  });
  protected readonly pasoFecha = this.fb.group({ fecha: ['', Validators.required] });
  protected readonly pasoHorario = this.fb.group({ hora: ['', Validators.required] });
  protected readonly pasoNota = this.fb.nonNullable.group({
    // varchar(40) en la tabla `turno`; la consigna la pide obligatoria.
    nota: ['', [Validators.required, textoNoVacio, Validators.maxLength(40)]],
  });

  // ── Opciones de cada paso (todas vienen de la API) ──
  protected readonly especialidades = signal<Especialidad[]>([]);
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly fechas = signal<string[]>([]);
  protected readonly horarios = signal<HorarioLibre[]>([]);
  private readonly coberturas = signal<Cobertura[]>([]);

  protected readonly paciente = signal<PacienteEncontrado | null>(null);
  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  // ── Resumen ──
  /** Valores elegidos como signals, para armar el resumen. */
  private readonly elegidos = signal({
    id_especialidad: null as number | null,
    id_sede: null as number | null,
    id_medico: null as number | null,
    fecha: '',
    hora: '',
  });

  protected readonly resumen = computed(() => {
    const e = this.elegidos();
    const medico = this.medicos().find((m) => m.id === e.id_medico);
    return {
      especialidad: this.especialidades().find((x) => x.id === e.id_especialidad)?.descripcion ?? '',
      sede: this.sedes().find((x) => x.id === e.id_sede)?.nombre ?? '',
      medico: medico ? `${medico.apellido}, ${medico.nombre}` : '',
      fecha: e.fecha ? aDate(e.fecha) : null,
      hora: e.hora,
      cobertura: this.coberturaDelPaciente(),
    };
  });

  /** Cobertura registrada del paciente (nunca se elige en este flujo). */
  private coberturaDelPaciente(): string {
    if (this.esOperador) return this.paciente()?.cobertura ?? 'Sin cobertura registrada';
    const id = this.usuario.id_cobertura;
    return this.coberturas().find((c) => c.id === id)?.nombre ?? 'Sin cobertura registrada';
  }

  protected readonly aDate = aDate;

  constructor() {
    this.encadenarPasos();
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  /** Especialidades, sedes y coberturas para los primeros pasos y el resumen. */
  protected cargarCatalogos(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      especialidades: this.especialidadService.listar(),
      sedes: this.sedeService.listar(),
      coberturas: this.coberturaService.listarDisponibles().pipe(catchError(() => of<Cobertura[]>([]))),
    }).subscribe({
      next: ({ especialidades, sedes, coberturas }) => {
        this.especialidades.set(especialidades);
        this.sedes.set(sedes);
        this.coberturas.set(coberturas);
        this.cargando.set(false);
        this.actualizarElegidos();
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /**
   * Conecta los pasos: cuando cambia una elección se borran las que dependen
   * de ella y se piden las opciones nuevas del paso siguiente.
   */
  private encadenarPasos(): void {
    const especialidad = this.pasoEspecialidad.controls.id_especialidad;
    const sede = this.pasoSede.controls.id_sede;
    const medico = this.pasoMedico.controls.id_medico;
    const fecha = this.pasoFecha.controls.fecha;
    const hora = this.pasoHorario.controls.hora;

    // Especialidad o sede → nueva lista de médicos.
    for (const control of [especialidad, sede]) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        medico.reset();
        this.medicos.set([]);
        this.cargarMedicos();
      });
    }
    // Médico → nuevas fechas.
    medico.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      fecha.reset('');
      this.fechas.set([]);
      this.cargarFechas();
    });
    // Fecha → nuevos horarios.
    fecha.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      hora.reset('');
      this.horarios.set([]);
      this.cargarHorarios();
    });
    hora.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.actualizarElegidos());
  }

  /** Copia los valores elegidos al signal del resumen. */
  private actualizarElegidos(): void {
    this.elegidos.set({
      id_especialidad: this.pasoEspecialidad.controls.id_especialidad.value,
      id_sede: this.pasoSede.getRawValue().id_sede,
      id_medico: this.pasoMedico.controls.id_medico.value,
      fecha: this.pasoFecha.controls.fecha.value ?? '',
      hora: this.pasoHorario.controls.hora.value ?? '',
    });
  }

  /** Datos de la consulta de disponibilidad, o `null` si falta alguno. */
  private consulta(): { id_medico: number; id_especialidad: number; id_sede: number } | null {
    const id_especialidad = this.pasoEspecialidad.controls.id_especialidad.value;
    const id_sede = this.pasoSede.getRawValue().id_sede;
    const id_medico = this.pasoMedico.controls.id_medico.value;
    if (!id_especialidad || !id_sede || !id_medico) return null;
    return { id_medico, id_especialidad, id_sede };
  }

  /** `GET /medicos?id_especialidad=&id_sede=`. */
  private cargarMedicos(): void {
    this.actualizarElegidos();
    const id_especialidad = this.pasoEspecialidad.controls.id_especialidad.value;
    const id_sede = this.pasoSede.getRawValue().id_sede;
    if (!id_especialidad || !id_sede) return;
    this.pedir(this.medicoService.listar({ id_especialidad, id_sede }), (medicos) =>
      this.medicos.set(medicos),
    );
  }

  /** `GET /disponibilidad/fechas`. */
  private cargarFechas(): void {
    this.actualizarElegidos();
    const consulta = this.consulta();
    if (!consulta) return;
    this.pedir(this.turnoService.fechasLibres(consulta), (fechas) => this.fechas.set(fechas));
  }

  /** `GET /disponibilidad/horarios`. */
  private cargarHorarios(): void {
    this.actualizarElegidos();
    const consulta = this.consulta();
    const fecha = this.pasoFecha.controls.fecha.value;
    if (!consulta || !fecha) return;
    this.pedir(this.turnoService.horariosLibres(consulta, fecha), (horarios) =>
      this.horarios.set(horarios),
    );
  }

  /**
   * Hace un pedido de opciones con indicador de carga y manejo de error
   * comunes a todos los pasos.
   */
  private pedir<T>(pedido: Observable<T>, alLlegar: (datos: T) => void): void {
    this.cargando.set(true);
    this.error.set(null);
    pedido.subscribe({
      next: (datos) => {
        alLlegar(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Operador: el buscador eligió un paciente. */
  protected elegirPaciente(paciente: PacienteEncontrado): void {
    this.paciente.set(paciente);
    this.pasoPaciente.setValue(paciente.id);
    this.actualizarElegidos();
  }

  /** Confirma el turno (`POST /turnos`). */
  protected confirmar(): void {
    if (this.pasoNota.invalid) {
      this.pasoNota.markAllAsTouched();
      return;
    }
    const consulta = this.consulta();
    if (!consulta) return;

    this.enviando.set(true);
    this.error.set(null);
    this.turnoService
      .crear({
        ...consulta,
        fecha: this.pasoFecha.controls.fecha.value!,
        hora: this.pasoHorario.controls.hora.value!,
        nota: this.pasoNota.controls.nota.value.trim(),
        // Solo el operador manda el paciente; el paciente sale del token.
        id_paciente: this.esOperador ? this.paciente()!.id : undefined,
      })
      .subscribe({
        next: (turno) => {
          this.avisos.open('¡Turno confirmado!', 'Cerrar', { duration: 4000 });
          // El backend acaba de generar una notificación: el contador se
          // actualiza sin recargar la página.
          this.notificaciones.cargar();
          if (this.esOperador) {
            this.router.navigate(['/operador/turnos'], { queryParams: { fecha: turno.fecha } });
          } else {
            this.router.navigate(['/paciente/mis-turnos']);
          }
        },
        error: (error: unknown) => {
          // El horario se ocupó mientras tanto (u otro rechazo): se muestra
          // el mensaje, se recargan los horarios y se vuelve a ese paso.
          this.enviando.set(false);
          this.pasoHorario.controls.hora.reset('');
          this.cargarHorarios();
          // Después de pedir los horarios: `pedir()` limpia el error al
          // arrancar, y este mensaje tiene que quedar visible.
          this.error.set(mensajeDeError(error));
          this.stepper().selectedIndex = PASO_HORARIO_PACIENTE + (this.esOperador ? 1 : 0);
        },
      });
  }
}
