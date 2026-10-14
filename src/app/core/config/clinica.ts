/**
 * DATOS DE CONTACTO DE LA CLÍNICA
 * ===============================
 *
 * Los muestra el footer. Están escritos acá y no se piden a la API porque el
 * footer se ve también SIN sesión, y `GET /sedes` es exclusivo del admin: un
 * visitante recibiría 401.
 *
 * Dirección y teléfono son los de la Sede Centro (id 1) del script de la base
 * `clinica_ampliada.sql`. La base no tiene correo ni redes sociales de la
 * clínica, así que esos dos datos son de ejemplo.
 */

/** Una red social de la clínica. */
export interface RedSocial {
  nombre: string;
  usuario: string;
}

export const DATOS_CLINICA = {
  nombre: 'Clínica Virtual',
  sede: 'Sede Centro',
  direccion: 'San Martín 123',
  telefono: '3424000001',
  /** De ejemplo: la base no guarda un correo de la clínica. */
  correo: 'contacto@clinicavirtual.com',
  /** De ejemplo: la base no guarda redes sociales. */
  redes: [
    { nombre: 'Instagram', usuario: '@clinicavirtual' },
    { nombre: 'Facebook', usuario: '/clinicavirtual' },
  ] satisfies RedSocial[],
};
