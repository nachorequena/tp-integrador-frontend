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
 *
 * Con qué se conecta:
 *   - La abre el router: opción "Solicitar turno" / "Nuevo turno" de
 *     `MENU_POR_ROL` (`core/navegacion/menu.ts`) → `app.routes.ts`.
 *   - Su HTML es `nuevo-turno.html` (el stepper y los botones).
 *   - Pide datos a: `EspecialidadService`, `SedeService`, `CoberturaService`,
 *     `MedicoService` y `TurnoService` (`core/servicios/`).
 *   - Al confirmar avisa a `NotificacionService` (campana del encabezado).
 *
 * ── GUÍA RÁPIDA DE LOS CONCEPTOS DE ANGULAR QUE APARECEN ACÁ ────────────────
 *
 *   @Component        "Decorador": le dice a Angular que esta clase es una
 *                     pantalla, cuál es su HTML y qué otros componentes usa.
 *   inject(X)         Pide a Angular una instancia de X (un servicio). Angular
 *                     crea una sola y la comparte en toda la app.
 *   signal(valor)     Una "caja" con un valor. Se lee llamándola: `cargando()`.
 *                     Se cambia con `.set(nuevo)`. Cuando cambia, el HTML que
 *                     la usa se vuelve a dibujar solo.
 *   computed(() => …) Un valor calculado a partir de otras signals. Se
 *                     recalcula solo cuando cambia alguna de las que usa.
 *   FormGroup /       Formularios "reactivos": el formulario es un objeto en el
 *   FormControl       código (no solo HTML). Cada campo tiene su valor, sus
 *                     validadores y su estado (`valid`, `invalid`, `touched`).
 *   Validators.X      Reglas de validación de Angular (required, maxLength…).
 *   Observable        Una respuesta que llega "más tarde" (por ejemplo, un
 *                     pedido HTTP). No hace nada hasta que alguien llama a
 *                     `.subscribe({ next, error })`:
 *                       - `next`  se ejecuta cuando llega la respuesta OK;
 *                       - `error` se ejecuta si el pedido falla (400, 409,
 *                         backend apagado…). Cumple el rol de un `catch`.
 *   .pipe(…)          Encadena transformaciones sobre un Observable antes de
 *                     suscribirse (por ejemplo `catchError`).
 *   valueChanges      Observable que emite cada vez que el usuario cambia el
 *                     valor de un campo del formulario.
 *   takeUntilDestroyed() Corta esa suscripción cuando se sale de la pantalla,
 *                     para no dejar escuchas "colgadas" en memoria.
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

/**
 * Índice del paso "horario" para el paciente (los pasos se cuentan desde 0:
 * 0 especialidad, 1 sede, 2 médico, 3 fecha, 4 horario, 5 nota). El operador
 * tiene un paso más al principio (paciente), así que para él es 5.
 * Se usa para volver a ese paso si el horario se ocupó mientras tanto.
 */
const PASO_HORARIO_PACIENTE = 4;

