/**
 * PANTALLA "REPORTES" (rol administrador)
 * =======================================
 *
 * Dashboard con los cuatro indicadores del backend:
 *   - turnos por especialidad → gráfico de barras;
 *   - turnos por sede → gráfico de barras;
 *   - ranking de médicos por turnos atendidos → tabla;
 *   - tasa de cancelación → tarjetas con total, cancelados y porcentaje.
 *
 * Un único filtro de rango de fechas actualiza los cuatro a la vez:
 * `ReporteService.indicadores()` los pide juntos con `forkJoin`.
 *
 * Ruta: `/admin/reportes` (opción "Reportes" de `MENU_POR_ROL.admin`).
 * Componentes: `compartido/grafico-barras` (Chart.js).
 */

import { PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { GraficoBarras } from '../../../compartido/grafico-barras/grafico-barras';
import { Indicadores } from '../../../core/modelos/reporte';
import { ReporteService } from '../../../core/servicios/reporte.service';
import { aFechaApi } from '../../../core/utilidades/adaptador-fecha';
import { mensajeDeError } from '../../../core/utilidades/mensaje-error';
import { TextosDatepicker } from '../../../core/utilidades/textos-datepicker';

@Component({
  selector: 'app-reportes',
  imports: [
    ReactiveFormsModule,
    PercentPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    GraficoBarras,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
  providers: [{ provide: MatDatepickerIntl, useClass: TextosDatepicker }],
})
export class Reportes implements OnInit {
  private readonly reporteService = inject(ReporteService);

  protected readonly rango = inject(FormBuilder).group({
    desde: [null as Date | null],
    hasta: [null as Date | null],
  });

  protected readonly indicadores = signal<Indicadores | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly columnasRanking = ['posicion', 'medico', 'atendidos'];

  // Etiquetas y valores ya separados para los gráficos (Chart.js los pide así).
  protected readonly etiquetasEspecialidad = computed(
    () => this.indicadores()?.porEspecialidad.map((fila) => fila.nombre) ?? [],
  );
  protected readonly valoresEspecialidad = computed(
    () => this.indicadores()?.porEspecialidad.map((fila) => Number(fila.cantidad)) ?? [],
  );
  protected readonly etiquetasSede = computed(
    () => this.indicadores()?.porSede.map((fila) => fila.nombre) ?? [],
  );
  protected readonly valoresSede = computed(
    () => this.indicadores()?.porSede.map((fila) => Number(fila.cantidad)) ?? [],
  );

  ngOnInit(): void {
    this.actualizar();
  }

  /** Pide los cuatro indicadores con el rango elegido (o todo el histórico). */
  protected actualizar(): void {
    const { desde, hasta } = this.rango.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.reporteService
      .indicadores({
        desde: desde ? aFechaApi(desde) : undefined,
        hasta: hasta ? aFechaApi(hasta) : undefined,
      })
      .subscribe({
        next: (indicadores) => {
          this.indicadores.set(indicadores);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  /** Quita el rango y vuelve a calcular sobre todo el histórico. */
  protected verTodo(): void {
    this.rango.reset({ desde: null, hasta: null });
    this.actualizar();
  }
}
