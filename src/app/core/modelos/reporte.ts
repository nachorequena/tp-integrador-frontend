/**
 * MODELOS DE REPORTES
 * ===================
 *
 * Respuestas de los cuatro endpoints de `/reportes`. Los usa `ReporteService`
 * y la pantalla `paginas/admin/reportes`.
 */

/** Fila de "turnos por especialidad" y "turnos por sede". */
export interface ConteoTurnos {
  id: number;
  nombre: string;
  cantidad: number;
}

/** Fila del ranking de médicos por turnos atendidos. */
export interface MedicoRanking {
  id_medico: number;
  medico: string;
  atendidos: number;
}

/** Resultado de la tasa de cancelación. */
export interface TasaCancelacion {
  total: number;
  cancelados: number;
  /** Entre 0 y 1 (se muestra con el pipe `percent`). */
  tasa: number;
}

/** Los cuatro indicadores juntos, como los muestra el dashboard. */
export interface Indicadores {
  porEspecialidad: ConteoTurnos[];
  porSede: ConteoTurnos[];
  ranking: MedicoRanking[];
  cancelacion: TasaCancelacion;
}

/** Rango de fechas opcional de los reportes (`YYYY-MM-DD`, inclusivo). */
export interface RangoFechas {
  desde?: string;
  hasta?: string;
}
