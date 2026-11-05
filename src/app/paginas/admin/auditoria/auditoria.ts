/**
 * PANTALLA "AUDITORÍA" (rol administrador)
 * ========================================
 *
 * Registro de acciones sensibles, de solo lectura: usuario, acción (ALTA /
 * BAJA / MODIFICACION), entidad, detalle y fecha. Filtros por usuario, entidad
 * y rango de fechas; listado paginado con lo más reciente primero (el orden lo
 * da el backend).
 *
 * Ruta: `/admin/auditoria` (opción "Auditoría" de `MENU_POR_ROL.admin`).
 * Servicio: `AuditoriaService` → `GET /auditoria` (paginado en el servidor).
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { EntradaAuditoria, ENTIDADES_AUDITADAS } from '../../../core/modelos/auditoria';
import { AuditoriaService } from '../../../core/servicios/auditoria.service';
import { aFechaApi, deFechaHoraApi } from '../../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../../core/utilidades/textos-datepicker';

@Component({
  selector: 'app-auditoria',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './auditoria.html',
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class Auditoria implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);

  protected readonly columnas = ['fecha', 'usuario', 'accion', 'entidad', 'detalle'];
  protected readonly entidades = ENTIDADES_AUDITADAS;
  protected readonly deFechaHoraApi = deFechaHoraApi;

  protected readonly filtros = inject(FormBuilder).group({
    usuario: [''],
    entidad: [''],
    desde: [null as Date | null],
    hasta: [null as Date | null],
  });

  protected readonly entradas = signal<EntradaAuditoria[]>([]);
  protected readonly total = signal(0);
  protected readonly indicePagina = signal(0);
  protected readonly tamanioPagina = signal(10);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide la página actual con los filtros actuales (`GET /auditoria`). */
  protected cargar(): void {
    const { usuario, entidad, desde, hasta } = this.filtros.getRawValue();

    // Un rango invertido daría siempre vacío: se avisa antes de preguntar.
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.auditoriaService
      .listar({
        usuario: usuario?.trim(),
        entidad: entidad ?? undefined,
        desde: desde ? aFechaApi(desde) : undefined,
        hasta: hasta ? aFechaApi(hasta) : undefined,
        pagina: this.indicePagina() + 1,
        limite: this.tamanioPagina(),
      })
      .subscribe({
        next: (pagina) => {
          this.entradas.set(pagina.items);
          this.total.set(pagina.total);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  /** Aplica los filtros desde la primera página. */
  protected buscar(): void {
    this.indicePagina.set(0);
    this.cargar();
  }

  /** Borra los filtros y vuelve a la primera página. */
  protected limpiar(): void {
    this.filtros.reset({ usuario: '', entidad: '', desde: null, hasta: null });
    this.buscar();
  }

  /** Cambio de página o de tamaño en el paginador. */
  protected cambiarPagina(evento: PageEvent): void {
    this.indicePagina.set(evento.pageIndex);
    this.tamanioPagina.set(evento.pageSize);
    this.cargar();
  }
}
