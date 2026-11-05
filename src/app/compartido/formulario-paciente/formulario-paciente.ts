/**
 * FORMULARIO DE ALTA DE PACIENTE (REUTILIZABLE)
 * =============================================
 *
 * Los campos, validaciones y mensajes del registro de la semana 1, sacados a
 * un componente propio para que los usen dos pantallas sin duplicarlos (lo
 * pide el criterio de aceptación: "el formulario de alta de paciente se
 * reutiliza entre roles"):
 *
 *   - `paginas/registro` → el propio paciente se registra (`POST /auth/registro`);
 *   - `paginas/operador/pacientes` → el operador da de alta a un paciente
 *     (`POST /pacientes`).
 *
 * El componente no sabe a qué endpoint se manda: lo decide quien lo usa,
 * pasándole la función `guardar`. Así el formulario se ocupa de validar,
 * mostrar el progreso y marcar los errores del backend (DNI o email
 * duplicados) en el campo correspondiente; la pantalla decide qué hacer
 * después (`guardado`).
 *
 * Las validaciones replican las del backend (mismos largos que las columnas de
 * la base) para avisar en cada campo antes de enviar.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { Cobertura } from '../../core/modelos/cobertura';
import { DatosRegistro, Usuario } from '../../core/modelos/usuario';
import { CoberturaService } from '../../core/servicios/cobertura.service';
import { aFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../core/utilidades/textos-datepicker';
import {
  coincidenCampos,
  maxBytes,
  PATRON_EMAIL,
  textoNoVacio,
} from '../../core/utilidades/validadores';

@Component({
  selector: 'app-formulario-paciente',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './formulario-paciente.html',
  // Va acá y no en app.config.ts: `MatDatepickerModule` registra su propio
  // `MatDatepickerIntl` (en inglés) y, al importarlo este componente, le gana
  // a cualquiera global. Un provider del componente tiene prioridad sobre él.
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class FormularioPaciente implements OnInit {
  private readonly coberturaService = inject(CoberturaService);

  /**
   * Cómo se guarda el paciente: la pantalla pasa la llamada al servicio que
   * corresponde (`AuthService.registrar` o `PacienteService.crear`).
   */
  readonly guardar = input.required<(datos: DatosRegistro) => Observable<Usuario>>();

  /** Texto del botón de envío. */
  readonly textoBoton = input('Guardar');

  /** Se emite con el paciente creado cuando el backend confirma el alta. */
  readonly guardado = output<Usuario>();

  /**
   * Los largos máximos salen de las columnas de la tabla `usuario`. Hay que
   * controlarlos acá porque una base en modo no estricto trunca en silencio
   * lo que se pase, en vez de dar error.
   */
  protected readonly formulario = inject(FormBuilder).group(
    {
      nombre: ['', [Validators.required, textoNoVacio, Validators.maxLength(30)]],
      apellido: ['', [Validators.required, textoNoVacio, Validators.maxLength(30)]],
      // 7 u 8 dígitos: los DNI vigentes tienen 8 y 7 cubre los más viejos.
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      // La consigna de la semana 1 no lo pide, pero la columna es NOT NULL y
      // el backend lo exige.
      telefono: ['', [Validators.required, Validators.pattern(/^\d{1,10}$/)]],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(PATRON_EMAIL),
          Validators.maxLength(30),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6), maxBytes(72)]],
      repetirPassword: ['', Validators.required],
      fecha_nacimiento: [null as Date | null, Validators.required],
      id_cobertura: [null as number | null, Validators.required],
    },
    // Validador del grupo: las dos contraseñas tienen que coincidir.
    { validators: coincidenCampos('password', 'repetirPassword') },
  );

  /** Tope del datepicker: no se puede nacer en el futuro. */
  protected readonly hoy = new Date();

  /** Coberturas para el selector, traídas del backend (nunca escritas a mano). */
  protected readonly coberturas = signal<Cobertura[]>([]);
  protected readonly cargandoCoberturas = signal(true);
  protected readonly errorCoberturas = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verPassword = signal(false);

  ngOnInit(): void {
    this.cargarCoberturas();
  }

  /** Pide el listado público de coberturas. Se puede reintentar si falló. */
  protected cargarCoberturas(): void {
    this.cargandoCoberturas.set(true);
    this.errorCoberturas.set(null);
    this.coberturaService.listarDisponibles().subscribe({
      next: (coberturas) => {
        this.coberturas.set(coberturas);
        this.cargandoCoberturas.set(false);
      },
      error: (error: unknown) => {
        this.errorCoberturas.set(mensajeDeError(error));
        this.cargandoCoberturas.set(false);
      },
    });
  }

  /** Valida y envía el alta con la función que pasó la pantalla. */
  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);

    this.guardar()({
      nombre: valores.nombre!.trim(),
      apellido: valores.apellido!.trim(),
      dni: valores.dni!,
      telefono: valores.telefono!,
      email: valores.email!.trim(),
      password: valores.password!,
      fecha_nacimiento: aFechaApi(valores.fecha_nacimiento!),
      id_cobertura: valores.id_cobertura!,
    }).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.guardado.emit(usuario);
      },
      error: (error: unknown) => {
        this.mostrarErrorDelServidor(error);
        this.enviando.set(false);
      },
    });
  }

  /** Vacía el formulario (lo usa el operador para cargar otro paciente). */
  reiniciar(): void {
    this.formulario.reset();
    this.error.set(null);
  }

  /**
   * Muestra el error del backend arriba del formulario y, si es un duplicado,
   * también marca el campo culpable para que se vea dónde corregir.
   *
   * El error manual del campo se borra solo en cuanto el usuario lo edita,
   * porque Angular vuelve a correr los validadores con cada cambio.
   */
  private mostrarErrorDelServidor(error: unknown): void {
    const mensaje = mensajeDeError(error);
    this.error.set(mensaje);
    if (error instanceof HttpErrorResponse && error.status === 409) {
      if (mensaje.includes('DNI')) {
        this.formulario.controls.dni.setErrors({ servidor: mensaje });
        this.formulario.controls.dni.markAsTouched();
      } else if (mensaje.toLowerCase().includes('email')) {
        this.formulario.controls.email.setErrors({ servidor: mensaje });
        this.formulario.controls.email.markAsTouched();
      }
    }
  }
}
