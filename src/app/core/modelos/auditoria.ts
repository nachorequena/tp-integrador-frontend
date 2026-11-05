/**
 * MODELO DE AUDITORÍA
 * ===================
 *
 * Entrada del registro de acciones sensibles (`GET /auditoria`, tabla
 * `log_auditoria`). Lo usan `AuditoriaService` y la pantalla
 * `paginas/admin/auditoria`.
 */

/** Las tres acciones que registra el backend. */
export type AccionAuditoria = 'ALTA' | 'BAJA' | 'MODIFICACION';

/** Entidades que el backend audita (y por las que se puede filtrar). */
export const ENTIDADES_AUDITADAS = [
  'usuario',
  'sede',
  'especialidad',
  'cobertura',
  'agenda',
  'turno',
] as const;

/** Una entrada del log. */
export interface EntradaAuditoria {
  id: number;
  id_usuario: number;
  /** "Apellido, Nombre" de quien hizo la acción. */
  usuario: string;
  accion: AccionAuditoria;
  entidad: string;
  id_entidad: number | null;
  detalle: string | null;
  /** `YYYY-MM-DD HH:MM:SS`. */
  fecha: string;
}

/** Filtros de `GET /auditoria` (todos opcionales). */
export interface FiltrosAuditoria {
  /** Apellido, nombre o DNI de quien hizo la acción. */
  usuario?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}
