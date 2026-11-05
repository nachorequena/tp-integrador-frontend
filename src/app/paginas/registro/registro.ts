/**
 * PANTALLA DE REGISTRO DE PACIENTE
 * ================================
 *
 * Alta de un paciente nuevo contra `POST /auth/registro` (pública, sin
 * sesión). El backend asigna siempre el rol `paciente`.
 *
 * Los campos y validaciones viven en `compartido/formulario-paciente`, que
 * también usa el operador para dar de alta pacientes: así los dos caminos
 * piden exactamente lo mismo (lo exige la consigna). Esta pantalla solo pone
 * la tarjeta, le dice al formulario a qué endpoint mandar (`AuthService.
 * registrar`) y qué hacer al terminar: avisar y llevar al login con el DNI ya
 * cargado.
 *
 * Ruta: `/registro` (solo sin sesión, `invitadoGuard`).
 */

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { FormularioPaciente } from '../../compartido/formulario-paciente/formulario-paciente';
import { DatosRegistro, Usuario } from '../../core/modelos/usuario';
import { AuthService } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, FormularioPaciente],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);

  /**
   * Cómo se guarda: el registro público. Es una arrow function para que
   * `this` siga apuntando a esta pantalla cuando el formulario la llame.
   */
  protected readonly registrar = (datos: DatosRegistro): Observable<Usuario> =>
    this.auth.registrar(datos);

  /** Alta exitosa: aviso y al login con el DNI precargado. */
  protected alRegistrarse(usuario: Usuario): void {
    this.avisos.open('¡Te registraste con éxito! Ya podés iniciar sesión.', 'Cerrar', {
      duration: 5000,
    });
    this.router.navigate(['/login'], { queryParams: { dni: usuario.dni } });
  }
}
