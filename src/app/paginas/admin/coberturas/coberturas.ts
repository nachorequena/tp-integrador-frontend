/**
 * PANTALLA "COBERTURAS" (rol administrador)
 * =========================================
 *
 * Listado de coberturas (obras sociales y prepagas) en una tabla con filtro de
 * texto, alta y modificación con un formulario (`compartido/dialogo-texto`,
 * campo `nombre`) y baja con confirmación previa.
 *
 * Ruta: `/admin/coberturas` (opción de `MENU_POR_ROL.admin`).
 * Servicio: `CoberturaService` → `GET/POST/PUT/DELETE /coberturas` (el
 * listado del CRUD, solo admin; no el público `/coberturas/disponibles`).
 *
 * El listado se refresca tras cada cambio exitoso, y si el backend rechaza
 * una baja (hay pacientes o turnos con esa cobertura) se muestra su mensaje y
 * el listado no cambia.
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
import { DatosDialogoTexto, DialogoTexto } from '../../../compartido/dialogo-texto/dialogo-texto';
import { Cobertura } from '../../../core/modelos/cobertura';
import { CoberturaService } from '../../../core/servicios/cobertura.service';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-coberturas',
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
  templateUrl: './coberturas.html',
})
export class Coberturas implements OnInit {
  private readonly coberturaService = inject(CoberturaService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  protected readonly columnas = ['nombre', 'acciones'];
  protected readonly coberturas = signal<Cobertura[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filtro = new FormControl('', { nonNullable: true });
  private readonly textoFiltro = toSignal(this.filtro.valueChanges, { initialValue: '' });

  /** Coberturas cuyo nombre contiene el texto del filtro. */
  protected readonly filtradas = computed(() => {
    const texto = this.textoFiltro().trim().toLowerCase();
    return this.coberturas().filter((c) => c.nombre.toLowerCase().includes(texto));
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide el listado (`GET /coberturas`). */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.coberturaService.listar().subscribe({
      next: (lista) => {
        this.coberturas.set(lista);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Abre el formulario de alta o modificación; si se guardó, recarga. */
  protected abrirFormulario(cobertura: Cobertura | null = null): void {
    const datos: DatosDialogoTexto = {
      titulo: cobertura ? 'Modificar cobertura' : 'Nueva cobertura',
      etiqueta: 'Nombre',
      valorInicial: cobertura?.nombre ?? '',
      maximo: 30, // varchar(30) en la tabla `cobertura`
      guardar: (nombre) =>
        cobertura
          ? this.coberturaService.actualizar(cobertura.id, { nombre })
          : this.coberturaService.crear({ nombre }),
    };
    this.dialogo
      .open(DialogoTexto, { data: datos, width: '440px' })
      .afterClosed()
      .subscribe((guardado?: boolean) => {
        if (!guardado) return;
        this.avisos.open(cobertura ? 'Cobertura modificada.' : 'Cobertura creada.', 'Cerrar', {
          duration: 3000,
        });
        this.cargar();
      });
  }

  /** Pide confirmación y elimina; si el backend la rechaza, muestra su mensaje. */
  protected eliminar(cobertura: Cobertura): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar cobertura',
      mensaje: `¿Está seguro de eliminar la cobertura "${cobertura.nombre}"?`,
      textoConfirmar: 'Eliminar',
    }).subscribe((confirmado) => {
      if (!confirmado) return;
      this.coberturaService.eliminar(cobertura.id).subscribe({
        next: () => {
          this.avisos.open('Cobertura eliminada.', 'Cerrar', { duration: 3000 });
          this.cargar();
        },
        error: (error: unknown) =>
          this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 7000 }),
      });
    });
  }
}
