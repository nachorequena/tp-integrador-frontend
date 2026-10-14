/**
 * PANTALLA "ACCESO DENEGADO"
 * ==========================
 *
 * Adonde manda `rolGuard` a quien intenta entrar a la sección de otro rol (por
 * ejemplo, un paciente que escribe `/admin/sedes` en la barra de direcciones).
 */

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <section class="pantalla-estado">
      <mat-icon>block</mat-icon>
      <h1>Acceso denegado</h1>
      <p>Tu tipo de usuario no tiene permiso para ver esta sección.</p>
      <a mat-flat-button routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class AccesoDenegado {}
