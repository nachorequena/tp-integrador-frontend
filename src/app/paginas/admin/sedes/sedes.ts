/**
 * PANTALLA "SEDES" (rol administrador)
 * ====================================
 *
 * Listado de sedes en una tabla con filtro de texto, alta y modificación con
 * un formulario (`dialogo-sede`) y baja con confirmación previa.
 *
 * Ruta: `/admin/sedes` (opción "Sedes" de `MENU_POR_ROL.admin`).
 * Servicio: `SedeService` → `GET/POST/PUT/DELETE /sedes`.
 *
 * Reglas de la consigna que se cumplen acá:
 *   - después de cada alta, modificación o baja exitosa, el listado se vuelve
 *     a pedir y se actualiza sin recargar la página;
 *   - si el backend rechaza la baja por dependencias (409), se muestra su
 *     mensaje y el listado no se toca.
 */

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { confirmar } from '../../../compartido/dialogo-confirmacion/dialogo-confirmacion';
import { Sede } from '../../../core/modelos/sede';
import { SedeService } from '../../../core/servicios/sede.service';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { DialogoSede } from './dialogo-sede';

@Component({
  selector: 'app-sedes',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './sedes.html',
})
export class Sedes implements OnInit {
  private readonly sedeService = inject(SedeService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  protected readonly columnas = ['nombre', 'direccion', 'telefono', 'acciones'];
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Texto del filtro de búsqueda. */
  protected readonly filtro = new FormControl('', { nonNullable: true });
  private readonly textoFiltro = toSignal(this.filtro.valueChanges, { initialValue: '' });

  /** Sedes que coinciden con el filtro (en nombre, dirección o teléfono). */
  protected readonly sedesFiltradas = computed(() => {
    const texto = this.textoFiltro().trim().toLowerCase();
    if (!texto) return this.sedes();
    return this.sedes().filter((sede) =>
      [sede.nombre, sede.direccion, sede.telefono].some((campo) =>
        campo.toLowerCase().includes(texto),
      ),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide el listado (`GET /sedes`). Se usa al entrar y después de cada cambio. */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.sedeService.listar().subscribe({
      next: (sedes) => {
        this.sedes.set(sedes);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /**
   * Abre el formulario de alta (sin sede) o de modificación (con sede). Si se
   * guardó, recarga el listado.
   */
  protected abrirFormulario(sede: Sede | null = null): void {
    this.dialogo
      .open(DialogoSede, { data: sede, width: '480px' })
      .afterClosed()
      .subscribe((guardada?: Sede) => {
        if (!guardada) return;
        this.avisos.open(sede ? 'Sede modificada.' : 'Sede creada.', 'Cerrar', { duration: 3000 });
        this.cargar();
      });
  }

  /**
   * Pide confirmación y elimina la sede.
   *
   * Si el backend la rechaza (por ejemplo, porque tiene usuarios o agendas),
   * se muestra su mensaje y NO se recarga ni se toca el listado.
   */
  protected eliminar(sede: Sede): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar sede',
      mensaje: `¿Está seguro de eliminar la sede "${sede.nombre}"?`,
      textoConfirmar: 'Eliminar',
    }).subscribe((confirmado) => {
      if (!confirmado) return;
      this.sedeService.eliminar(sede.id).subscribe({
        next: () => {
          this.avisos.open('Sede eliminada.', 'Cerrar', { duration: 3000 });
          this.cargar();
        },
        error: (error: unknown) =>
          this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 7000 }),
      });
    });
  }
}
