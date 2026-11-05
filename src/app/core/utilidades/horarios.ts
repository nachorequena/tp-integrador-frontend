/**
 * HORARIOS DE LA GRILLA DE TURNOS
 * ===============================
 *
 * Los turnos duran 30 minutos (lo define el backend en
 * `disponibilidad.service.ts`, constante `DURACION_TURNO`). Para que los
 * rangos de agenda calcen siempre con esa grilla, el formulario de agenda
 * (`compartido/dialogo-rango`) ofrece las horas en un `mat-select` cada media
 * hora en lugar de un campo libre: así es imposible cargar una entrada a las
 * 08:10 que dejaría turnos "corridos".
 */

/** Primera hora que se ofrece en el selector. */
const PRIMERA_HORA = 6;

/** Última hora que se ofrece en el selector (inclusive). */
const ULTIMA_HORA = 23;

/**
 * Horas `HH:MM` cada 30 minutos entre las 06:00 y las 23:00.
 *
 * Se calcula una sola vez al cargar el módulo; es una lista fija.
 */
export const HORAS_DE_LA_GRILLA: readonly string[] = (() => {
  const horas: string[] = [];
  for (let hora = PRIMERA_HORA; hora <= ULTIMA_HORA; hora++) {
    const hh = String(hora).padStart(2, '0');
    horas.push(`${hh}:00`);
    if (hora < ULTIMA_HORA) horas.push(`${hh}:30`);
  }
  return horas;
})();
