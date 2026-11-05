# Clínica Virtual — Frontend

Frontend del **TP Integrador de Programación 2: Sistema de Gestión de Turnos Médicos**.
Aplicación Angular 21 + Angular Material 21 que consume la API del backend.

- **Backend (repositorio aparte):** https://github.com/nachorequena/tp-integrador-programacion — rama `entrega-frontend`
- **Frontend (este repositorio):** rama **`entrega-frontend`** (entrega final). La semana 1 quedó en `entrega-frontend-1`.

Este README es la guía para la defensa: cómo levantar **todo el sistema desde cero** (base de
datos, backend y frontend) y probarlo con cada rol.

---

## 1. Versiones utilizadas

| Herramienta        | Versión   |
| ------------------ | --------- |
| Node.js            | 24.11.1   |
| npm                | 11.6.2    |
| Angular CLI        | 21.2.26   |
| Angular            | 21.2.25   |
| Angular Material   | 21.2.14   |
| TypeScript         | 5.9.3     |
| Chart.js           | 4.6.1     |
| MySQL (WAMP)       | 8.3.0 (también funciona con MariaDB 10.4+) |
| Express (backend)  | 5         |

Angular 21 acepta Node `^20.19.0`, `^22.12.0` o `^24.0.0`. Se recomienda Node 22 LTS o 24 LTS.

> ⚠️ **npm 11.3.0 tiene un bug** que hace fallar `npm install` con
> `Cannot read properties of null (reading 'edgesOut')`. Si aparece, actualizá npm
> (`npm install -g npm@11`) o usá el npm que viene con Node 24 (11.6 o superior).

**Librería de gráficos:** [Chart.js](https://www.chartjs.org/) 4, usada directamente (sin
envoltorios) en `src/app/compartido/grafico-barras`. Se eligió porque es liviana, se puede
importar por partes (solo se registran las piezas del gráfico de barras) y funciona con Angular 21
sin adaptadores.

---

## 2. Levantar el sistema completo desde cero

Hace falta tener instalados **Node.js**, **MySQL o MariaDB** (por ejemplo con WAMP/XAMPP) y
**Git**.

### 2.1 Base de datos

Crear la base (el script de la cátedra no incluye `CREATE DATABASE`):

```sql
CREATE DATABASE clinica CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Clonar el backend e importar los **tres** scripts, **en este orden**:

```bash
git clone https://github.com/nachorequena/tp-integrador-programacion.git tp-integrador-backend
cd tp-integrador-backend
git checkout entrega-frontend

mysql -u root -p clinica < docs/clinica_ampliada.sql     # 1. tablas y datos de la cátedra
mysql -u root -p clinica < scripts/usuarios-prueba.sql   # 2. contraseñas reales
mysql -u root -p clinica < scripts/datos-prueba.sql      # 3. datos de la entrega final
```

> Si el comando `mysql` no está en el PATH (Windows), se puede usar el de WAMP, por ejemplo
> `C:\wamp64\bin\mysql\mysql8.3.0\bin\mysql.exe`, o importar los tres archivos en orden desde
> phpMyAdmin con la base `clinica` seleccionada.

El tercer script deja lo que pide la consigna: **tres médicos con distintas especialidades**,
**uno con agenda en más de una sede** (Ana Lopez: Sede Centro a la mañana y Sede Norte a la tarde)
y **turnos en los tres estados** (confirmado, cancelado y atendido con su historial). Sus fechas
son relativas al día en que se ejecuta, así siempre hay agenda "para hoy": **conviene correrlo el
día de la defensa**.

### 2.2 Backend

```bash
cd tp-integrador-backend
cp .env.example .env      # en Windows: copy .env.example .env
npm install
npm run dev
```

Variables de entorno del backend (`.env`):

| Variable         | Para qué                                         | Ejemplo                  |
| ---------------- | ------------------------------------------------ | ------------------------ |
| `PORT`           | Puerto de la API                                 | `3000`                   |
| `DB_HOST`        | Host de MySQL/MariaDB                            | `localhost`              |
| `DB_PORT`        | Puerto de la base (WAMP con MySQL suele usar 3306 o 3308) | `3306`          |
| `DB_USER`        | Usuario de la base                               | `root`                   |
| `DB_PASSWORD`    | Contraseña (puede ir vacía)                      |                          |
| `DB_NAME`        | Nombre de la base                                | `clinica`                |
| `JWT_SECRET`     | Secreto para firmar los tokens                   | cualquier texto largo    |
| `JWT_EXPIRES_IN` | Vencimiento del token                            | `1d`                     |
| `CORS_ORIGEN`    | Origen del frontend habilitado por CORS          | `http://localhost:4200`  |

