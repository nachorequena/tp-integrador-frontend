/**
 * DIÁLOGO DE ALTA / EDICIÓN DE USUARIO (rol administrador)
 * ========================================================
 *
 * Formulario que se abre desde `paginas/admin/usuarios`:
 *   - ALTA de operador, médico o administrador (el paciente se registra solo
 *     o lo da de alta el operador). Contraseña obligatoria.
 *   - EDICIÓN de cualquier usuario, incluidos los pacientes. El tipo de
 *     usuario no se cambia (el backend lo rechaza) y la contraseña es
 *     opcional: vacía = se conserva la actual.
 *
 * Reglas de la consigna según el rol elegido:
 *   - operador y médico → sede obligatoria;
 *   - administrador → sin sede (opera sobre todas);
 *   - médico → una o más especialidades;
 *   - paciente → cobertura obligatoria.
 * Los validadores de esos campos se prenden y apagan cuando cambia el rol
 * (`ajustarCamposSegunRol`).
 *
 * Guarda él mismo con `UsuarioService` (`POST /usuarios` o
 * `PUT /usuarios/:id`) y se cierra con `true` si salió bien.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Cobertura } from '../../../core/modelos/cobertura';
import { Especialidad } from '../../../core/modelos/especialidad';
import { Sede } from '../../../core/modelos/sede';
import { DatosUsuarioAdmin, NOMBRE_ROL, Rol, UsuarioListado } from '../../../core/modelos/usuario';
import { UsuarioService } from '../../../core/servicios/usuario.service';
import { aDate, aFechaApi } from '../../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../../core/utilidades/textos-datepicker';
import { maxBytes, PATRON_EMAIL, textoNoVacio } from '../../../core/utilidades/validadores';

/** Lo que recibe el diálogo desde la pantalla de usuarios. */
export interface DatosDialogoUsuario {
  /** Usuario a editar, o `null` para un alta. */
  usuario: UsuarioListado | null;
  /** Listados para los selectores (vienen de la API, no escritos a mano). */
  sedes: Sede[];
  especialidades: Especialidad[];
  coberturas: Cobertura[];
}

/** Roles que el administrador puede dar de alta. */
const ROLES_ALTA: Rol[] = ['operador', 'medico', 'admin'];

