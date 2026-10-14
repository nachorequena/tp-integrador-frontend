/**
 * PANTALLA DE REGISTRO DE PACIENTE
 * ================================
 *
 * Alta de un paciente nuevo contra `POST /auth/registro`. El backend asigna
 * siempre el rol `paciente`, así que el formulario no lo pide.
 *
 * Las validaciones replican las del backend (mismos largos que las columnas
 * de la base) para avisar en cada campo antes de enviar. Igual se manejan los
 * errores que devuelva el backend, porque hay cosas que solo él puede saber:
 * que un DNI o un email ya estén registrados.
 *
 * Si el alta sale bien, se avisa y se lleva al login con el DNI ya cargado.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Cobertura } from '../../core/modelos/cobertura';
import { AuthService } from '../../core/servicios/auth.service';
import { CoberturaService } from '../../core/servicios/cobertura.service';
import { aFechaApi } from '../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../core/utilidades/textos-datepicker';
import { maxBytes, textoNoVacio } from '../../core/utilidades/validadores';

/**
 * Mismo patrón de email que usa el backend. `Validators.email` de Angular
 * acepta `usuario@dominio` sin punto, que el backend rechaza: con los dos
 * juntos, lo que pasa en el front también pasa en el back.
 */
const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './registro.html',
  // Va acá y no en app.config.ts: `MatDatepickerModule` registra su propio
  // `MatDatepickerIntl` (en inglés) y, al importarlo este componente, le gana
  // a cualquiera global. Un provider del componente tiene prioridad sobre él.
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class Registro implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);

  /**
   * Los largos máximos salen de las columnas de la tabla `usuario`. Hay que
   * controlarlos acá porque una base en modo no estricto trunca en silencio
   * lo que se pase, en vez de dar error.
   */
  protected readonly formulario = inject(FormBuilder).group({
    nombre: ['', [Validators.required, textoNoVacio, Validators.maxLength(30)]],
    apellido: ['', [Validators.required, textoNoVacio, Validators.maxLength(30)]],
    // 7 u 8 dígitos: los DNI vigentes tienen 8 y 7 cubre los más viejos.
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    // La consigna no lo pide, pero la columna es NOT NULL y el backend lo exige.
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
    fecha_nacimiento: [null as Date | null, Validators.required],
    id_cobertura: [null as number | null, Validators.required],
  });

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

  /** Pide el listado de coberturas. Se puede reintentar si falló. */
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

  /** Valida y envía el alta. */
  protected registrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);

    this.auth
      .registrar({
        nombre: valores.nombre!.trim(),
        apellido: valores.apellido!.trim(),
        dni: valores.dni!,
        telefono: valores.telefono!,
        email: valores.email!.trim(),
        password: valores.password!,
        fecha_nacimiento: aFechaApi(valores.fecha_nacimiento!),
        id_cobertura: valores.id_cobertura!,
      })
      .subscribe({
        next: (usuario) => {
          this.avisos.open('¡Te registraste con éxito! Ya podés iniciar sesión.', 'Cerrar', {
            duration: 5000,
          });
          this.router.navigate(['/login'], { queryParams: { dni: usuario.dni } });
        },
        error: (error: unknown) => {
          this.mostrarErrorDelServidor(error);
          this.enviando.set(false);
        },
      });
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
