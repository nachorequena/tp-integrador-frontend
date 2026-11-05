/**
 * MODELO DE TURNO
 * ===============
 *
 * Turno tal como lo devuelven los listados de `/turnos` (con los nombres y el
 * resumen del historial ya resueltos por el backend), más los cuerpos que se
 * envían para pedirlo y atenderlo, y los horarios libres de `/disponibilidad`.
 *
 * Lo usan `TurnoService`, `DisponibilidadService` y las pantallas
 * `paginas/nuevo-turno`, `paginas/turnos-del-dia` y `paginas/paciente/mis-turnos`.
 */

/** Estados posibles de un turno, tal cual están en la columna `estado`. */
export type EstadoTurno = 'confirmado' | 'cancelado' | 'atendido';

/** Texto legible de cada estado, para los chips de la interfaz. */
export const NOMBRE_ESTADO: Record<EstadoTurno, string> = {
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  atendido: 'Atendido',
};

/** Un turno con todos sus datos para mostrar. */
export interface Turno {
  id: number;
  nota: string | null;
  id_agenda: number;
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** `HH:MM`. */
  hora: string;
  id_paciente: number;
  id_cobertura: number;
  estado: EstadoTurno;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
  /** "Apellido, Nombre" del médico. */
  medico: string;
  especialidad: string;
  sede: string;
  /** "Apellido, Nombre" del paciente. */
  paciente: string;
  dni_paciente: string;
  /** `YYYY-MM-DD`: con esto la pantalla del médico calcula la edad. */
  fecha_nacimiento_paciente: string;
  cobertura: string;
  /** Resumen del historial clínico; `null` si el turno no tiene. */
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
}

/** Cuerpo de `POST /turnos`. */
export interface DatosNuevoTurno {
  id_especialidad: number;
  id_sede: number;
  id_medico: number;
  fecha: string;
  hora: string;
  nota: string;
  /** Solo lo manda el operador: es el paciente al que le saca el turno. */
  id_paciente?: number;
}

/** Cuerpo de `PATCH /turnos/:id/atender` (historial clínico del turno). */
export interface DatosAtencion {
  diagnostico: string;
  tratamiento?: string;
  observaciones?: string;
}

/** Médico, especialidad y sede para consultar la disponibilidad. */
export interface ConsultaDisponibilidad {
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

/** Un horario libre que devuelve `GET /disponibilidad/horarios`. */
export interface HorarioLibre {
  hora: string;
  id_agenda: number;
}
