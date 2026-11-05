/**
 * GRÁFICO DE BARRAS
 * =================
 *
 * Envoltorio mínimo de Chart.js (la librería de gráficos elegida por el grupo;
 * la consigna pide indicar cuál se usó en el README) para dibujar un gráfico
 * de barras a partir de etiquetas y valores.
 *
 * Lo usa `paginas/admin/reportes` para "turnos por especialidad" y "turnos
 * por sede".
 *
 * Cómo funciona: Chart.js dibuja sobre un `<canvas>`. Un `effect` vuelve a
 * crear el gráfico cada vez que cambian los inputs (por ejemplo, al cambiar
 * el rango de fechas del dashboard), destruyendo el anterior: si no se
 * destruye, Chart.js deja el viejo enganchado al canvas y da error.
 */

import {
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from 'chart.js';

// Chart.js es "tree-shakeable": se registran solo las piezas que usa un
// gráfico de barras, así el bundle no carga líneas, tortas ni radares.
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

@Component({
  selector: 'app-grafico-barras',
  template: `
    <!-- La altura la fija el contenedor: Chart.js ocupa todo su espacio. -->
    <div class="contenedor-grafico">
      <canvas #lienzo role="img" [attr.aria-label]="titulo()"></canvas>
    </div>
  `,
  styles: `
    .contenedor-grafico {
      position: relative;
      height: 280px;
    }
  `,
})
export class GraficoBarras implements OnDestroy {
  /** Texto de cada barra (por ejemplo, el nombre de la especialidad). */
  readonly etiquetas = input.required<string[]>();

  /** Altura de cada barra, en el mismo orden que `etiquetas`. */
  readonly valores = input.required<number[]>();

  /** Descripción para lectores de pantalla y nombre de la serie. */
  readonly titulo = input('Gráfico');

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico: Chart<'bar'> | null = null;

  constructor() {
    effect(() => this.dibujar(this.etiquetas(), this.valores()));
  }

  ngOnDestroy(): void {
    this.grafico?.destroy();
  }

  /**
   * (Re)dibuja el gráfico con los datos actuales.
   *
   * @param etiquetas Etiquetas del eje X.
   * @param valores Valores del eje Y.
   */
  private dibujar(etiquetas: string[], valores: number[]): void {
    this.grafico?.destroy();

    // Chart.js necesita un color concreto, no una variable CSS. Leer
    // `--mat-sys-primary` directo no sirve: Material la define con
    // `light-dark(...)`, que Chart.js no entiende y pinta negro. Por eso se le
    // pide al navegador que la resuelva usándola como `color` del canvas y
    // leyendo el valor final (un `rgb(...)`).
    const canvas = this.lienzo().nativeElement;
    canvas.style.color = 'var(--mat-sys-primary)';
    const color = getComputedStyle(canvas).color || '#006a6a';

    this.grafico = new Chart(this.lienzo().nativeElement, {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [{ label: this.titulo(), data: valores, backgroundColor: color, borderRadius: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Solo números enteros en el eje: no existe "1,5 turnos".
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }
}
