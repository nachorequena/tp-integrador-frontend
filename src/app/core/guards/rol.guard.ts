/**
 * GUARD DE ROL
 * ============
 *
 * Impide entrar a la sección de otro rol, aunque se escriba la URL a mano.
 * Va siempre DESPUÉS de `sesionGuard`: primero se pregunta "¿hay sesión?" y
 * recién después "¿es el rol correcto?", igual que en el backend
 * `verificarRol` va después de `verificarToken`.
 *
 * Esto es una comodidad para el usuario, no la seguridad real: cualquiera
 * puede modificar el código del navegador. Lo que de verdad protege los datos
 * es el backend, que valida el token y el rol en cada petición.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../modelos/usuario';
import { SesionService } from '../servicios/sesion.service';

/**
 * Deja pasar solo a los roles indicados. El resto va a "Acceso denegado".
 *
 * @param rolesPermitidos Roles que pueden entrar a la ruta.
 * @returns Un guard listo para usar en `canActivate`.
 */
export function rolGuard(...rolesPermitidos: Rol[]): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);

    const rol = sesion.rol();
    if (rol !== null && rolesPermitidos.includes(rol)) return true;
    return router.createUrlTree(['/acceso-denegado']);
  };
}
