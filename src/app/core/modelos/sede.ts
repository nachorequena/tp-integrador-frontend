/**
 * MODELO DE SEDE
 * ==============
 *
 * Sucursal de la clínica, tal como la devuelve `GET /sedes` (tabla `sede`).
 *
 * Lo usan `SedeService` (CRUD del administrador), la pantalla
 * `paginas/admin/sedes` y todos los selectores de sede (agenda, turnos,
 * usuarios, solicitud de turno).
 */

/** Una sede de la clínica. */
export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

/** Cuerpo de `POST /sedes` y `PUT /sedes/:id`. */
export type DatosSede = Omit<Sede, 'id'>;
