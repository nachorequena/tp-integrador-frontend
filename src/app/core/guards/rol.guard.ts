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
 *
 * Con qué se conecta: lo usa `app.routes.ts` en cada sección de rol
 * (`seccionDeRol`), después de `sesionGuard`. Lee el rol de `SesionService` y,
 * si no corresponde, manda a `paginas/acceso-denegado`.
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
  // Es una "fábrica": `rolGuard('paciente')` DEVUELVE el guard (la función de
  // abajo) configurado para ese rol. Así un solo archivo sirve para los cuatro.
  // `...rolesPermitidos` junta todos los roles que se pasen en un array.
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);

    const rol = sesion.rol(); // rol del usuario logueado (o null sin sesión)
    // Pasa si hay rol Y está en la lista de permitidos. Ejemplo: en
    // /paciente/solicitar-turno, rolesPermitidos = ['paciente']; un médico
    // que escriba esa URL a mano no está en la lista → no pasa.
    if (rol !== null && rolesPermitidos.includes(rol)) return true;
    // No pasa: redirige a la pantalla "Acceso denegado".
    return router.createUrlTree(['/acceso-denegado']);
  };
}
