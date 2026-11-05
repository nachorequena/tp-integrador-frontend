/**
 * PANTALLA "MIS DATOS PERSONALES" (rol paciente)
 * ==============================================
 *
 * Muestra toda la información del paciente. Solo se pueden modificar email,
 * contraseña, teléfono y cobertura; el resto (nombre, apellido, DNI, fecha de
 * nacimiento) se muestra en modo lectura, como pide la consigna.
 *
 * El cambio de contraseña es opcional y pide repetir la nueva: el validador de
 * grupo `coincidenCampos` controla que coincidan ANTES de enviar.
 *
 * Ruta: `/paciente/mis-datos`. Servicios:
 *   - `AuthService.perfil()` → `GET /auth/perfil` (datos actuales de la base);
 *   - `CoberturaService.listarDisponibles()` → selector de cobertura;
 *   - `PacienteService.actualizarMisDatos()` → `PUT /pacientes/mis-datos`.
 * Al guardar, se actualiza la sesión (`SesionService.actualizarUsuario`) para
 * que el resto de la app vea los datos nuevos sin volver a iniciar sesión.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Cobertura } from '../../../core/modelos/cobertura';
import { DatosMisDatos } from '../../../core/modelos/paciente';
import { Usuario } from '../../../core/modelos/usuario';
import { AuthService } from '../../../core/servicios/auth.service';
import { CoberturaService } from '../../../core/servicios/cobertura.service';
import { PacienteService } from '../../../core/servicios/paciente.service';
import { SesionService } from '../../../core/servicios/sesion.service';
import { deFechaApi } from '../../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { coincidenCampos, maxBytes, PATRON_EMAIL } from '../../../core/utilidades/validadores';

@Component({
  selector: 'app-mis-datos',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './mis-datos.html',
})
export class MisDatos implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly sesion = inject(SesionService);
  private readonly avisos = inject(MatSnackBar);

  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly coberturas = signal<Cobertura[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly deFechaApi = deFechaApi;

  /** Solo los cuatro campos editables. La contraseña es opcional. */
  protected readonly formulario = inject(FormBuilder).nonNullable.group(
    {
      email: [
        '',
        [Validators.required, Validators.email, Validators.pattern(PATRON_EMAIL), Validators.maxLength(30)],
      ],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{1,10}$/)]],
      id_cobertura: [0, Validators.required],
      password: ['', [Validators.minLength(6), maxBytes(72)]],
      repetirPassword: [''],
    },
    { validators: coincidenCampos('password', 'repetirPassword') },
  );

  ngOnInit(): void {
    this.cargar();
  }

  /** Trae el perfil actual y las coberturas, y carga el formulario. */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      usuario: this.auth.perfil(),
      coberturas: this.coberturaService.listarDisponibles(),
    }).subscribe({
      next: ({ usuario, coberturas }) => {
        this.usuario.set(usuario);
        this.coberturas.set(coberturas);
        this.formulario.reset({
          email: usuario.email,
          telefono: usuario.telefono,
          id_cobertura: usuario.id_cobertura ?? 0,
          password: '',
          repetirPassword: '',
        });
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Valida (incluido que las contraseñas coincidan) y guarda. */
  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const datos: DatosMisDatos = {
      email: valores.email.trim(),
      telefono: valores.telefono,
      id_cobertura: valores.id_cobertura,
    };
    // Sin contraseña nueva no se manda el campo: el backend conserva la actual.
    if (valores.password) datos.password = valores.password;

    this.guardando.set(true);
    this.error.set(null);
    this.pacienteService.actualizarMisDatos(datos).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.sesion.actualizarUsuario(usuario);
        this.formulario.controls.password.reset('');
        this.formulario.controls.repetirPassword.reset('');
        this.guardando.set(false);
        this.avisos.open('Tus datos se guardaron.', 'Cerrar', { duration: 3000 });
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.guardando.set(false);
      },
    });
  }
}