@Component({
  // Nombre de la etiqueta HTML del componente (no se usa a mano: lo abre el router).
  selector: 'app-nuevo-turno',
  // Todo lo que usa el HTML tiene que estar importado acá: formularios
  // reactivos, el pipe de fechas, los componentes de Angular Material y el
  // buscador de pacientes (componente propio de `compartido/`).
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
  // ── Servicios que usa la pantalla (Angular los entrega con inject) ──
  // Cada servicio sabe hablar con una parte de la API (ver core/servicios/).
  private readonly turnoService = inject(TurnoService); // disponibilidad y alta del turno
  private readonly especialidadService = inject(EspecialidadService); // GET /especialidades
  private readonly sedeService = inject(SedeService); // GET /sedes
  private readonly medicoService = inject(MedicoService); // GET /medicos
  private readonly coberturaService = inject(CoberturaService); // GET /coberturas/disponibles
  private readonly notificaciones = inject(NotificacionService); // contador de la campana
  private readonly sesion = inject(SesionService); // quién está logueado
  private readonly avisos = inject(MatSnackBar); // cartelito de aviso abajo de la pantalla
  private readonly router = inject(Router); // para navegar a otra pantalla por código

  /**
   * `?dni=` de la URL: lo manda "Asignar turno" desde la pantalla de
   * pacientes. Angular lo carga solo en este `input` gracias a
   * `withComponentInputBinding()` (ver `app.config.ts`).
   */
  readonly dni = input<string | undefined>(undefined);

  // Usuario logueado. El `!` le dice a TypeScript "acá seguro hay un usuario":
  // es cierto porque los guards de la ruta no dejan entrar sin sesión.
  private readonly usuario = this.sesion.usuario()!;
  // `true` si quien usa la pantalla es operador (cambia algunos pasos).
  protected readonly esOperador = this.usuario.rol === 'operador';

  // Referencia al stepper del HTML, para poder mover el paso activo desde el
  // código (se usa cuando el turno se rechaza y hay que volver a "Horario").
  private readonly stepper = viewChild.required(MatStepper);

  // ── Un formulario por paso ──────────────────────────────────────────────
  // El stepper es "lineal": cada <mat-step> está atado a uno de estos
  // formularios con [stepControl] y NO deja pasar al siguiente mientras el
  // formulario del paso sea inválido (por ejemplo, si no se eligió nada).
  private readonly fb = inject(FormBuilder); // ayudante para crear formularios

  /** Paso 0 del operador: el paciente elegido (su id). Obligatorio. */
  protected readonly pasoPaciente = new FormControl<number | null>(null, Validators.required);

  /** Paso "Especialidad": un solo campo, obligatorio. Empieza vacío (null). */
  protected readonly pasoEspecialidad = this.fb.group({
    id_especialidad: [null as number | null, Validators.required],
  });

  /** Paso "Sede". */
  protected readonly pasoSede = this.fb.group({
    // Si es operador: el valor inicial es SU sede y el campo queda
    // deshabilitado (no la puede cambiar: solo saca turnos en su sede).
    // Si es paciente: empieza vacío y lo elige él.
    id_sede: [
      { value: this.esOperador ? this.usuario.id_sede : (null as number | null), disabled: this.esOperador },
      Validators.required,
    ],
  });

  /** Paso "Médico": obligatorio. */
  protected readonly pasoMedico = this.fb.group({
    id_medico: [null as number | null, Validators.required],
  });

  /** Paso "Fecha": guarda la fecha elegida como texto `YYYY-MM-DD`. */
  protected readonly pasoFecha = this.fb.group({ fecha: ['', Validators.required] });

  /** Paso "Horario": guarda la hora elegida como texto `HH:MM`. */
  protected readonly pasoHorario = this.fb.group({ hora: ['', Validators.required] });

  /** Último paso: la nota para el médico. */
  protected readonly pasoNota = this.fb.nonNullable.group({
    // Tres validaciones, cada una con su mensaje en el HTML:
    //   - required: no puede estar vacía (la consigna la pide obligatoria);
    //   - textoNoVacio: tampoco puede ser solo espacios (validador propio,
    //     core/utilidades/validadores.ts);
    //   - maxLength(40): la columna `turno.nota` es varchar(40).
    nota: ['', [Validators.required, textoNoVacio, Validators.maxLength(40)]],
  });

  // ── Opciones de cada paso (todas vienen de la API, nada escrito a mano) ──
  // Son signals: cuando se llenan con `.set(...)`, el HTML se redibuja solo.
  protected readonly especialidades = signal<Especialidad[]>([]);
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly fechas = signal<string[]>([]);
  protected readonly horarios = signal<HorarioLibre[]>([]);
  private readonly coberturas = signal<Cobertura[]>([]);

  // ── Estado de la pantalla ──
  /** Paciente elegido por el operador (el paciente logueado no lo usa). */
  protected readonly paciente = signal<PacienteEncontrado | null>(null);
  /** `true` mientras se espera una respuesta: muestra la barra de carga. */
  protected readonly cargando = signal(false);
  /** `true` mientras se envía el turno: deshabilita el botón "Confirmar". */
  protected readonly enviando = signal(false);
  /** Mensaje de error a mostrar arriba (o `null` si no hay error). */
  protected readonly error = signal<string | null>(null);

  // ── Resumen ──
  /**
   * Copia de los valores elegidos en forma de signal. Hace falta porque los
   * valores de los formularios NO son signals, y el `computed` de abajo solo
   * se recalcula cuando cambia una signal.
   */
  private readonly elegidos = signal({
    id_especialidad: null as number | null,
    id_sede: null as number | null,
    id_medico: null as number | null,
    fecha: '',
    hora: '',
  });

  /**
   * Datos del resumen que se muestra antes de confirmar (lo usa el HTML como
   * `resumen().medico`, `resumen().sede`, etc.).
   *
   * Los formularios guardan IDS (id_medico = 3); el resumen tiene que mostrar
   * NOMBRES ("Lopez, Ana"). Por eso busca cada id en las listas que trajo la
   * API con `.find(...)`. El `?.` y el `?? ''` evitan un error si todavía no
   * hay nada elegido: en ese caso muestran texto vacío.
   */
  protected readonly resumen = computed(() => {
    const e = this.elegidos();
    const medico = this.medicos().find((m) => m.id === e.id_medico);
    return {
      especialidad: this.especialidades().find((x) => x.id === e.id_especialidad)?.descripcion ?? '',
      sede: this.sedes().find((x) => x.id === e.id_sede)?.nombre ?? '',
      // Si hay médico elegido, "Apellido, Nombre"; si no, vacío.
      medico: medico ? `${medico.apellido}, ${medico.nombre}` : '',
      // La fecha se pasa a Date para que el HTML la muestre con el pipe
      // `date` ("viernes, 6 de noviembre de 2026"). Sin fecha: null.
      fecha: e.fecha ? aDate(e.fecha) : null,
      hora: e.hora,
      cobertura: this.coberturaDelPaciente(),
    };
  });

  /**
   * Cobertura registrada del paciente (nunca se elige en este flujo: la
   * consigna dice que es la que tiene registrada).
   *
   * @returns El nombre de la cobertura, o un texto si no tiene.
   */
  private coberturaDelPaciente(): string {
    // Operador: la cobertura viene con el paciente que eligió en el buscador.
    if (this.esOperador) return this.paciente()?.cobertura ?? 'Sin cobertura registrada';
    // Paciente: el usuario logueado tiene `id_cobertura`; se busca su nombre
    // en la lista de coberturas que se pidió a la API.
    const id = this.usuario.id_cobertura;
    return this.coberturas().find((c) => c.id === id)?.nombre ?? 'Sin cobertura registrada';
  }

  /** Se expone al HTML para convertir "2026-11-06" en una fecha mostrable. */
  protected readonly aDate = aDate;

  /**
   * El constructor corre UNA vez, al crear la pantalla. Acá se conectan los
   * pasos entre sí (ver `encadenarPasos`). Tiene que ir en el constructor
   * porque `takeUntilDestroyed()` solo se puede usar en ese momento.
   */
  constructor() {
    this.encadenarPasos();
  }

  /**
   * `ngOnInit` es un "hook" de Angular: se ejecuta solo, una vez, apenas la
   * pantalla está lista (después del constructor). Acá se piden los datos
   * iniciales a la API.
   */
  ngOnInit(): void {
    this.cargarCatalogos();
  }

  /**
   * Pide a la API las listas de los primeros pasos y del resumen:
   * especialidades, sedes y coberturas.
   *
   * Se piden LAS TRES A LA VEZ con `forkJoin`, que espera a que lleguen todas
   * y entrega un solo resultado `{ especialidades, sedes, coberturas }`. Si
   * cualquiera falla, entra por `error` (y no se muestra una pantalla a medias).
   *
   * Es `protected` porque el HTML también la llama (botón "Reintentar").
   */
  protected cargarCatalogos(): void {
    this.cargando.set(true); // prende la barra de carga
    this.error.set(null); // borra un error anterior, si lo había
    forkJoin({
      especialidades: this.especialidadService.listar(), // GET /especialidades
      sedes: this.sedeService.listar(), // GET /sedes
      // Las coberturas solo se usan para mostrar el nombre en el resumen. Si
      // ese pedido falla, `catchError` lo reemplaza por una lista vacía
      // (`of([])`): así un problema menor no tira abajo toda la pantalla.
      coberturas: this.coberturaService.listarDisponibles().pipe(catchError(() => of<Cobertura[]>([]))),
    }).subscribe({
      // Llegaron las tres listas: se guardan en sus signals (y el HTML las
      // muestra en los <mat-select>), y se apaga la barra de carga.
      next: ({ especialidades, sedes, coberturas }) => {
        this.especialidades.set(especialidades);
        this.sedes.set(sedes);
        this.coberturas.set(coberturas);
        this.cargando.set(false);
        this.actualizarElegidos();
      },
      // Falló especialidades o sedes (por ejemplo, el backend está apagado):
      // `mensajeDeError` lo traduce a un texto entendible y se muestra arriba.
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /**
   * Conecta los pasos entre sí: cuando cambia una elección, se BORRAN las que
   * dependen de ella y se piden a la API las opciones nuevas del paso siguiente.
   *
   * Ejemplo: si el paciente ya había elegido médico y fecha, y vuelve atrás a
   * cambiar la especialidad, el médico y la fecha anteriores ya no sirven
   * (pueden no ser de esa especialidad), así que se borran.
   *
   * Cadena:  especialidad / sede → médicos → fechas → horarios
   */
  private encadenarPasos(): void {
    // Atajos a cada campo, para no escribir el camino completo cada vez.
    const especialidad = this.pasoEspecialidad.controls.id_especialidad;
    const sede = this.pasoSede.controls.id_sede;
    const medico = this.pasoMedico.controls.id_medico;
    const fecha = this.pasoFecha.controls.fecha;
    const hora = this.pasoHorario.controls.hora;

    // 1) Cuando cambia la especialidad O la sede (el `for` hace lo mismo para
    //    los dos campos): se borra el médico elegido, se vacía la lista de
    //    médicos y se pide la lista nueva filtrada por especialidad y sede.
    for (const control of [especialidad, sede]) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        medico.reset(); // borra el médico elegido (y eso dispara el paso 2 de abajo)
        this.medicos.set([]);
        this.cargarMedicos();
      });
    }

    // 2) Cuando cambia el médico: se borra la fecha y se piden las fechas
    //    en que ESE médico tiene agenda con lugar.
    medico.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      fecha.reset('');
      this.fechas.set([]);
      this.cargarFechas();
    });

    // 3) Cuando cambia la fecha: se borra la hora y se piden los horarios
    //    libres de ESE día.
    fecha.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      hora.reset('');
      this.horarios.set([]);
      this.cargarHorarios();
    });

    // 4) Cuando cambia la hora no hay nada que pedir: solo se actualiza el
    //    resumen para que muestre la hora elegida.
    hora.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.actualizarElegidos());
  }

  /**
   * Copia los valores actuales de los formularios a la signal `elegidos`,
   * para que el `computed` del resumen se recalcule.
   *
   * Se usa `getRawValue()` en la sede porque el campo puede estar deshabilitado
   * (operador), y `.value` de un formulario NO incluye los campos
   * deshabilitados; `getRawValue()` sí.
   */
  private actualizarElegidos(): void {
    this.elegidos.set({
      id_especialidad: this.pasoEspecialidad.controls.id_especialidad.value,
      id_sede: this.pasoSede.getRawValue().id_sede,
      id_medico: this.pasoMedico.controls.id_medico.value,
      // `?? ''`: si el valor es null (campo recién borrado), usa texto vacío.
      fecha: this.pasoFecha.controls.fecha.value ?? '',
      hora: this.pasoHorario.controls.hora.value ?? '',
    });
  }

  /**
   * Arma los tres datos que necesita la API de disponibilidad: médico,
   * especialidad y sede.
   *
   * @returns Los tres ids, o `null` si falta alguno.
   */
  private consulta(): { id_medico: number; id_especialidad: number; id_sede: number } | null {
    const id_especialidad = this.pasoEspecialidad.controls.id_especialidad.value;
    const id_sede = this.pasoSede.getRawValue().id_sede;
    const id_medico = this.pasoMedico.controls.id_medico.value;
    // Si falta cualquiera de los tres (todavía no se eligió, o se acaba de
    // borrar), no tiene sentido preguntarle nada a la API: se devuelve null y
    // quien llama no hace el pedido.
    if (!id_especialidad || !id_sede || !id_medico) return null;
    return { id_medico, id_especialidad, id_sede };
  }

  /**
   * Pide los médicos de la especialidad y sede elegidas:
   * `GET /medicos?id_especialidad=&id_sede=` (vía `MedicoService.listar`).
   */
  private cargarMedicos(): void {
    this.actualizarElegidos();
    const id_especialidad = this.pasoEspecialidad.controls.id_especialidad.value;
    const id_sede = this.pasoSede.getRawValue().id_sede;
    // Hacen falta las dos elecciones: si falta alguna, no se pide nada todavía.
    if (!id_especialidad || !id_sede) return;
    // Cuando llega la lista, se guarda en la signal `medicos` y el
    // <mat-select> del paso "Médico" la muestra.
    this.pedir(this.medicoService.listar({ id_especialidad, id_sede }), (medicos) =>
      this.medicos.set(medicos),
    );
  }

  /**
   * Pide las fechas con agenda y lugar libre del médico elegido:
   * `GET /disponibilidad/fechas` (vía `TurnoService.fechasLibres`).
   */
  private cargarFechas(): void {
    this.actualizarElegidos();
    const consulta = this.consulta();
    // Sin médico, especialidad y sede no hay a quién preguntarle.
    if (!consulta) return;
    // Las fechas llegan como textos "YYYY-MM-DD" y se muestran como chips.
    this.pedir(this.turnoService.fechasLibres(consulta), (fechas) => this.fechas.set(fechas));
  }

  /**
   * Pide los horarios libres del día elegido:
   * `GET /disponibilidad/horarios` (vía `TurnoService.horariosLibres`).
   */
  private cargarHorarios(): void {
    this.actualizarElegidos();
    const consulta = this.consulta();
    const fecha = this.pasoFecha.controls.fecha.value;
    // Hace falta la consulta Y una fecha elegida.
    if (!consulta || !fecha) return;
    this.pedir(this.turnoService.horariosLibres(consulta, fecha), (horarios) =>
      this.horarios.set(horarios),
    );
  }

  /**
   * Ayudante que comparten `cargarMedicos`, `cargarFechas` y
   * `cargarHorarios`: hace el pedido, maneja la barra de carga y el error.
   * Existe para no repetir el mismo `subscribe` tres veces.
   *
   * Es genérica (`<T>`): sirve para cualquier tipo de respuesta (lista de
   * médicos, de fechas o de horarios).
   *
   * @param pedido El pedido a la API (todavía no enviado: se envía al suscribirse).
   * @param alLlegar Qué hacer con los datos cuando llegan bien.
   */
  private pedir<T>(pedido: Observable<T>, alLlegar: (datos: T) => void): void {
    this.cargando.set(true);
    this.error.set(null);
    pedido.subscribe({
      // Respuesta OK: se le pasan los datos a quien llamó (que los guarda en
      // su signal) y se apaga la barra de carga.
      next: (datos) => {
        alLlegar(datos);
        this.cargando.set(false);
      },
      // Respuesta con error (o backend apagado): se muestra el mensaje.
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /**
   * Solo operador: el buscador de pacientes avisó (con su evento `elegido`)
   * qué paciente se eligió. Se guarda y se completa el paso 0, lo que
   * habilita el botón "Siguiente".
   *
   * @param paciente El paciente elegido en `<app-buscador-pacientes>`.
   */
  protected elegirPaciente(paciente: PacienteEncontrado): void {
    this.paciente.set(paciente);
    this.pasoPaciente.setValue(paciente.id);
    this.actualizarElegidos();
  }

  /**
   * BOTÓN "CONFIRMAR TURNO": envía el turno al backend (`POST /turnos`).
   *
   * Lo dispara el `(ngSubmit)="confirmar()"` del último paso en
   * `nuevo-turno.html`.
   */
  protected confirmar(): void {
    // VALIDACIÓN 1: si la nota es inválida (vacía, solo espacios o más de
    // 40 caracteres), NO se envía nada. `markAllAsTouched()` marca el campo
    // como "tocado" para que aparezca su mensaje de error en rojo.
    if (this.pasoNota.invalid) {
      this.pasoNota.markAllAsTouched();
      return; // corta acá: no sigue con el envío
    }

    // VALIDACIÓN 2: tienen que estar médico, especialidad y sede. En la
    // práctica siempre están (el stepper lineal no deja llegar hasta acá sin
    // elegirlos), pero se controla por las dudas y para que TypeScript sepa
    // que no son null.
    const consulta = this.consulta();
    if (!consulta) return;

    this.enviando.set(true); // deshabilita el botón: evita un doble envío
    this.error.set(null);
    this.turnoService
      .crear({
        // `...consulta` copia id_medico, id_especialidad e id_sede.
        ...consulta,
        // El `!` dice "acá seguro hay valor": el stepper no deja llegar sin fecha y hora.
        fecha: this.pasoFecha.controls.fecha.value!,
        hora: this.pasoHorario.controls.hora.value!,
        // `.trim()` saca los espacios del principio y del final.
        nota: this.pasoNota.controls.nota.value.trim(),
        // Solo el operador manda el paciente; el paciente sale del token.
        // Para el paciente queda `undefined` y el campo ni viaja: el backend
        // toma su id del token (así nadie puede sacarle turno a otro).
        id_paciente: this.esOperador ? this.paciente()!.id : undefined,
      })
      .subscribe({
        // ── CAMINO FELIZ: el backend respondió 201 con el turno creado ──
        next: (turno) => {
          // Aviso verde abajo de la pantalla durante 4 segundos.
          this.avisos.open('¡Turno confirmado!', 'Cerrar', { duration: 4000 });
          // El backend acaba de generar una notificación: el contador se
          // actualiza sin recargar la página.
          this.notificaciones.cargar();
          // Se lleva a cada rol a la pantalla donde ve el turno nuevo.
          if (this.esOperador) {
            // Operador: a los turnos de su sede, en la fecha del turno.
            this.router.navigate(['/operador/turnos'], { queryParams: { fecha: turno.fecha } });
          } else {
            // Paciente: a "Mis turnos".
            this.router.navigate(['/paciente/mis-turnos']);
          }
        },
        // ── ERROR: el backend rechazó el turno ──
        // Puede ser un 409 (otro paciente tomó ese horario mientras tanto), un
        // 400 (dato inválido) o que el backend no responda.
        error: (error: unknown) => {
          // El horario se ocupó mientras tanto (u otro rechazo): se muestra
          // el mensaje, se recargan los horarios y se vuelve a ese paso.
          this.enviando.set(false); // vuelve a habilitar el botón
          this.pasoHorario.controls.hora.reset(''); // borra la hora que ya no sirve
          this.cargarHorarios(); // pide la lista actualizada (sin el horario tomado)
          // Después de pedir los horarios: `pedir()` limpia el error al
          // arrancar, y este mensaje tiene que quedar visible.
          this.error.set(mensajeDeError(error));
          // Mueve el stepper al paso "Horario" (uno más si es operador).
          this.stepper().selectedIndex = PASO_HORARIO_PACIENTE + (this.esOperador ? 1 : 0);
        },
      });
  }
}