Comprobar que responde: http://localhost:3000/health → `"base_de_datos": "ok"`.
La documentación de la API (Swagger) queda en http://localhost:3000/docs.

### 2.3 Frontend

```bash
git clone https://github.com/nachorequena/tp-integrador-frontend.git
cd tp-integrador-frontend
git checkout entrega-frontend
npm install
ng serve          # o: npm start
```

Abrir **http://localhost:4200**.

El frontend no usa variables de entorno del sistema: la URL del backend se define en un único
lugar, [`src/environments/environment.ts`](src/environments/environment.ts)
(`http://localhost:3000`). Si el backend corre en otro puerto, se cambia solo ahí.

| Comando     | Qué hace                                        |
| ----------- | ----------------------------------------------- |
| `ng serve`  | Servidor de desarrollo con recarga automática   |
| `ng build`  | Compila la versión de producción en `dist/`     |

---

## 3. Usuarios de prueba

| Rol           | DNI        | Contraseña    | Usuario                                   |
| ------------- | ---------- | ------------- | ----------------------------------------- |
| Administrador | `18222333` | `admin123`    | Marcos Gomez                              |
| Operador      | `15200548` | `operador123` | Juan Perez (Sede Centro)                  |
| Médico        | `20111222` | `medico123`   | Ana Lopez — Traumatología, atiende en las dos sedes |
| Médico        | `25333444` | `medico123`   | Carlos Ruiz — Clínica médica (Sede Norte) |
| Médico        | `27444555` | `medico123`   | Lucía Fernandez — Cardiología (Sede Centro) |
| Paciente      | `36000960` | `paciente123` | Franco Friggeri (Jerarquicos)             |
| Paciente      | `40111222` | `paciente123` | Laura Martinez (OSDE)                     |

También se puede crear un paciente nuevo desde **Registrarse**, o desde "Pacientes" con el operador.

---

## 4. Qué hace cada rol

| Rol | Pantallas |
| --- | --------- |
| **Administrador** | Sedes, Especialidades y Coberturas (tabla con filtro, alta y modificación con formulario, baja con confirmación) · Usuarios (listado paginado con filtros, alta de operador/médico/administrador, edición de cualquier usuario) · Agendas médicas · Auditoría (solo lectura, paginada, con filtros) · Reportes (cuatro indicadores con rango de fechas y gráficos de barras) |
| **Médico** | Mi agenda (rangos por fecha en una o más sedes) · Turnos del día (hora, paciente, edad, sede; notas desplegables; marcar como atendido con historial clínico; cancelar) · Historial de pacientes (solo los turnos que atendió él) |
| **Operador** | Agendas médicas (por fecha y sede; "Nueva agenda", lápiz y ojo solo en su sede) · Turnos de la sede · Nuevo turno (mismo flujo que el paciente, con la sede fija) · Pacientes (buscar y asignar turno, alta de paciente) |
| **Paciente** | Solicitar turno (especialidad → sede → médico → fecha → horario → nota y resumen) · Mis turnos (detalle desplegable, estado por color, cancelar, historial si fue atendido) · Mi historial clínico · Mis datos personales (email, teléfono, cobertura y contraseña) |
| **Todos** | Campana de notificaciones con contador de no leídas, listado y marcado como leída · Mi perfil |

### Recorrido sugerido para la defensa

1. **Paciente** (`36000960`): Solicitar turno con Traumatología → Sede Norte → Lopez → una fecha →
   un horario → nota. Ver el resumen, confirmar y mirar el contador de la campana. En "Mis turnos",
   abrir el turno atendido de ayer para ver el historial.
2. **Médica** (`20111222`): "Turnos del día" muestra turnos de las dos sedes; abrir una fila para
   ver la nota, marcar uno como atendido con diagnóstico. En "Mi agenda", intentar recortar un
   rango con turnos (mensaje de error) y ver la papelera deshabilitada.
3. **Operador** (`15200548`): en "Agendas médicas" cambiar a Sede Norte (solo lectura); volver a
   Sede Centro, cargar una "Nueva agenda" a Carlos Ruiz y usar el ojo de Lopez. Dar de alta un
   paciente y asignarle un turno.
4. **Administrador** (`18222333`): intentar borrar Sede Centro (mensaje de dependencias), crear un
   médico en Usuarios y verlo en Auditoría; cambiar el rango de fechas en Reportes.

---

## 5. Rutas

