# Arquitectura del frontend

Mapa del código para entender (y defender) qué hace cada parte y con qué se conecta. El detalle de cada clase y función está en su JSDoc; acá está el recorrido completo.

## 1. Recorrido: del menú a la API

```
Usuario hace click en una opción del menú (layout/menu-lateral)
   │  la opción sale de MENU_POR_ROL (core/navegacion/menu.ts)
   ▼
Router de Angular (app.routes.ts)
   │  la ruta /<rol>/<segmento> la generó seccionDeRol() a partir del menú
   ├─ sesionGuard      ¿hay sesión? si no → /login?volver=...
   ├─ rolGuard(rol)    ¿es el rol de la sección? si no → /acceso-denegado
   ▼
Pantalla (paginas/...) — se descarga recién ahora (loadComponent)
   │  usa componentes de compartido/ (diálogos, buscador, gráfico...)
   ▼
Servicio (core/servicios/*.service.ts)
   │  arma la URL con environment.apiUrl y los filtros con aParametros()
   ▼
HttpClient → tokenInterceptor (core/interceptores/token.interceptor.ts)
   │  agrega Authorization: Bearer <token>; si la API responde 401 → cierra sesión y va al login
   ▼
API del backend → responde { codigo, estado, datos }
   │
   ▼
Servicio: datosDe() se queda con `datos`  ──►  Pantalla: lo guarda en un signal y el template se actualiza
                                         └──►  si falló: mensajeDeError(error) → aviso en pantalla
```

El estado que comparten varias partes vive en servicios con signals:

- `SesionService`: token y usuario logueado (el único que toca `localStorage`).
- `NotificacionService`: listado y contador de la campana. Se recarga al iniciar sesión, al navegar y después de confirmar, cancelar o atender un turno.

## 2. Pantallas: componentes, servicios y endpoints

| Ruta | Pantalla | Componentes compartidos | Servicio → endpoint |
| ---- | -------- | ----------------------- | ------------------- |
| `/` | `paginas/inicio` | — | — (usa `MENU_POR_ROL`) |
| `/login` | `paginas/login` | — | `AuthService` → `POST /auth/login` |
| `/registro` | `paginas/registro` | `formulario-paciente` | `AuthService` → `POST /auth/registro`, `CoberturaService` → `GET /coberturas/disponibles` |
| `/perfil` | `paginas/perfil` | — | `GET /auth/perfil`, `GET /coberturas/disponibles` |
| `/admin/sedes` | `paginas/admin/sedes` (+ `dialogo-sede`) | `dialogo-confirmacion` | `SedeService` → `GET/POST/PUT/DELETE /sedes` |
| `/admin/especialidades` | `paginas/admin/especialidades` | `dialogo-texto`, `dialogo-confirmacion` | `EspecialidadService` → `/especialidades` |
| `/admin/coberturas` | `paginas/admin/coberturas` | `dialogo-texto`, `dialogo-confirmacion` | `CoberturaService` → `/coberturas` |
| `/admin/usuarios` | `paginas/admin/usuarios` (+ `dialogo-usuario`) | — | `UsuarioService` → `GET/POST/PUT /usuarios`; sedes, especialidades, coberturas |
| `/admin/auditoria` | `paginas/admin/auditoria` | — | `AuditoriaService` → `GET /auditoria` |
| `/admin/reportes` | `paginas/admin/reportes` | `grafico-barras` (Chart.js) | `ReporteService` → los 4 `GET /reportes/*` a la vez |
| `/admin/agendas`, `/operador/agendas`, `/medico/agenda` | `paginas/agendas` (+ `dialogo-agenda-medico`) | `rangos-agenda`, `dialogo-rango`, `dialogo-confirmacion` | `AgendaService` → `/agendas`; `MedicoService` → `GET /medicos`; `SedeService` |
| `/medico/turnos`, `/operador/turnos` | `paginas/turnos-del-dia` (+ `dialogo-atencion`) | `dialogo-confirmacion` | `TurnoService` → `GET /turnos/medico` o `/turnos/sede`, `PATCH .../atender`, `PATCH .../cancelar` |
| `/medico/historial` | `paginas/medico/historial` | `buscador-pacientes`, `lista-historial` | `PacienteService` → `GET /pacientes`; `HistorialService` → `GET /historial/paciente/:id` |
| `/operador/pacientes` | `paginas/operador/pacientes` | `buscador-pacientes`, `formulario-paciente` | `PacienteService` → `GET/POST /pacientes` |
| `/paciente/solicitar-turno`, `/operador/nuevo-turno` | `paginas/nuevo-turno` | `buscador-pacientes` (operador) | `GET /especialidades`, `/sedes`, `/medicos`, `/disponibilidad/fechas`, `/disponibilidad/horarios`; `POST /turnos` |
| `/paciente/mis-turnos` | `paginas/paciente/mis-turnos` | `dialogo-confirmacion` | `TurnoService` → `GET /turnos/mios`, `PATCH .../cancelar` |
| `/paciente/historial` | `paginas/paciente/historial` | `lista-historial` | `HistorialService` → `GET /historial/mio` |
| `/paciente/mis-datos` | `paginas/paciente/mis-datos` | — | `PacienteService` → `PUT /pacientes/mis-datos` |
| (todas) | `layout/encabezado` (campana) | — | `NotificacionService` → `GET /notificaciones`, `PATCH /notificaciones/:id/leida` |

