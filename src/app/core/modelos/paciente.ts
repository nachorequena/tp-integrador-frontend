/**
 * MODELOS DE PACIENTE
 * ===================
 *
 * - `PacienteEncontrado`: resultado de la búsqueda `GET /pacientes?busqueda=`
 *   (operador y médico).
 * - `DatosMisDatos`: cuerpo de `PUT /pacientes/mis-datos`, con los únicos
 *   cuatro campos que la consigna deja modificar al paciente.
 *
 * Lo usan `PacienteService`, el `buscador-pacientes`, la solicitud de turno
 * del operador y la pantalla `paginas/paciente/mis-datos`.
 */

/** Un paciente encontrado por DNI o apellido. */
export interface PacienteEncontrado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  /** `YYYY-MM-DD`. */
  fecha_nacimiento: string;
  id_cobertura: number | null;
  /** Nombre de la cobertura, para el resumen del turno. */
  cobertura: string | null;
}

/** Cuerpo de `PUT /pacientes/mis-datos`. */
export interface DatosMisDatos {
  email: string;
  telefono: string;
  id_cobertura: number;
  /** Opcional: si no se manda, el backend conserva la contraseña actual. */
  password?: string;
}
