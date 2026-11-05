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
 *
 * Con qué se conecta: lo registra `app.config.ts` (`withInterceptors`), así
 * pasa por acá toda petición de los servicios de `core/servicios/`. Lee el
 * token de `SesionService` y la URL base de `environments/environment.ts`.
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
  // `peticion`: el pedido HTTP que armó algún servicio (por ejemplo
  //   TurnoService.crear). `siguiente`: la función que lo envía de verdad.
  // Un interceptor es una función que Angular ejecuta ANTES de cada pedido;
  // se registra en `app.config.ts` con `withInterceptors([tokenInterceptor])`.
  const sesion = inject(SesionService); // de acá sale el token guardado
  const router = inject(Router); // para mandar al login
  const avisos = inject(MatSnackBar); // para el cartel "tu sesión expiró"

  const token = sesion.token(); // el JWT, o null si no hay sesión
  // ¿El pedido va a NUESTRA API? (compara con la URL de environment.ts)
  const esDeLaApi = peticion.url.startsWith(environment.apiUrl);

  // Si hay token Y el pedido va a nuestra API: se agrega el encabezado
  // `Authorization: Bearer <token>`. Los pedidos en Angular no se pueden
  // modificar, por eso se hace una COPIA (`clone`) con el encabezado extra.
  // Si no hay token (por ejemplo en el login o el registro), sale tal cual.
  const conToken =
    token && esDeLaApi
      ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : peticion;

  // Se envía el pedido. `catchError` se ejecuta SOLO si la respuesta es un
  // error: funciona como el `catch` de un try/catch, pero para el pedido.
  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      // Solo se cierra la sesión si la petición llevaba token. Un 401 sin token
      // es, por ejemplo, un login con contraseña incorrecta: ese error lo
      // maneja la pantalla de login y no hay ninguna sesión que cerrar.
      //   - `error instanceof HttpErrorResponse`: es un error de la API;
      //   - `error.status === 401`: el backend dijo "no sé quién sos"
      //     (token vencido o inválido, lo responde verificarToken);
      //   - `conToken !== peticion`: este pedido sí llevaba token.
      if (error instanceof HttpErrorResponse && error.status === 401 && conToken !== peticion) {
        sesion.cerrar(); // borra token y usuario guardados
        avisos.open('Tu sesión expiró. Volvé a iniciar sesión.', 'Cerrar', { duration: 5000 });
        router.navigate(['/login']); // lleva al login (lo pide la consigna)
      }
      // En TODOS los casos el error se vuelve a lanzar (`throwError`), para
      // que la pantalla que hizo el pedido también se entere en su `error:`
      // y pueda mostrar el mensaje.
      return throwError(() => error);
    }),
  );
};
