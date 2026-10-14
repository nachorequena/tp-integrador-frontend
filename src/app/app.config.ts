/**
 * CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
 * =====================================
 *
 * Los "providers" que quedan disponibles para toda la app: el router, el
 * cliente HTTP con su interceptor y el manejo de fechas del datepicker.
 */

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
} from '@angular/material/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token.interceptor';
import { AdaptadorFecha } from './core/utilidades/adaptador-fecha';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // `withComponentInputBinding` pasa los query params y los `data` de la
    // ruta directo a los inputs del componente (`volver` y `dni` en el login,
    // `titulo` en "En construcción"), sin inyectar `ActivatedRoute`.
    provideRouter(routes, withComponentInputBinding()),

    // Todas las peticiones pasan por el interceptor que agrega el token.
    provideHttpClient(withInterceptors([tokenInterceptor])),

    // Fechas en español de Argentina (nombres de meses, lunes como primer día)
    // y el adaptador que entiende `dd/mm/aaaa` al tipear.
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    { provide: DateAdapter, useClass: AdaptadorFecha },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
};
