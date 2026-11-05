/**
 * MODELO DE HISTORIAL CLÍNICO
 * ===========================
 *
 * Registro del historial clínico con los datos del turno que lo originó, tal
 * como lo devuelven `GET /historial/mio` (paciente) y
 * `GET /historial/paciente/:id` (médico: solo los turnos que atendió él).
 *
 * Lo usan `HistorialService` y las pantallas `paginas/paciente/historial` y
 * `paginas/medico/historial`, a través del componente `lista-historial`.
 */

/** Un registro del historial clínico. */
export interface RegistroHistorial {
  id: number;
  id_turno: number;
  id_medico: number;
  id_paciente: number;
  diagnostico: string;
  tratamiento: string | null;
  observaciones: string | null;
  /** `YYYY-MM-DD HH:MM:SS`. */
  fecha_registro: string;
  /** `YYYY-MM-DD` del turno atendido. */
  fecha_turno: string;
  hora_turno: string;
  medico: string;
  especialidad: string;
  sede: string;
}
