/**
 * PRUEBAS: mensajeDeError
 *
 * Verifica los tres casos que traduce la función que usan todas las
 * pantallas para mostrar errores de la API.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './mensaje-error';

describe('mensajeDeError', () => {
  it('muestra el mensaje del backend (campo "estado" del formato uniforme)', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { codigo: 409, estado: 'Ese horario ya fue tomado', datos: null },
    });
    expect(mensajeDeError(error)).toBe('Ese horario ya fue tomado');
  });

  it('avisa que el backend está caído cuando el status es 0', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(mensajeDeError(error)).toContain('No se pudo conectar con el servidor');
  });

  it('usa un texto genérico con el código si el backend no mandó mensaje', () => {
    const error = new HttpErrorResponse({ status: 502, error: null });
    expect(mensajeDeError(error)).toBe('Error 502 al comunicarse con el servidor.');
  });

  it('cubre errores que no son HTTP', () => {
    expect(mensajeDeError(new Error('x'))).toBe('Ocurrió un error inesperado.');
  });
});
