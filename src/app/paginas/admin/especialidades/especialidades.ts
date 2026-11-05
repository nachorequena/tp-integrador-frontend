/**
 * PANTALLA "ESPECIALIDADES" (rol administrador)
 * =============================================
 *
 * Listado de especialidades en una tabla con filtro de texto, alta y
 * modificación con un formulario (`compartido/dialogo-texto`, campo
 * `descripcion`) y baja con confirmación previa.
 *
 * Ruta: `/admin/especialidades` (opción de `MENU_POR_ROL.admin`).
 * Servicio: `EspecialidadService` → `GET/POST/PUT/DELETE /especialidades`.
 *
 * Igual que en sedes: el listado se refresca tras cada cambio exitoso, y si el
 * backend rechaza una baja (la especialidad tiene médicos o agenda) se
 * muestra su mensaje y el listado no cambia.
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
import { Especialidad } from '../../../core/modelos/especialidad';
import { EspecialidadService } from '../../../core/servicios/especialidad.service';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';

@Component({
  selector: 'app-especialidades',
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
  templateUrl: './especialidades.html',
})
export class Especialidades implements OnInit {
  private readonly especialidadService = inject(EspecialidadService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  protected readonly columnas = ['descripcion', 'acciones'];
  protected readonly especialidades = signal<Especialidad[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filtro = new FormControl('', { nonNullable: true });
  private readonly textoFiltro = toSignal(this.filtro.valueChanges, { initialValue: '' });

  /** Especialidades cuya descripción contiene el texto del filtro. */
  protected readonly filtradas = computed(() => {
    const texto = this.textoFiltro().trim().toLowerCase();
    return this.especialidades().filter((e) => e.descripcion.toLowerCase().includes(texto));
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide el listado (`GET /especialidades`). */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.especialidadService.listar().subscribe({
      next: (lista) => {
        this.especialidades.set(lista);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Abre el formulario de alta o modificación; si se guardó, recarga. */
  protected abrirFormulario(especialidad: Especialidad | null = null): void {
    const datos: DatosDialogoTexto = {
      titulo: especialidad ? 'Modificar especialidad' : 'Nueva especialidad',
      etiqueta: 'Descripción',
      valorInicial: especialidad?.descripcion ?? '',
      maximo: 30, // varchar(30) en la tabla `especialidad`
      guardar: (descripcion) =>
        especialidad
          ? this.especialidadService.actualizar(especialidad.id, { descripcion })
          : this.especialidadService.crear({ descripcion }),
    };
    this.dialogo
      .open(DialogoTexto, { data: datos, width: '440px' })
      .afterClosed()
      .subscribe((guardado?: boolean) => {
        if (!guardado) return;
        this.avisos.open(especialidad ? 'Especialidad modificada.' : 'Especialidad creada.', 'Cerrar', {
          duration: 3000,
        });
        this.cargar();
      });
  }

  /** Pide confirmación y elimina; si el backend la rechaza, muestra su mensaje. */
  protected eliminar(especialidad: Especialidad): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar especialidad',
      mensaje: `¿Está seguro de eliminar la especialidad "${especialidad.descripcion}"?`,
      textoConfirmar: 'Eliminar',
    }).subscribe((confirmado) => {
      if (!confirmado) return;
      this.especialidadService.eliminar(especialidad.id).subscribe({
        next: () => {
          this.avisos.open('Especialidad eliminada.', 'Cerrar', { duration: 3000 });
          this.cargar();
        },
        error: (error: unknown) =>
          this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 7000 }),
      });
    });
  }
}
