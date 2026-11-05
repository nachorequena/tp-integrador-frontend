/**
 * VALIDADORES DE FORMULARIO PROPIOS
 * =================================
 *
 * Los que Angular no trae. Replican reglas del backend para avisarle al
 * usuario ANTES de enviar, en el mismo campo donde está el problema.
 *
 * Con qué se conecta: `textoNoVacio` y `maxBytes` los usan casi todos los
 * formularios; `coincidenCampos`, `formulario-paciente` y
 * `paginas/paciente/mis-datos`; `salidaPosteriorAEntrada`,
 * `compartido/dialogo-rango`.
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

/**
 * Mismo patrón de email que usa el backend. `Validators.email` de Angular
 * acepta `usuario@dominio` sin punto, que el backend rechaza: con los dos
 * juntos, lo que pasa en el front también pasa en el back.
 */
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validador de GRUPO: exige que dos campos tengan el mismo valor.
 *
 * Lo usan "repetir contraseña" del formulario de paciente y de "Mis datos"
 * (la consigna pide validar que coincidan antes de enviar). Va en el grupo y
 * no en un campo porque depende de dos controles a la vez.
 *
 * El error se marca TAMBIÉN en el control de confirmación, para que su
 * `mat-error` lo muestre debajo del campo (Material solo muestra los errores
 * del control, no los del grupo).
 *
 * @param campo Nombre del control original (por ejemplo `password`).
 * @param confirmacion Nombre del control que lo repite (`repetirPassword`).
 * @returns El validador, que devuelve `{ noCoinciden: true }` si difieren.
 */
export function coincidenCampos(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const original = grupo.get(campo);
    const repetido = grupo.get(confirmacion);
    if (!original || !repetido) return null;

    const difieren = (original.value ?? '') !== (repetido.value ?? '');
    const erroresActuales = repetido.errors ?? {};

    if (difieren) {
      repetido.setErrors({ ...erroresActuales, noCoinciden: true });
      return { noCoinciden: true };
    }
    // Si ya coinciden, se quita solo este error y se conservan los demás.
    if ('noCoinciden' in erroresActuales) {
      const { noCoinciden: _quitado, ...resto } = erroresActuales;
      repetido.setErrors(Object.keys(resto).length > 0 ? resto : null);
    }
    return null;
  };
}

/**
 * Validador de GRUPO: exige que la hora de salida sea posterior a la de
 * entrada (formato `HH:MM`).
 *
 * Lo usa el formulario de rangos horarios de la agenda: la consigna pide
 * validarlo "antes de enviar". Las horas se comparan como texto porque
 * `HH:MM` con dos dígitos ordena igual que el reloj.
 *
 * @returns `{ horarioInvertido: true }` si la salida no es posterior.
 */
export const salidaPosteriorAEntrada: ValidatorFn = (
  grupo: AbstractControl,
): ValidationErrors | null => {
  const entrada: unknown = grupo.get('hora_entrada')?.value;
  const salida: unknown = grupo.get('hora_salida')?.value;
  if (typeof entrada !== 'string' || typeof salida !== 'string' || !entrada || !salida) {
    return null;
  }
  return salida > entrada ? null : { horarioInvertido: true };
};
