/**
 * OPCIONES DEL MENÚ POR ROL
 * =========================
 *
 * Fuente única de las secciones de cada rol. De esta lista salen tres cosas:
 *   - las opciones que muestra el menú lateral (`layout/menu-lateral`) según
 *     quién esté logueado;
 *   - los accesos directos de la pantalla de inicio (`paginas/inicio`);
 *   - las rutas hijas de `/admin`, `/medico`, `/operador` y `/paciente`, con
 *     la pantalla que carga cada una (ver `seccionDeRol` en `app.routes.ts`).
 *
 * Tenerlas en un solo lugar evita que una opción del menú apunte a una ruta
 * que no existe, o que exista una ruta a la que el menú nunca lleva. Como
 * todas las rutas de un rol cuelgan de `/<rol>` con su guard, una URL escrita
 * a mano por otro rol termina en "Acceso denegado".
 *
 * Varias opciones cargan la MISMA pantalla en distintos roles (la agenda, los
 * turnos del día, la solicitud de turno): la pantalla mira el rol de la sesión
 * y se adapta. Así no hay pantallas duplicadas, como pide la consigna.
 */

import { Type } from '@angular/core';
import { Rol } from '../modelos/usuario';

/** Una opción del menú lateral. */
export interface OpcionMenu {
  /** Texto visible. */
  etiqueta: string;
  /** Nombre del ícono de Material Icons. */
  icono: string;
  /** Segmento de la ruta dentro de la sección del rol (`/paciente/<segmento>`). */
  segmento: string;
  /**
   * Carga diferida de la pantalla: el código se descarga recién cuando
   * alguien entra a la opción. Lo usa `loadComponent` en `app.routes.ts`.
   */
  cargar: () => Promise<Type<unknown>>;
}

// ── Cargadores de las pantallas ──────────────────────────────────────────────
// Cada uno es un `import()` dinámico: Angular genera un archivo aparte por
// pantalla y lo baja solo cuando hace falta.

const agendas = () => import('../../paginas/agendas/agendas').then((m) => m.Agendas);
const turnosDelDia = () =>
  import('../../paginas/turnos-del-dia/turnos-del-dia').then((m) => m.TurnosDelDia);
const nuevoTurno = () =>
  import('../../paginas/nuevo-turno/nuevo-turno').then((m) => m.NuevoTurno);

/** Opciones propias de cada rol, en el orden en que aparecen en el menú. */
export const MENU_POR_ROL: Record<Rol, OpcionMenu[]> = {
  paciente: [
    { etiqueta: 'Solicitar turno', icono: 'event_available', segmento: 'solicitar-turno', cargar: nuevoTurno },
    {
      etiqueta: 'Mis turnos',
      icono: 'event_note',
      segmento: 'mis-turnos',
      cargar: () => import('../../paginas/paciente/mis-turnos/mis-turnos').then((m) => m.MisTurnos),
    },
    {
      etiqueta: 'Mi historial clínico',
      icono: 'medical_information',
      segmento: 'historial',
      cargar: () =>
        import('../../paginas/paciente/historial/historial').then((m) => m.HistorialPaciente),
    },
    {
      etiqueta: 'Mis datos personales',
      icono: 'manage_accounts',
      segmento: 'mis-datos',
      cargar: () => import('../../paginas/paciente/mis-datos/mis-datos').then((m) => m.MisDatos),
    },
  ],
  medico: [
    { etiqueta: 'Mi agenda', icono: 'calendar_month', segmento: 'agenda', cargar: agendas },
    { etiqueta: 'Turnos del día', icono: 'today', segmento: 'turnos', cargar: turnosDelDia },
    {
      etiqueta: 'Historial de pacientes',
      icono: 'folder_shared',
      segmento: 'historial',
      cargar: () =>
        import('../../paginas/medico/historial/historial').then((m) => m.HistorialMedico),
    },
  ],
  operador: [
    { etiqueta: 'Agendas médicas', icono: 'calendar_month', segmento: 'agendas', cargar: agendas },
    { etiqueta: 'Turnos de la sede', icono: 'event_note', segmento: 'turnos', cargar: turnosDelDia },
    { etiqueta: 'Nuevo turno', icono: 'event_available', segmento: 'nuevo-turno', cargar: nuevoTurno },
    {
      etiqueta: 'Pacientes',
      icono: 'group_add',
      segmento: 'pacientes',
      cargar: () =>
        import('../../paginas/operador/pacientes/pacientes').then((m) => m.Pacientes),
    },
  ],
  admin: [
    {
      etiqueta: 'Sedes',
      icono: 'domain',
      segmento: 'sedes',
      cargar: () => import('../../paginas/admin/sedes/sedes').then((m) => m.Sedes),
    },
    {
      etiqueta: 'Especialidades',
      icono: 'medical_services',
      segmento: 'especialidades',
      cargar: () =>
        import('../../paginas/admin/especialidades/especialidades').then((m) => m.Especialidades),
    },
    {
      etiqueta: 'Coberturas',
      icono: 'health_and_safety',
      segmento: 'coberturas',
      cargar: () => import('../../paginas/admin/coberturas/coberturas').then((m) => m.Coberturas),
    },
    {
      etiqueta: 'Usuarios',
      icono: 'group',
      segmento: 'usuarios',
      cargar: () => import('../../paginas/admin/usuarios/usuarios').then((m) => m.Usuarios),
    },
    { etiqueta: 'Agendas médicas', icono: 'calendar_month', segmento: 'agendas', cargar: agendas },
    {
      etiqueta: 'Auditoría',
      icono: 'manage_search',
      segmento: 'auditoria',
      cargar: () => import('../../paginas/admin/auditoria/auditoria').then((m) => m.Auditoria),
    },
    {
      etiqueta: 'Reportes',
      icono: 'bar_chart',
      segmento: 'reportes',
      cargar: () => import('../../paginas/admin/reportes/reportes').then((m) => m.Reportes),
    },
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
