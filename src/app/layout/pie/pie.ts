/**
 * PIE DE PÁGINA (FOOTER)
 * ======================
 *
 * Datos de contacto de la clínica: dirección de la sede, redes sociales,
 * teléfono y correo, como pide la consigna. Los datos salen de
 * `core/config/clinica.ts` (ver ahí por qué no se piden a la API).
 */

import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DATOS_CLINICA } from '../../core/config/clinica';

@Component({
  selector: 'app-pie',
  imports: [MatIconModule],
  templateUrl: './pie.html',
  styleUrl: './pie.scss',
})
export class Pie {
  protected readonly clinica = DATOS_CLINICA;
  protected readonly anio = new Date().getFullYear();
}