## 3. Componentes compartidos (`src/app/compartido/`)

| Componente | Qué hace | Lo usan |
| ---------- | -------- | ------- |
| `dialogo-confirmacion` | "¿Está seguro de…?" (`confirmar()` devuelve `true`/`false`) | bajas de catálogos y rangos, cancelación de turnos |
| `dialogo-texto` | Alta/modificación de un solo campo de texto | especialidades, coberturas |
| `dialogo-rango` | Rango de agenda: fecha, horas cada 30 min, especialidad y sede (y médico en "Nueva agenda") | `rangos-agenda`, agenda del operador |
| `rangos-agenda` | Tabla de rangos de un médico en una fecha, con alta, edición y baja | agenda del médico, diálogo del lápiz del operador |
| `buscador-pacientes` | Búsqueda por DNI o apellido | nuevo turno (operador), historial del médico, pacientes del operador |
| `formulario-paciente` | Alta de paciente con las validaciones del registro (y repetir contraseña) | registro, pacientes del operador |
| `lista-historial` | Tarjetas de registros del historial clínico | historial del paciente y del médico |
| `grafico-barras` | Gráfico de barras con Chart.js | reportes |

## 4. Reglas de la consigna y dónde se cumplen en la interfaz

| Regla | Dónde |
| ----- | ----- |
| Cada pantalla solo para su rol, desde el menú o con la URL | `app.routes.ts` (`seccionDeRol` + `rolGuard`) |
| Listados elegibles cargados desde la API | servicios de `core/servicios/` |
| Solo fechas con agenda y horarios libres | `paginas/nuevo-turno` (pasos fecha y horario) |
| El operador no modifica agenda ni turnos de otras sedes | `paginas/agendas` (`puedeModificar`), `dialogo-rango` (sede fija) |
| No eliminar un rango con turnos confirmados | `rangos-agenda` (botón deshabilitado) + mensaje del backend |
| Salida posterior a la entrada antes de enviar | `validadores.ts` → `salidaPosteriorAEntrada` |
| Repetir contraseña y validar que coincidan | `validadores.ts` → `coincidenCampos` |
| Contador de notificaciones al instante | `NotificacionService` (`noLeidas`, `marcarLeida`, `cargar`) |
| Fechas en formato día/mes/año | `adaptador-fecha.ts`, `LOCALE_ID es-AR` en `app.config.ts` |
| Indicador de carga y mensaje en listados vacíos | cada pantalla (`mat-progress-bar`, `.estado-vacio`) |
| Backend caído o token vencido | `mensajeDeError` (status 0) y `token.interceptor.ts` (401) |
| Sin URLs repetidas | `environment.ts` es el único lugar con la URL de la API |
