/**
 * VALIDADORES DE FORMULARIO PROPIOS
 * =================================
 *
 * Los que Angular no trae. Replican reglas del backend para avisarle al
 * usuario ANTES de enviar, en el mismo campo donde está el problema.
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Exige que el texto no sea solo espacios.
 *
 * `Validators.required` da por válido `"   "`, pero el backend recorta los
 * espacios y lo rechaza como vacío. Sin esto, el error llegaría recién al
 * enviar y como un mensaje general, no en el campo.
 *
 * @returns `{ required: true }` (el mismo error que `Validators.required`, así
 *   la plantilla muestra un único mensaje de "obligatorio").
 */
export const textoNoVacio: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor: unknown = control.value;
  return typeof valor === 'string' && valor.trim() === '' ? { required: true } : null;
};

/**
 * Limita el largo en BYTES (UTF-8), no en caracteres.
 *
 * Existe por la contraseña: bcrypt ignora lo que pasa de 72 bytes y el backend
 * lo rechaza. Una tilde o una eñe ocupan 2 bytes, así que contar caracteres no
 * alcanza.
 *
 * @param maximo Cantidad máxima de bytes.
 * @returns Error `maxBytes` con el máximo permitido, o `null` si está bien.
 */
export function maxBytes(maximo: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: unknown = control.value;
    if (typeof valor !== 'string') return null;
    const bytes = new TextEncoder().encode(valor).length;
    return bytes > maximo ? { maxBytes: { maximo } } : null;
  };
}