| Ruta                | Acceso                          |
| ------------------- | ------------------------------- |
| `/`                 | Pública (cambia con sesión)     |
| `/login`, `/registro` | Solo sin sesión               |
| `/perfil`           | Cualquier usuario con sesión    |
| `/admin/...`        | Solo `admin`: `sedes`, `especialidades`, `coberturas`, `usuarios`, `agendas`, `auditoria`, `reportes` |
| `/medico/...`       | Solo `medico`: `agenda`, `turnos`, `historial` |
| `/operador/...`     | Solo `operador`: `agendas`, `turnos`, `nuevo-turno`, `pacientes` |
| `/paciente/...`     | Solo `paciente`: `solicitar-turno`, `mis-turnos`, `historial`, `mis-datos` |
| `/acceso-denegado`  | Pública                         |
| cualquier otra      | "Página no encontrada"          |

Sin sesión, una ruta protegida redirige al login (y después vuelve a la ruta pedida). Con sesión
pero de otro rol —desde el menú o escribiendo la URL a mano— redirige a "Acceso denegado".

---

## 6. Estructura

```
src/
├── environments/environment.ts   # URL base de la API (único lugar)
└── app/
    ├── app.ts / app.html          # layout: header + menú + pantalla + footer
    ├── app.routes.ts              # rutas y guards (las de cada rol salen del menú)
    ├── app.config.ts              # router, HttpClient + interceptor, idioma, fechas, paginador
    ├── core/
    │   ├── config/                # datos de contacto de la clínica (footer)
    │   ├── guards/                # sesionGuard, invitadoGuard, rolGuard
    │   ├── interceptores/         # agrega el token; 401 → vuelve al login
    │   ├── modelos/               # tipos de cada recurso de la API
    │   ├── navegacion/menu.ts     # opciones del menú por rol + pantalla que carga cada una
    │   ├── servicios/             # un servicio por recurso de la API + sesión + notificaciones
    │   └── utilidades/            # validadores, fechas, errores, HTTP, paginador, horarios
    ├── compartido/                # componentes reutilizados entre pantallas y roles
    ├── layout/                    # encabezado (con la campana), menu-lateral, pie
    └── paginas/                   # una carpeta por pantalla
```

El recorrido completo (menú → ruta → guard → pantalla → servicio → API) y la tabla de qué usa
cada pantalla están en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

---

## 7. Decisiones de diseño

- **Pantallas compartidas entre roles, sin duplicar.** La solicitud de turno la usan paciente y
  operador; la agenda, médico, operador y administrador; los turnos del día, médico y operador. Cada
  pantalla mira el rol de la sesión y se adapta. El formulario de alta de paciente
  (`compartido/formulario-paciente`) es el mismo para el registro público y para el operador.
- **Todo lo elegible viene de la API.** Sedes, especialidades, coberturas, médicos, fechas y
  horarios se piden al backend; nada está escrito a mano.
- **Turnos de 30 minutos.** Lo define el backend. Las horas de la agenda se eligen de un selector
  cada media hora, así los rangos siempre calzan con la grilla de turnos.
- **La interfaz no ofrece lo que el backend va a rechazar.** La baja de un rango con turnos
  confirmados aparece deshabilitada; el operador no ve acciones en otras sedes; el paciente solo ve
  fechas y horarios libres. Igual, si el backend rechaza algo, su mensaje se muestra tal cual.
- **Errores del backend visibles.** La API devuelve el motivo en `estado` y se muestra en el
  formulario o en un aviso. Con el backend apagado se ve "No se pudo conectar con el servidor" y un
  botón "Reintentar".
- **Sesión en `localStorage`**, descartada al arrancar si el token venció. Si el token vence durante
  el uso, el interceptor cierra la sesión y lleva al login.
- **Notificaciones:** el contador se recarga al iniciar sesión, al navegar entre pantallas y después
  de confirmar, cancelar o atender un turno. Marcar como leída lo baja al instante.
- **Fechas en formato local** (día/mes/año): adaptador propio del datepicker y `LOCALE_ID es-AR`.
- **Aplicación de escritorio.** La consigna no pide diseño responsive; las pantallas nuevas están
  pensadas para PC.
- **Los guards del front son comodidad, no seguridad.** Lo que protege los datos es el backend, que
  valida token, rol y pertenencia en cada petición.

### Cambios hechos en el backend para esta entrega

La consigna permite (y sugiere) ajustar la API. Están detallados en el README del backend
("Cambios para el frontend") y en Swagger. En resumen: endpoints nuevos `GET /medicos`,
`GET /disponibilidad/fechas` y `/horarios`, `GET/POST /pacientes`, `PUT /pacientes/mis-datos` y
`GET/POST/PUT /usuarios`; `GET /sedes` y `GET /especialidades` abiertos a cualquier sesión; reglas
nuevas de agenda (sede del operador, turnos confirmados) y de turnos (médico en varias sedes,
nombres en los listados, historial al atender); auditoría paginada.
