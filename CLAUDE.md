# CLAUDE.md — TP Integrador: Frontend (Angular)

> Archivo de contexto para Claude Code. **Leelo completo antes de escribir una sola línea.**
> Si algo de la consigna semanal contradice esto, avisá antes de proceder.

---

## 1. Contexto

- **Materia:** Programación 2 — Proyecto integrador final de la carrera.
- **Qué es:** aplicación web para una clínica médica (usuarios, agenda médica y turnos).
- **Dos etapas de 4 semanas:**
  1. **Backend** — ✅ terminado, en otro repositorio:
     https://github.com/nachorequena/tp-integrador-programacion (carpeta local hermana
     `../proyecto-integrador-programacion`). Su `CLAUDE.md` y su `README.md` tienen el contrato
     completo de la API. Con el backend levantado, `GET http://localhost:3000/docs` es Swagger.
  2. **Frontend** — Angular 21 + Angular Material 21. **← este repositorio.**
- La consigna pide **un repositorio aparte del backend**, con una rama por entrega:
  `entrega-frontend-1`, `entrega-frontend-2`, etc.
- Las consignas están en `docs/`. La **consigna final** (`docs/Frontend-enunciado-completo.pdf`)
  reemplazó a las semanas 2, 3 y 4 y se entregó de una sola vez en la rama **`entrega-frontend`**.
- Mapa del código: `docs/ARQUITECTURA.md` (recorrido menú → ruta → guard → pantalla → servicio →
  API, y tabla de qué usa cada pantalla).

## 2. 🚨 Regla de oro: no adelantarse

- Solo lo que pide la consigna vigente. Con la entrega final **ya no queda ninguna opción "En
  construcción"** (la consigna lo prohíbe): esa pantalla se borró.
- **El backend ya entregado no se toca por iniciativa propia.** Si el front necesita algo que la API
  no da, **preguntá antes**. Las ramas `entrega-backend-N` no se modifican nunca; los cambios
  autorizados van a `main` del backend.
- Ante la duda de si algo pertenece a esta semana: **preguntá antes de codear**.

## 3. Stack (obligatorio)

| Capa             | Tecnología                         | Origen    |
| ---------------- | ---------------------------------- | --------- |
| Framework        | Angular 21 (standalone, signals)   | enunciado |
| UI               | Angular Material 21                | enunciado |
| Lenguaje         | TypeScript 5.9                     | enunciado |
| Estilos          | SCSS + tokens `--mat-sys-*`        | grupo     |
| Package manager  | npm                                | grupo     |
| SSR              | **No** (`--ssr=false`)             | enunciado |

- **Todos los componentes de interfaz se resuelven con Angular Material** (formularios, botones,
  tablas, diálogos, menús, íconos, avisos). No uses HTML crudo donde exista un componente Material.
- **No agregues dependencias sin preguntar.** Autorizada: **Chart.js 4** (gráficos de reportes; la
  consigna deja elegir la librería y pide nombrarla en el README).
- La app es **zoneless** (default de Angular 21): el estado que se ve en pantalla va en `signal`s.
- ⚠️ El npm global del humano es 11.3.0 y tiene un bug (`edgesOut`) al instalar dependencias
  nuevas. Si `npm install` falla así, usá el npm incluido en Node:
  `"/c/Program Files/nodejs/node.exe" "/c/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install`.

## 4. Convenciones

- **Todo en español:** archivos, carpetas, clases, variables, comentarios. Los modelos replican
  **exactamente** los nombres de la API (`fecha_nacimiento`, `id_cobertura`), sin pasarlos a camelCase.
- Archivos sin sufijo, estilo Angular 21: `login.ts` / `login.html` exporta la clase `Login`.
  Los servicios sí llevan `.service.ts`, los guards `.guard.ts` y los interceptores `.interceptor.ts`.
- Prettier: comillas simples, 100 columnas (ver `.prettierrc`).
- Formularios **reactivos** (`FormBuilder`), con un `mat-error` por cada validación.
- Pantallas con `loadComponent` (carga diferida) en `app.routes.ts`.

### 4.1 📖 Documentación obligatoria (innegociable)

Igual que en el backend: hay defensa oral y el autor tiene que poder explicar cada archivo.

1. **Cada archivo `.ts` arranca con un bloque de cabecera** que diga qué responsabilidad tiene.
2. **Cada función, clase o constante exportada lleva JSDoc** (`/** ... */`) con qué hace,
   `@param` no evidentes y `@returns`.
