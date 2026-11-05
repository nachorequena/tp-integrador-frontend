/**
 * MODELO DE COBERTURA
 * ===================
 *
 * Una obra social o prepaga (tabla `cobertura`), tal como la devuelven
 * `GET /coberturas/disponibles` (público, lo usa el registro) y
 * `GET /coberturas` (CRUD del administrador).
 *
 * Lo usan `CoberturaService`, la pantalla `paginas/admin/coberturas`, el
 * formulario de paciente, "Mis datos" y el resumen de la solicitud de turno.
 */

/** Fila de la tabla `cobertura`. */
export interface Cobertura {
  id: number;
  nombre: string;
}

/** Cuerpo de `POST /coberturas` y `PUT /coberturas/:id`. */
export type DatosCobertura = Omit<Cobertura, 'id'>;
