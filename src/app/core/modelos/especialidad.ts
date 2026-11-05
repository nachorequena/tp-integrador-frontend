/**
 * MODELO DE ESPECIALIDAD
 * ======================
 *
 * Especialidad médica (tabla `especialidad`). Ojo: el campo es `descripcion`,
 * no `nombre`, igual que en la base.
 *
 * Lo usan `EspecialidadService`, la pantalla `paginas/admin/especialidades`,
 * el alta de médicos (sus especialidades) y la solicitud de turno.
 */

/** Una especialidad médica. */
export interface Especialidad {
  id: number;
  descripcion: string;
}

/** Cuerpo de `POST /especialidades` y `PUT /especialidades/:id`. */
export type DatosEspecialidad = Omit<Especialidad, 'id'>;