3. **Las decisiones no obvias llevan un `//` que explique el porqué**, no el qué.
4. No documentar lo obvio. Comentarios en español. Si cambiás código, actualizá su comentario.

## 5. Estructura

```
src/environments/environment.ts   # apiUrl: ÚNICO lugar con la URL del backend (lo pide la consigna)
src/app/
├── app.ts / app.html / app.scss  # layout: encabezado + sidenav + router-outlet + pie
├── app.routes.ts                 # rutas + guards; secciones por rol generadas desde el menú
├── app.config.ts                 # router, HttpClient + interceptor, fechas (es-AR)
├── core/
│   ├── config/clinica.ts         # datos de contacto del footer
│   ├── guards/                   # sesionGuard, invitadoGuard, rolGuard(...roles)
│   ├── interceptores/            # tokenInterceptor: Bearer + cierre de sesión ante 401
│   ├── modelos/                  # un archivo por recurso de la API (turno, agenda, sede...)
│   ├── navegacion/menu.ts        # MENU_POR_ROL: fuente única de menú y rutas por rol
│   ├── servicios/                # uno por recurso + sesion (único que toca localStorage)
│   │                             #   + notificacion (estado de la campana con signals)
│   └── utilidades/               # validadores, fechas, mensajeDeError, http (datosDe,
│                                 #   aParametros), textos del paginador, horarios (grilla 30')
├── compartido/                   # diálogos, buscador de pacientes, formulario de paciente,
│                                 #   rangos de agenda, lista de historial, gráfico de barras
├── layout/                       # encabezado, menu-lateral, pie
└── paginas/                      # una carpeta por pantalla
```

**Agregar una pantalla de rol:** crear su carpeta en `paginas/` y agregar la opción en
`MENU_POR_ROL` (`core/navegacion/menu.ts`) con su `cargar: () => import(...)`. `seccionDeRol` en
`app.routes.ts` genera la ruta y la protege sola. Lo que se reutiliza entre pantallas va en
`compartido/`.

Pantallas compartidas entre roles (miran `SesionService.rol()` y se adaptan): `paginas/agendas`
(médico, operador, admin), `paginas/turnos-del-dia` (médico, operador), `paginas/nuevo-turno`
(paciente, operador). El formulario de paciente (`compartido/formulario-paciente`) lo usan el
registro y el operador.

## 6. Contrato con la API

- Toda respuesta llega como `{ codigo, estado, datos }` (tipo `RespuestaApi<T>`). Los servicios
  desenvuelven `datos` con `map`; los componentes reciben el dato directo.
- En los errores, **`estado` trae el mensaje listo para mostrar**. Usá siempre
  `mensajeDeError(error)` para mostrarlo; no inventes textos para errores del backend.
- `POST /auth/login` devuelve `{ token, usuario }`. El usuario nunca trae `password`.
- `POST /auth/registro` exige además `telefono` (columna `NOT NULL` sin default).
- Coberturas para el registro: **`GET /coberturas/disponibles`** (pública). `GET /coberturas` es
  el CRUD del admin y da 401/403 al resto.
- Fechas: la API manda y recibe `YYYY-MM-DD`. Nunca uses `new Date("YYYY-MM-DD")` ni
  `toISOString()` para convertirlas (corren un día por la zona horaria): usá `aFechaApi` y
  `deFechaApi` de `core/utilidades/adaptador-fecha.ts`.
- Roles: `admin`, `operador`, `medico`, `paciente` (minúscula, sin tilde).

## 7. Credenciales de prueba

Están en el `README.md`. Requieren haber corrido `scripts/usuarios-prueba.sql` del backend.

## 8. Qué NO hacer

- ❌ Repetir la URL del backend fuera de `environment.ts`.
- ❌ Leer o escribir `localStorage` fuera de `SesionService`.
- ❌ Componentes de UI que no sean de Angular Material cuando Material tiene uno.
- ❌ Identificadores en inglés.
- ❌ Agregar dependencias sin preguntar.
- ❌ Tocar el backend sin preguntar.

## 9. Bitácora (actualizar al final de cada sesión, lo más reciente arriba)

### Entrega final (consigna "Frontend — Semanas 2 a 4")

