/**
 * PRUEBAS: validadores propios de los formularios
 *
 * textoNoVacio (nota del turno), maxBytes (contraseña), coincidenCampos
 * ("repetir contraseña") y salidaPosteriorAEntrada (rangos de agenda).
 */

import { FormControl, FormGroup } from '@angular/forms';
import {
  coincidenCampos,
  maxBytes,
  salidaPosteriorAEntrada,
  textoNoVacio,
} from './validadores';

describe('validadores', () => {
  it('textoNoVacio rechaza un texto de solo espacios', () => {
    expect(textoNoVacio(new FormControl('   '))).toEqual({ required: true });
    expect(textoNoVacio(new FormControl('Control anual'))).toBeNull();
  });

  it('maxBytes cuenta bytes UTF-8 y no caracteres', () => {
    const validar = maxBytes(4);
    expect(validar(new FormControl('abcd'))).toBeNull();
    // "ñ" ocupa 2 bytes: "abcñ" son 4 caracteres pero 5 bytes.
    expect(validar(new FormControl('abcñ'))).toEqual({ maxBytes: { maximo: 4 } });
  });

  it('coincidenCampos marca el error en el campo de confirmación', () => {
    const grupo = new FormGroup(
      { password: new FormControl('secreta1'), repetir: new FormControl('otra') },
      { validators: coincidenCampos('password', 'repetir') },
    );
    expect(grupo.hasError('noCoinciden')).toBe(true);
    expect(grupo.get('repetir')?.hasError('noCoinciden')).toBe(true);

    grupo.get('repetir')?.setValue('secreta1');
    expect(grupo.valid).toBe(true);
  });

  it('salidaPosteriorAEntrada rechaza un rango invertido o vacío', () => {
    const rango = (entrada: string, salida: string) =>
      new FormGroup({ hora_entrada: new FormControl(entrada), hora_salida: new FormControl(salida) });

    expect(salidaPosteriorAEntrada(rango('08:00', '12:00'))).toBeNull();
    expect(salidaPosteriorAEntrada(rango('12:00', '08:00'))).toEqual({ horarioInvertido: true });
    expect(salidaPosteriorAEntrada(rango('09:00', '09:00'))).toEqual({ horarioInvertido: true });
  });
});
