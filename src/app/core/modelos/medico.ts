/**
 * MODELO DE MÉDICO (LISTADO PÚBLICO)
 * ==================================
 *
 * Médico tal como lo devuelve `GET /medicos`: solo nombre, sede y
 * especialidades, sin otros datos personales (lo pide la consigna, porque ese
 * listado lo ven también los pacientes).
 *
 * Lo usan `MedicoService`, la solicitud de turno (paso "médico"), la agenda
 * del operador ("Nueva agenda") y la agenda del médico (sus especialidades).
 */

import { Especialidad } from './especialidad';

/** Un médico con sus especialidades. */
export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  /** Sede asignada al usuario. Puede atender en otras (ver su agenda). */
  id_sede: number | null;
  especialidades: Especialidad[];
}

/** Filtros opcionales de `GET /medicos`. */
export interface FiltrosMedico {
  id_especialidad?: number;
  id_sede?: number;
}