@Component({
  selector: 'app-dialogo-usuario',
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
  templateUrl: './dialogo-usuario.html',
  // Textos del calendario en español: ver la nota en `formulario-paciente.ts`.
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class DialogoUsuario {
  private readonly usuarioService = inject(UsuarioService);
  private readonly referencia = inject(MatDialogRef<DialogoUsuario, boolean>);
  protected readonly datos = inject<DatosDialogoUsuario>(MAT_DIALOG_DATA);

  /** `true` si se está editando un usuario existente. */
  protected readonly esEdicion = this.datos.usuario !== null;

  /** En el alta solo los tres roles permitidos; en la edición, el del usuario. */
  protected readonly roles: Rol[] = this.esEdicion ? [this.datos.usuario!.rol] : ROLES_ALTA;
  protected readonly NOMBRE_ROL = NOMBRE_ROL;
  protected readonly hoy = new Date();

  protected readonly formulario = inject(FormBuilder).group({
    nombre: [this.datos.usuario?.nombre ?? '', [Validators.required, textoNoVacio, Validators.maxLength(30)]],
    apellido: [
      this.datos.usuario?.apellido ?? '',
      [Validators.required, textoNoVacio, Validators.maxLength(30)],
    ],
    dni: [this.datos.usuario?.dni ?? '', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    telefono: [
      this.datos.usuario?.telefono ?? '',
      [Validators.required, Validators.pattern(/^\d{1,10}$/)],
    ],
    email: [
      this.datos.usuario?.email ?? '',
      [Validators.required, Validators.email, Validators.pattern(PATRON_EMAIL), Validators.maxLength(30)],
    ],
    fecha_nacimiento: [
      this.datos.usuario ? aDate(this.datos.usuario.fecha_nacimiento) : (null as Date | null),
      Validators.required,
    ],
    // El rol no se puede cambiar al editar: el control se deshabilita.
    rol: [
      { value: this.datos.usuario?.rol ?? (null as Rol | null), disabled: this.esEdicion },
      Validators.required,
    ],
    // Obligatoria en el alta; en la edición, vacía significa "no cambiarla".
    password: [
      '',
      this.esEdicion
        ? [Validators.minLength(6), maxBytes(72)]
        : [Validators.required, Validators.minLength(6), maxBytes(72)],
    ],
    id_sede: [this.datos.usuario?.id_sede ?? (null as number | null)],
    especialidades: [this.datos.usuario?.especialidades ?? ([] as number[])],
    id_cobertura: [this.datos.usuario?.id_cobertura ?? (null as number | null)],
  });

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Rol elegido en el formulario (como signal, para el template). */
  protected readonly rolElegido = signal<Rol | null>(this.datos.usuario?.rol ?? null);

  constructor() {
    this.ajustarCamposSegunRol(this.rolElegido());
    this.formulario.controls.rol.valueChanges.pipe(takeUntilDestroyed()).subscribe((rol) => {
      this.rolElegido.set(rol);
      this.ajustarCamposSegunRol(rol);
    });
  }

  /**
   * Prende o apaga los validadores de sede, especialidades y cobertura según el
   * rol, que es lo que define cuáles corresponden.
   *
   * @param rol Rol elegido.
   */
  private ajustarCamposSegunRol(rol: Rol | null): void {
    const { id_sede, especialidades, id_cobertura } = this.formulario.controls;
    const conSede = rol === 'operador' || rol === 'medico';

    id_sede.setValidators(conSede ? [Validators.required] : []);
    especialidades.setValidators(rol === 'medico' ? [Validators.required] : []);
    id_cobertura.setValidators(rol === 'paciente' ? [Validators.required] : []);

    for (const control of [id_sede, especialidades, id_cobertura]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  /** Valida, guarda (POST o PUT) y cierra con `true` si el backend lo aceptó. */
  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    // getRawValue incluye el rol aunque esté deshabilitado (en la edición).
    const valores = this.formulario.getRawValue();
    const rol = valores.rol as Rol;
    const cuerpo: DatosUsuarioAdmin = {
      nombre: valores.nombre!.trim(),
      apellido: valores.apellido!.trim(),
      dni: valores.dni!,
      email: valores.email!.trim(),
      telefono: valores.telefono!,
      fecha_nacimiento: aFechaApi(valores.fecha_nacimiento!),
      rol,
      // Solo se mandan los datos que corresponden al rol.
      id_sede: rol === 'operador' || rol === 'medico' ? valores.id_sede : null,
      especialidades: rol === 'medico' ? (valores.especialidades ?? []) : [],
      id_cobertura: rol === 'paciente' ? valores.id_cobertura : null,
    };
    if (valores.password) cuerpo.password = valores.password;

    this.guardando.set(true);
    this.error.set(null);
    const pedido = this.esEdicion
      ? this.usuarioService.actualizar(this.datos.usuario!.id, cuerpo)
      : this.usuarioService.crear(cuerpo);

    pedido.subscribe({
      next: () => this.referencia.close(true),
      error: (error: unknown) => {
        const mensaje = mensajeDeError(error);
        this.error.set(mensaje);
        // DNI o email duplicado: se marca además en el campo.
        if (error instanceof HttpErrorResponse && error.status === 409) {
          if (mensaje.includes('DNI')) this.formulario.controls.dni.setErrors({ servidor: mensaje });
          if (mensaje.toLowerCase().includes('email'))
            this.formulario.controls.email.setErrors({ servidor: mensaje });
        }
        this.guardando.set(false);
      },
    });
  }
}
