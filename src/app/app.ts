/**
 * COMPONENTE RAÍZ (LAYOUT GENERAL)
 * ================================
 *
 * Arma el esqueleto que se ve en todas las pantallas: encabezado arriba, menú
 * lateral a la izquierda, la pantalla actual (`router-outlet`) en el centro y
 * el pie abajo. Las pantallas solo dibujan su contenido; el marco es este.
 *
 * El menú se adapta al ancho: en escritorio queda fijo al costado, y en
 * celulares se superpone al contenido y se abre con el botón del encabezado.
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavContent, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Encabezado } from './layout/encabezado/encabezado';
import { MenuLateral } from './layout/menu-lateral/menu-lateral';
import { Pie } from './layout/pie/pie';

/** Ancho por debajo del cual el menú pasa a superponerse al contenido. */
const CONSULTA_MOVIL = '(max-width: 960px)';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, Encabezado, MenuLateral, Pie],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly breakpoints = inject(BreakpointObserver);

  /** `true` en pantallas angostas. */
  protected readonly esMovil = toSignal(
    this.breakpoints.observe(CONSULTA_MOVIL).pipe(map((estado) => estado.matches)),
    { initialValue: this.breakpoints.isMatched(CONSULTA_MOVIL) },
  );

  /**
   * Lo que eligió el usuario con el botón de menú. Arranca en `null` ("no
   * tocó nada"), y en ese caso decide el ancho de pantalla.
   */
  private readonly eleccionUsuario = signal<boolean | null>(null);

  /** Si el menú está abierto: lo que eligió el usuario, o abierto solo en escritorio. */
  protected readonly menuAbierto = computed(() => this.eleccionUsuario() ?? !this.esMovil());

  /** Zona scrolleable donde se dibujan las pantallas. */
  private readonly contenido = viewChild.required(MatSidenavContent);

  constructor() {
    // Al cambiar de pantalla, se vuelve arriba. El router lo hace solo con la
    // ventana, pero acá lo que scrollea es el contenido del sidenav: sin esto,
    // pasar del registro al login dejaba el login a mitad de página.
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.contenido().scrollTo({ top: 0 }));
  }

  /** Abre o cierra el menú desde el botón del encabezado. */
  protected alternarMenu(): void {
    this.eleccionUsuario.set(!this.menuAbierto());
  }

  /** Tras elegir una opción en el celular, cierra el menú para dejar ver la pantalla. */
  protected alNavegar(): void {
    if (this.esMovil()) this.eleccionUsuario.set(false);
  }

  /** Sincroniza el estado cuando el menú se cierra tocando afuera (modo celular). */
  protected alCambiarMenu(abierto: boolean): void {
    if (abierto !== this.menuAbierto()) this.eleccionUsuario.set(abierto);
  }
}
