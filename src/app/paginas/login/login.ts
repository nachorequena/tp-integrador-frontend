/**
 * PANTALLA DE LOGIN
 * =================
 *
 * Formulario de DNI y contraseña. Si el backend acepta las credenciales, abre
 * la sesión (token + usuario en el navegador) y lleva a la pantalla de la que
 * venía el usuario, o al inicio.
 *
 * Lee dos parámetros opcionales de la URL:
 *   - `?volver=` lo pone `sesionGuard` al rebotar a alguien sin sesión;
 *   - `?dni=` lo pone el registro, para no hacer tipear el DNI de nuevo.
 */

import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/servicios/auth.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { mensajeDeError } from '../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);

  /** URL a la que volver después de entrar (query param `volver`). */
  readonly volver = input<string>();

  /** DNI precargado (query param `dni`, lo manda el registro). */
  readonly dni = input<string>();

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    password: ['', Validators.required],
  });

  /** `true` mientras espera la respuesta: deshabilita el botón y evita doble envío. */
  protected readonly enviando = signal(false);

  /** Mensaje de error del backend, mostrado sobre el formulario. */
  protected readonly error = signal<string | null>(null);

  /** Alterna entre ver la contraseña o los puntitos. */
  protected readonly verPassword = signal(false);

  ngOnInit(): void {
    const dni = this.dni();
    if (dni) this.formulario.controls.dni.setValue(dni);
  }

  /** Envía las credenciales y, si son válidas, abre la sesión. */
  protected ingresar(): void {
    if (this.formulario.invalid) {
      // Marca todo como tocado para que aparezcan los errores de cada campo.
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: ({ token, usuario }) => {
        this.sesion.iniciar(token, usuario);
        this.avisos.open(`¡Hola, ${usuario.nombre}!`, 'Cerrar', { duration: 3000 });
        this.router.navigateByUrl(this.destinoSeguro());
      },
      error: (error: unknown) => {
        // El backend responde lo mismo si falla el DNI o la contraseña ("DNI o
        // contraseña incorrectos"), así que se muestra tal cual: no revela cuál
        // de los dos estaba mal.
        this.error.set(mensajeDeError(error));
        this.enviando.set(false);
      },
    });
  }

  /**
   * Devuelve la URL de `volver` solo si es una ruta interna.
   *
   * Sin este control, un enlace armado como `/login?volver=https://otro-sitio`
   * podría sacar al usuario de la app justo después de loguearse.
   */
  private destinoSeguro(): string {
    const volver = this.volver();
    return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  }
}
