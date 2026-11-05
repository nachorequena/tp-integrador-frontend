/**
 * DIÁLOGO DE ALTA / MODIFICACIÓN DE UN RANGO HORARIO DE AGENDA
 * ============================================================
 *
 * Formulario de un rango de agenda: fecha, hora de entrada, hora de salida,
 * especialidad y sede. Lo abren:
 *   - `compartido/rangos-agenda` (agregar o modificar un rango de un médico
 *     ya elegido: la agenda del médico y el lápiz del operador);
 *   - `paginas/agendas` en modo operador/administrador ("Nueva agenda"): ahí
 *     además se elige el MÉDICO de un listado, aunque todavía no tenga agenda.
 *
 * Reglas de la consigna que aplica:
 *   - la especialidad se elige entre las del propio médico;
 *   - la sede se elige de un listado, con la sede del médico preseleccionada
 *     (puede atender en más de una). Para el operador la sede queda FIJA en la
 *     suya: solo puede cargar agenda en su sede;
 *   - valida que la salida sea posterior a la entrada ANTES de enviar
 *     (validador de grupo `salidaPosteriorAEntrada`).
 *
 * Las horas se eligen de un selector cada 30 minutos (`HORAS_DE_LA_GRILLA`),
 * que es la duración de los turnos del backend.
 *
 * Guarda él mismo con `AgendaService`: si el backend rechaza (superposición,
 * turnos confirmados que quedarían afuera, otra sede), el mensaje se ve acá.
 * Se cierra devolviendo el rango guardado.
 */

import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Agenda } from '../../core/modelos/agenda';
import { Especialidad } from '../../core/modelos/especialidad';
import { Medico } from '../../core/modelos/medico';
import { Sede } from '../../core/modelos/sede';
import { AgendaService } from '../../core/servicios/agenda.service';
import { aDate, aFechaApi } from '../../core/utilidades/adaptador-fecha';
import { HORAS_DE_LA_GRILLA } from '../../core/utilidades/horarios';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../core/utilidades/textos-datepicker';
import { salidaPosteriorAEntrada } from '../../core/utilidades/validadores';

/** Configuración del diálogo. */
export interface DatosDialogoRango {
  /** Rango a modificar, o `null` para un alta. */
  rango: Agenda | null;
  /**
   * Médico dueño del rango. Si es `null`, el diálogo muestra un selector de
   * médico con la lista `medicos` ("Nueva agenda" del operador).
   */
  medico: Medico | null;
  /** Médicos para elegir (solo cuando `medico` es `null`). */
  medicos?: Medico[];
  /** Sedes para el selector. */
  sedes: Sede[];
  /** Si tiene valor, la sede queda fija (operador: solo su sede). */
  idSedeFija: number | null;
  /** Sede preseleccionada en un alta (la del médico o la filtrada). */
  idSedePorDefecto: number | null;
  /** Fecha preseleccionada en un alta, `YYYY-MM-DD`. */
  fecha: string;
}

@Component({
  selector: 'app-dialogo-rango',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './dialogo-rango.html',
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class DialogoRango {
  private readonly agendaService = inject(AgendaService);
  private readonly referencia = inject(MatDialogRef<DialogoRango, Agenda>);
  protected readonly datos = inject<DatosDialogoRango>(MAT_DIALOG_DATA);

  protected readonly horas = HORAS_DE_LA_GRILLA;

  /** `true` si hay que elegir el médico en el formulario. */
  protected readonly eligeMedico = this.datos.medico === null;

  protected readonly formulario = inject(FormBuilder).group(
    {
      id_medico: [
        this.datos.medico?.id ?? (null as number | null),
        Validators.required,
      ],
      fecha: [aDate(this.datos.rango?.fecha ?? this.datos.fecha), Validators.required],
      hora_entrada: [this.datos.rango?.hora_entrada ?? '', Validators.required],
      hora_salida: [this.datos.rango?.hora_salida ?? '', Validators.required],
      id_especialidad: [
        this.datos.rango?.id_especialidad ?? (null as number | null),
        Validators.required,
      ],
      id_sede: [
        {
          value: this.datos.rango?.id_sede ?? this.datos.idSedeFija ?? this.datos.idSedePorDefecto,
          // Operador: la sede no se puede cambiar.
          disabled: this.datos.idSedeFija !== null,
        },
        Validators.required,
      ],
    },
    { validators: salidaPosteriorAEntrada },
  );

  /** Médico elegido (el fijo o el del selector). */
  private readonly idMedicoElegido = toSignal(this.formulario.controls.id_medico.valueChanges, {
    initialValue: this.formulario.controls.id_medico.value,
  });

  /** Especialidades del médico elegido: solo esas se pueden elegir. */
  protected readonly especialidades = computed<Especialidad[]>(() => {
    if (this.datos.medico) return this.datos.medico.especialidades;
    const medico = this.datos.medicos?.find((m) => m.id === this.idMedicoElegido());
    return medico?.especialidades ?? [];
  });

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Si el médico tiene una sola especialidad, se preselecciona.
    this.preseleccionarEspecialidad();
    // Al cambiar de médico se reinicia la especialidad (la anterior puede no
    // ser suya) y, si no hay sede fija, se propone la sede del médico.
    this.formulario.controls.id_medico.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      this.formulario.controls.id_especialidad.setValue(null);
      const medico = this.datos.medicos?.find((m) => m.id === id);
      if (this.datos.idSedeFija === null && medico?.id_sede) {
        this.formulario.controls.id_sede.setValue(medico.id_sede);
      }
      this.preseleccionarEspecialidad();
    });
  }

  /** Elige la especialidad automáticamente cuando hay una sola opción. */
  private preseleccionarEspecialidad(): void {
    const opciones = this.especialidades();
    if (opciones.length === 1 && !this.formulario.controls.id_especialidad.value) {
      this.formulario.controls.id_especialidad.setValue(opciones[0].id);
    }
  }

  /** Valida (incluida salida > entrada), guarda y cierra con el rango guardado. */
  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    // getRawValue incluye la sede aunque esté deshabilitada (operador).
    const valores = this.formulario.getRawValue();
    const cuerpo = {
      id_medico: valores.id_medico!,
      fecha: aFechaApi(valores.fecha!),
      hora_entrada: valores.hora_entrada!,
      hora_salida: valores.hora_salida!,
      id_especialidad: valores.id_especialidad!,
      id_sede: valores.id_sede!,
    };

    this.guardando.set(true);
    this.error.set(null);
    const pedido = this.datos.rango
      ? this.agendaService.actualizar(this.datos.rango.id, cuerpo)
      : this.agendaService.crear(cuerpo);

    pedido.subscribe({
      next: (rango) => this.referencia.close(rango),
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.guardando.set(false);
      },
    });
  }
}
