/**
 * GUARDS DE SESIÓN
 * ================
 *
 * Deciden si se puede entrar a una ruta según haya o no una sesión iniciada.
 * Corren ANTES de cargar la pantalla, así que también protegen las URLs
 * escritas a mano en la barra de direcciones.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';

/**
 * Deja pasar solo con sesión iniciada. Sin sesión, redirige al login.
 *
 * Se guarda la URL pedida en `?volver=` para que, después de iniciar sesión,
 * el usuario llegue a donde quería ir y no a la pantalla principal.
 */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  if (sesion.haySesion()) return true;
  return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

/**
 * Deja pasar solo SIN sesión (login y registro). Con sesión, manda al inicio.
 *
 * No tiene sentido mostrarle el formulario de login a alguien que ya entró, y
 * registrarse estando logueado crearía una segunda cuenta por error.
 */
export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  return sesion.haySesion() ? router.createUrlTree(['/']) : true;
};
