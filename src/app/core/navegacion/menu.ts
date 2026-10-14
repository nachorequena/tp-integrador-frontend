/**
 * OPCIONES DEL MENÚ POR ROL
 * =========================
 *
 * Fuente única de las secciones de cada rol. De esta lista salen dos cosas:
 *   - las opciones que muestra el menú lateral según quién esté logueado;
 *   - las rutas hijas de `/admin`, `/medico`, `/operador` y `/paciente`
 *     (ver `app.routes.ts`).
 *
 * Tenerlas en un solo lugar evita que una opción del menú apunte a una ruta
 * que no existe, o que exista una ruta a la que el menú nunca lleva.
 *
 * Las opciones salen de los endpoints que el backend habilita para cada rol.
 * Todas son de semanas futuras, así que por ahora llevan a la pantalla "En
 * construcción" (lo permite la consigna de esta semana).
 */

import { Rol } from '../modelos/usuario';

/** Una opción del menú lateral. */
export interface OpcionMenu {
  /** Texto visible. */
  etiqueta: string;
  /** Nombre del ícono de Material Icons. */
  icono: string;
  /** Segmento de la ruta dentro de la sección del rol (`/paciente/<segmento>`). */
  segmento: string;
}

/** Opciones propias de cada rol, en el orden en que aparecen en el menú. */
export const MENU_POR_ROL: Record<Rol, OpcionMenu[]> = {
  paciente: [
    { etiqueta: 'Solicitar turno', icono: 'event_available', segmento: 'solicitar-turno' },
    { etiqueta: 'Mis turnos', icono: 'event_note', segmento: 'mis-turnos' },
    { etiqueta: 'Mi historial clínico', icono: 'medical_information', segmento: 'historial' },
  ],
  medico: [
    { etiqueta: 'Mi agenda', icono: 'calendar_month', segmento: 'agenda' },
    { etiqueta: 'Turnos del día', icono: 'today', segmento: 'turnos' },
    { etiqueta: 'Historial de pacientes', icono: 'folder_shared', segmento: 'historial' },
  ],
  operador: [
    { etiqueta: 'Agendas médicas', icono: 'calendar_month', segmento: 'agendas' },
    { etiqueta: 'Turnos de la sede', icono: 'event_note', segmento: 'turnos' },
    { etiqueta: 'Nuevo turno', icono: 'event_available', segmento: 'nuevo-turno' },
  ],
  admin: [
    { etiqueta: 'Sedes', icono: 'domain', segmento: 'sedes' },
    { etiqueta: 'Especialidades', icono: 'medical_services', segmento: 'especialidades' },
    { etiqueta: 'Coberturas', icono: 'health_and_safety', segmento: 'coberturas' },
    { etiqueta: 'Agendas médicas', icono: 'calendar_month', segmento: 'agendas' },
    { etiqueta: 'Auditoría', icono: 'manage_search', segmento: 'auditoria' },
    { etiqueta: 'Reportes', icono: 'bar_chart', segmento: 'reportes' },
  ],
};

/**
 * Arma la URL completa de una opción del menú.
 *
 * @param rol Rol dueño de la sección (es el primer segmento de la URL).
 * @param opcion Opción del menú.
 * @returns Por ejemplo `/paciente/mis-turnos`.
 */
export function rutaDeOpcion(rol: Rol, opcion: OpcionMenu): string {
  return `/${rol}/${opcion.segmento}`;
}
