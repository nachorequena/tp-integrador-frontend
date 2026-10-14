/**
 * PANTALLA "NO ENCONTRADA"
 * ========================
 *
 * Se muestra para cualquier URL que no coincida con ninguna ruta (la ruta
 * comodín `**`, que va última en `app.routes.ts`).
 */

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <section class="pantalla-estado">
      <mat-icon>travel_explore</mat-icon>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscás no existe o fue movida.</p>
      <a mat-flat-button routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class NoEncontrada {}