- **Estado:** ✅ Completa. `ng build` sin errores ni avisos; recorrido en el navegador con los
  cuatro roles contra el backend real (MySQL 8.3 en modo estricto).
- **Rama:** `entrega-frontend` (frontend) y `entrega-frontend` (backend, con los cambios de API).
- **Origen:** se descartó el repo paralelo de un compañero (no partía de la semana 1); todo se
  implementó desde la consigna sobre esta base.
- **Hecho:** las pantallas de los cuatro roles (ver README §4), campana de notificaciones,
  componentes compartidos, `MENU_POR_ROL` con la pantalla de cada opción, `LOCALE_ID es-AR`,
  paginador en español, Chart.js.
- **Verificado:** turno pedido con el horario ocupado mientras tanto (409 → mensaje y vuelta al paso
  de horario); contador de la campana al confirmar, atender y marcar leída; médico con turnos de dos
  sedes y atención con historial; recorte de rango con turnos → mensaje del backend y papelera
  deshabilitada; operador sin acciones en otra sede, "Nueva agenda" para un médico sin agenda en su
  sede, ojo → turnos confirmados; alta de paciente por el operador (repetir contraseña) y asignación
  de turno; baja de sede con dependencias → mensaje; alta de médico → auditoría; reportes con rango;
  URL de otro rol → acceso denegado; token inválido → login; backend apagado → mensaje y Reintentar.
- **Decisiones:**
  - **Horas de agenda en un `mat-select` cada 30 minutos** (la duración del turno del backend), así
    los rangos siempre calzan con la grilla.
  - **Fechas y horarios del pedido de turno como chips** (`mat-chip-listbox`): se ven todas las
    opciones disponibles de un vistazo, sin abrir un calendario con días deshabilitados.
  - **Los diálogos guardan ellos mismos** (sede, rango, usuario, atención): si el backend rechaza,
    el error se ve en el diálogo sin perder lo cargado.
  - **El color del gráfico se resuelve en el navegador**: `--mat-sys-primary` usa `light-dark()` y
    Chart.js lo pintaba negro.
  - **El rol no se cambia al editar un usuario** (el backend lo rechaza).
  - **El admin tiene "Agendas médicas"** (estaba en el menú de la semana 1) con edición en todas
    las sedes; no tiene el ojo porque los turnos no son parte de su rol.

### Semana 1 — Setup, Angular Material y autenticación

- **Estado:** ✅ Completa y verificada en el navegador contra el backend real.
- **Rama:** `entrega-frontend-1`.
- **Hecho:**
  - Proyecto Angular 21.2 + Material 21.2, sin SSR, tema Material 3 (paleta cyan).
  - Layout con header, sidenav adaptable (fijo en escritorio y superpuesto en celular) y footer.
  - Registro, login, cierre de sesión y "Mi perfil" contra la API.
  - Guards por sesión y por rol; páginas "Acceso denegado", "No encontrada" y "En construcción".
  - CORS habilitado en el backend (paquete `cors`, autorizado por el humano), en `main` del
    backend; las ramas de entrega del backend no se tocaron.
- **Verificado:** validaciones por campo; DNI duplicado (409) mostrado en el campo y arriba;
  login con contraseña incorrecta (401); registro exitoso → login con el DNI precargado; sesión
  que persiste al recargar; token vencido descartado al recargar; token inválido → 401 → sesión
  cerrada; URLs de otro rol → acceso denegado; sin sesión → login con `?volver=`; ruta
  inexistente; layout en 390 px de ancho sin scroll horizontal.
- **Decisiones:**
  - **Teléfono obligatorio en el registro** (lo exige el backend). Acordado con el humano.
  - **Footer con datos del seed** (Sede Centro). Correo y redes son de ejemplo: la base no los tiene.
  - **`MENU_POR_ROL` genera las rutas de cada sección**, así menú y rutas no se desincronizan.
  - **Adaptador de fechas propio:** el nativo de Material no entiende `dd/mm/aaaa` al tipear.
  - **`MatDatepickerIntl` en español se provee en el componente**, no en `app.config.ts`:
    `MatDatepickerModule` trae su propio provider y le gana al global.
  - **Budget inicial subido a 800 kB** (aviso) / 1,5 MB (error): Material en el layout pasa los
    500 kB por defecto de `ng new`.
  - Se borró el `app.spec.ts` que generó `ng new`: probaba el placeholder que ya no existe.
