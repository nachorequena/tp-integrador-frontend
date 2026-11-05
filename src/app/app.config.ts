/**
 * CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
 * =====================================
 *
 * Los "providers" que quedan disponibles para toda la app: el router, el
 * cliente HTTP con su interceptor, el idioma de los pipes de fecha y número,
 * el manejo de fechas del datepicker y los textos del paginador.
 *
 * Lo usa `main.ts` al arrancar (`bootstrapApplication(App, appConfig)`).
 */

import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
} from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token.interceptor';
import { AdaptadorFecha } from './core/utilidades/adaptador-fecha';
import { TextosPaginador } from './core/utilidades/textos-paginador';

// Carga las reglas de español de Argentina (nombres de días y meses, coma
// decimal) para los pipes `date`, `percent` y `number`. Sin esto, pedir
// `LOCALE_ID: 'es-AR'` haría fallar la app al arrancar.
registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding` pasa los query params y los `data` de la
    // ruta directo a los inputs del componente (`volver` y `dni` en el login,
    // `fecha` e `id_medico` en los turnos de la sede), sin inyectar
    // `ActivatedRoute`.
    provideRouter(routes, withComponentInputBinding()),
    // Todas las peticiones pasan por el interceptor que agrega el token.
    provideHttpClient(withInterceptors([tokenInterceptor])),
    // Idioma de los pipes: `{{ fecha | date }}` sale como "miércoles, 4 de
    // noviembre de 2026" y no en inglés.
    { provide: LOCALE_ID, useValue: 'es-AR' },
    // Fechas del datepicker en español de Argentina (nombres de meses, lunes
    // como primer día) y el adaptador que entiende `dd/mm/aaaa` al tipear.
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    { provide: DateAdapter, useClass: AdaptadorFecha },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    // "Registros por página", "1 – 10 de 35" en los listados paginados.
    { provide: MatPaginatorIntl, useClass: TextosPaginador },
  ],
};
