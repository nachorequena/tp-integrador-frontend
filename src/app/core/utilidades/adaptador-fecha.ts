/**
 * ADAPTADOR DE FECHAS PARA EL DATEPICKER
 * ======================================
 *
 * El `mat-datepicker` delega en un "adaptador" cómo leer y escribir fechas.
 * El nativo de Material usa `Date.parse`, que entiende formatos en inglés
 * (`03/15/1990`) pero no el argentino: si el usuario escribe `15/03/1990` a
 * mano, lo toma como inválido. Este adaptador agrega el formato `dd/mm/aaaa`.
 *
 * También se exporta el helper que pasa una fecha al formato del backend.
 */

import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class AdaptadorFecha extends NativeDateAdapter {
  /**
   * Interpreta lo que el usuario escribe en el campo de fecha.
   *
   * @param valor Texto tipeado (`15/03/1990` o `15-3-1990`) o un valor ya parseado.
   * @returns La fecha, `null` si el campo está vacío, o una fecha inválida si
   *   el texto no es una fecha real (así el datepicker marca el error).
   */
  override parse(valor: unknown, formato?: object): Date | null {
    if (typeof valor === 'string') {
      const partes = valor.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (partes) {
        const [, dia, mes, anio] = partes.map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        // `new Date` acepta el 31/02 y lo convierte al 3 de marzo; si el día o
        // el mes cambiaron, la fecha tipeada no existía.
        const esReal = fecha.getDate() === dia && fecha.getMonth() === mes - 1;
        return esReal ? fecha : this.invalid();
      }
    }
    return super.parse(valor, formato);
  }

  /** Muestra las fechas en el campo como `dd/mm/aaaa`. */
  override format(fecha: Date, formatoVisual: object): string {
    // El calendario también pide textos como "mar 1990": esos se los deja
    // al adaptador nativo. Solo se cambia el formato del campo de texto.
    if ('day' in formatoVisual) return formatoDiaMesAnio(fecha);
    return super.format(fecha, formatoVisual);
  }
}

/** Formatea una fecha como `dd/mm/aaaa`. */
function formatoDiaMesAnio(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

/**
 * Convierte una fecha al formato que espera el backend: `YYYY-MM-DD`.
 *
 * No se usa `toISOString()` porque convierte a UTC: el datepicker entrega la
 * medianoche local, y en un navegador con zona horaria al este de Greenwich
 * esa medianoche cae en el día anterior en UTC. Leyendo día, mes y año locales
 * se manda exactamente la fecha que eligió el usuario, esté donde esté.
 *
 * @param fecha Fecha elegida en el datepicker.
 * @returns La misma fecha como `YYYY-MM-DD`.
 */
export function aFechaApi(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Convierte una fecha de la API (`YYYY-MM-DD`) al formato argentino.
 *
 * Se trabaja sobre el texto y no con `new Date(...)`, porque `new Date` lee
 * `"1990-03-15"` como UTC y en Argentina mostraría el 14 de marzo.
 *
 * @param fechaApi Fecha tal como la manda el backend.
 * @returns La fecha como `dd/mm/aaaa`.
 */
export function deFechaApi(fechaApi: string): string {
  const [anio, mes, dia] = fechaApi.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Convierte una fecha de la API (`YYYY-MM-DD`) en un `Date` a la medianoche
 * LOCAL, para cargarla en un datepicker.
 *
 * Es la inversa de `aFechaApi`. No se usa `new Date('YYYY-MM-DD')`, que la lee
 * como UTC y en Argentina daría el día anterior.
 *
 * @param fechaApi Fecha tal como la manda el backend.
 * @returns El `Date` correspondiente a ese día.
 */
export function aDate(fechaApi: string): Date {
  const [anio, mes, dia] = fechaApi.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Fecha de hoy en el formato de la API. Es el valor por defecto de los filtros
 * de fecha (agenda del médico, turnos del día, agenda del operador).
 *
 * @returns Hoy como `YYYY-MM-DD`, según el reloj de esta computadora.
 */
export function hoyApi(): string {
  return aFechaApi(new Date());
}

/**
 * Calcula la edad en años cumplidos a partir de la fecha de nacimiento.
 *
 * La usa la tabla de turnos del médico ("edad calculada a partir de la fecha
 * de nacimiento", dice la consigna). Resta los años y le saca uno si este año
 * todavía no llegó el cumpleaños.
 *
 * @param fechaNacimiento Fecha `YYYY-MM-DD` de la API.
 * @param hoy Fecha de referencia (por defecto, hoy). Existe para poder probarla.
 * @returns La edad en años.
 */
export function calcularEdad(fechaNacimiento: string, hoy: Date = new Date()): number {
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
  let edad = hoy.getFullYear() - anio;
  const yaCumplio =
    hoy.getMonth() + 1 > mes || (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia);
  if (!yaCumplio) edad--;
  return edad;
}

/**
 * Pasa una fecha y hora del backend (`YYYY-MM-DD HH:MM:SS`) al formato local
 * `dd/mm/aaaa HH:MM`. La usan la auditoría y la campana de notificaciones.
 *
 * @param fechaHora Texto tal como lo manda la API (columnas `datetime`).
 * @returns Por ejemplo `04/11/2026 22:46`.
 */
export function deFechaHoraApi(fechaHora: string): string {
  const [fecha, hora = ''] = fechaHora.split(' ');
  return `${deFechaApi(fecha)} ${hora.slice(0, 5)}`.trim();
}
