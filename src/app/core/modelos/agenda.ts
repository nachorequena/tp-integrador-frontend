/**
 * MODELO DE AGENDA
 * ================
 *
 * Rango horario en el que un médico atiende una especialidad en una sede, un
 * día puntual (tabla `agenda`). Las horas son texto "HH:MM", igual que en la
 * base.
 *
 * Lo usan `AgendaService`, la pantalla `paginas/agendas` (médico, operador y
 * administrador) y el diálogo `dialogo-rango`.
 */

/** Un rango de agenda con los nombres resueltos por el backend. */
export interface Agenda {
  id: number;
  hora_entrada: string;
  hora_salida: string;
  /** `YYYY-MM-DD`. */
  fecha: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
  /** "Apellido, Nombre". */
  medico: string;
  especialidad: string;
  sede: string;
  /** Si es mayor que 0, el backend rechaza la baja: la interfaz la deshabilita. */
  turnos_confirmados: number;
  /** Turnos de cualquier estado (los atendidos/cancelados también bloquean la baja). */
  turnos_totales: number;
}

/** Cuerpo de `POST /agendas` y `PUT /agendas/:id`. */
export interface DatosAgenda {
  hora_entrada: string;
  hora_salida: string;
  fecha: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

/** Filtros opcionales de `GET /agendas` (se combinan con AND). */
export interface FiltrosAgenda {
  id_medico?: number;
  id_sede?: number;
  fecha?: string;
}
