/**
 * INTERCEPTOR DEL TOKEN
 * =====================
 *
 * Toda petición HTTP de la app pasa por acá antes de salir. Cumple la consigna
 * "las peticiones a endpoints protegidos deben enviar el token" sin que cada
 * servicio tenga que acordarse de agregarlo.
 *
 * Además cierra la sesión si el backend responde 401 a una petición que sí
 * llevaba token: significa que el token venció o dejó de ser válido.
 */

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionService } from '../servicios/sesion.service';

/**
 * Agrega `Authorization: Bearer <token>` a las peticiones dirigidas a la API.
 *
 * Solo a la API propia: si algún día la app llamara a otro servidor, no tiene
 * por qué recibir el token de la clínica.
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const avisos = inject(MatSnackBar);

  const token = sesion.token();
  const esDeLaApi = peticion.url.startsWith(environment.apiUrl);
  const conToken =
    token && esDeLaApi
      ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : peticion;

  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      // Solo se cierra la sesión si la petición llevaba token. Un 401 sin token
      // es, por ejemplo, un login con contraseña incorrecta: ese error lo
      // maneja la pantalla de login y no hay ninguna sesión que cerrar.
      if (error instanceof HttpErrorResponse && error.status === 401 && conToken !== peticion) {
        sesion.cerrar();
        avisos.open('Tu sesión expiró. Volvé a iniciar sesión.', 'Cerrar', { duration: 5000 });
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
