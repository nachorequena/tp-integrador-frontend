/**
 * PRUEBAS: utilidades de fecha
 *
 * Conversión entre el formato de la API ("YYYY-MM-DD") y el de pantalla
 * (dd/mm/aaaa), y el cálculo de edad de "Turnos del día".
 */

import { aDate, aFechaApi, calcularEdad, deFechaApi, deFechaHoraApi } from './adaptador-fecha';

describe('utilidades de fecha', () => {
  it('aFechaApi arma YYYY-MM-DD con ceros a la izquierda', () => {
    expect(aFechaApi(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('deFechaApi pasa a dd/mm/aaaa', () => {
    expect(deFechaApi('2026-11-05')).toBe('05/11/2026');
  });

  it('deFechaHoraApi corta los segundos', () => {
    expect(deFechaHoraApi('2026-11-05 14:30:59')).toBe('05/11/2026 14:30');
  });

  it('aDate no se corre un día por la zona horaria', () => {
    const fecha = aDate('2026-01-01');
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(0);
    expect(fecha.getDate()).toBe(1);
  });

  describe('calcularEdad', () => {
    const hoy = new Date(2026, 10, 5); // 5 de noviembre de 2026

    it('cuenta el cumpleaños de este año si ya pasó', () => {
      expect(calcularEdad('1990-03-10', hoy)).toBe(36);
    });

    it('resta uno si todavía no cumplió', () => {
      expect(calcularEdad('1990-12-10', hoy)).toBe(35);
    });

    it('el mismo día del cumpleaños ya cuenta', () => {
      expect(calcularEdad('1990-11-05', hoy)).toBe(36);
    });
  });
});
