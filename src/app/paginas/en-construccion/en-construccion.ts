/**
 * PANTALLA "EN CONSTRUCCIÓN"
 * ==========================
 *
 * Destino de las opciones del menú que se implementan en semanas futuras. La
 * consigna permite dejarlas visibles apuntando acá.
 *
 * El título de la sección llega por `data.titulo` de la ruta (ver
 * `app.routes.ts`) y Angular lo pasa directo al input `titulo` gracias a
 * `withComponentInputBinding()`.
 */

import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-en-construccion',
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <section class="pantalla-estado">
      <mat-icon>construction</mat-icon>
      <h1>{{ titulo() }}</h1>
      <p>Esta sección está en construcción. Va a estar disponible en las próximas entregas.</p>
      <a mat-stroked-button routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class EnConstruccion {
  /** Nombre de la sección, tomado de los datos de la ruta. */
  readonly titulo = input('En construcción');
}
