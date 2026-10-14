/**
 * RUTAS DE LA APLICACIÓN
 * ======================
 *
 * Mapa completo de URLs → pantallas, con su protección:
 *
 *   /                      inicio (con y sin sesión)
 *   /login, /registro      solo SIN sesión (`invitadoGuard`)
 *   /perfil                cualquier usuario CON sesión (`sesionGuard`)
 *   /admin/...             } una sección por rol, protegidas por
 *   /medico/...            } `sesionGuard` (¿hay sesión?) y después por
 *   /operador/...          } `rolGuard` (¿es el rol de esta sección?)
 *   /paciente/...          }
 *   /acceso-denegado       a donde rebota `rolGuard`
 *   **                     cualquier otra URL → "No encontrada"
 *
 * El orden importa: Angular usa la PRIMERA ruta que coincide, por eso el
 * comodín `**` va último.
 *
 * Las pantallas se cargan con `loadComponent` (carga diferida): el código de
 * cada una se descarga recién cuando alguien entra, y la app arranca más rápido.
 */

import { Route, Routes } from '@angular/router';
import { rolGuard } from './core/guards/rol.guard';
import { invitadoGuard, sesionGuard } from './core/guards/sesion.guard';
import { MENU_POR_ROL } from './core/navegacion/menu';
import { Rol } from './core/modelos/usuario';

/**
 * Arma la sección de rutas de un rol a partir de sus opciones de menú.
 *
 * Cada opción de `MENU_POR_ROL` se convierte en una ruta hija. Por ahora todas
 * muestran "En construcción"; cuando una semana implemente su pantalla, se
 * reemplaza el componente de esa ruta.
 *
 * @param rol Rol dueño de la sección; también es el prefijo de la URL.
 * @returns La ruta `/<rol>` con sus hijas y sus guards.
 */
function seccionDeRol(rol: Rol): Route {
  const opciones = MENU_POR_ROL[rol];
  return {
    path: rol,
    canActivate: [sesionGuard, rolGuard(rol)],
    children: [
      // `/paciente` sola lleva a la primera opción de la sección.
      { path: '', pathMatch: 'full', redirectTo: opciones[0].segmento },
      ...opciones.map(
        (opcion): Route => ({
          path: opcion.segmento,
          title: `${opcion.etiqueta} | Clínica Virtual`,
          data: { titulo: opcion.etiqueta },
          loadComponent: () =>
            import('./paginas/en-construccion/en-construccion').then((m) => m.EnConstruccion),
        }),
      ),
    ],
  };
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Clínica Virtual',
    loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'login',
    title: 'Iniciar sesión | Clínica Virtual',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./paginas/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Registro | Clínica Virtual',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./paginas/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'perfil',
    title: 'Mi perfil | Clínica Virtual',
    canActivate: [sesionGuard],
    loadComponent: () => import('./paginas/perfil/perfil').then((m) => m.Perfil),
  },
  seccionDeRol('admin'),
  seccionDeRol('medico'),
  seccionDeRol('operador'),
  seccionDeRol('paciente'),
  {
    path: 'acceso-denegado',
    title: 'Acceso denegado | Clínica Virtual',
    loadComponent: () =>
      import('./paginas/acceso-denegado/acceso-denegado').then((m) => m.AccesoDenegado),
  },
  {
    path: '**',
    title: 'Página no encontrada | Clínica Virtual',
    loadComponent: () =>
      import('./paginas/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
  },
];
