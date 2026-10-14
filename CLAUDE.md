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
- Las consignas se liberan semana a semana y están en `docs/` (si falta un PDF, pedíselo al humano).

## 2. 🚨 Regla de oro: no adelantarse

- Solo lo que pide la semana en curso. Las opciones de semanas futuras pueden quedar visibles en el
  menú apuntando a "En construcción" (lo permite la consigna de la semana 1).
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
- **No agregues dependencias sin preguntar.**
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
│   ├── modelos/                  # Usuario, Rol, Cobertura, RespuestaApi<T>
│   ├── navegacion/menu.ts        # MENU_POR_ROL: fuente única de menú y rutas por rol
│   ├── servicios/                # auth, cobertura, sesion (único que toca localStorage)
│   └── utilidades/               # validadores, adaptador de fechas, mensajeDeError
├── layout/                       # encabezado, menu-lateral, pie
└── paginas/                      # una carpeta por pantalla
```

**Agregar una pantalla de una semana nueva:** crear su carpeta en `paginas/` y, si es una opción
del menú, reemplazar en `app.routes.ts` el `EnConstruccion` de esa ruta por el componente nuevo.

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
