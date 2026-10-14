# Clínica Virtual — Frontend

Frontend del **TP Integrador de Programación 2: Sistema de Gestión de Turnos Médicos**.
Aplicación Angular 21 + Angular Material 21 que consume la API del backend.

- **Backend (repositorio aparte):** https://github.com/nachorequena/tp-integrador-programacion
- **Entrega de la semana 1 del frontend:** rama `entrega-frontend-1`

## Versiones utilizadas

| Herramienta      | Versión  |
| ---------------- | -------- |
| Node.js          | 24.11.1  |
| npm              | 11.6.2   |
| Angular CLI      | 21.2.26  |
| Angular          | 21.2.25  |
| Angular Material | 21.2.14  |
| TypeScript       | 5.9.3    |

Angular 21 acepta Node `^20.19.0`, `^22.12.0` o `^24.0.0`. Se recomienda Node 22 LTS o 24 LTS.

> ⚠️ **npm 11.3.0 tiene un bug** que hace fallar `npm install` en proyectos Angular 21 nuevos con
> `Cannot read properties of null (reading 'edgesOut')`. Si aparece, actualizá npm
> (`npm install -g npm@11`) o usá el npm que viene incluido con Node 24 (11.6 o superior).

## Requisitos previos

1. **Backend levantado** en `http://localhost:3000`, con la base `clinica` importada y el script de
   usuarios de prueba aplicado. Los pasos están en el README del backend.
2. El backend tiene que estar en la versión de `main` que **habilita CORS** para
   `http://localhost:4200` (variable `CORS_ORIGEN`, por defecto ya apunta ahí). Sin eso, el
   navegador bloquea todas las llamadas.
3. Angular CLI 21 instalado globalmente:

   ```bash
   npm install -g @angular/cli@21
   ng version   # debe mostrar Angular CLI 21.x y la versión de Node
   ```

## Instalación y arranque

```bash
git clone https://github.com/nachorequena/tp-integrador-frontend.git
cd tp-integrador-frontend
git checkout entrega-frontend-1
npm install
ng serve
```

Abrir **http://localhost:4200**.

La URL del backend se define en un único lugar: [`src/environments/environment.ts`](src/environments/environment.ts).
Si el backend corre en otro puerto, se cambia solo ahí.

| Comando     | Qué hace                                        |
| ----------- | ----------------------------------------------- |
| `ng serve`  | Servidor de desarrollo con recarga automática   |
| `ng build`  | Compila la versión de producción en `dist/`     |

## Credenciales de prueba

Las crea el script `scripts/usuarios-prueba.sql` del backend.

| DNI        | Contraseña    | Rol        | Usuario         |
| ---------- | ------------- | ---------- | --------------- |
| `18222333` | `admin123`    | `admin`    | Marcos Gomez    |
| `15200548` | `operador123` | `operador` | Juan Perez      |
| `20111222` | `medico123`   | `medico`   | Ana Lopez       |
| `25333444` | `medico123`   | `medico`   | Carlos Ruiz     |
| `36000960` | `paciente123` | `paciente` | Franco Friggeri |

También se puede crear un paciente nuevo desde **Registrarse**.

## Qué incluye la semana 1

- **Layout general:** header, menú lateral y footer.
  - Header sin sesión: "Bienvenido a la clínica virtual". Con sesión: nombre del usuario, ícono
    de información con el tipo de usuario (tooltip), campana de notificaciones (ubicada; su
    funcionalidad llega en la semana 3) y "Cerrar sesión".
  - Menú con las opciones del rol logueado. Las de semanas futuras llevan a "En construcción".
  - Footer con dirección de la sede, teléfono, correo y redes sociales.
  - En celulares el menú se superpone al contenido y se abre con el botón del header.
- **Pantalla principal** con y sin sesión.
- **Registro de paciente** con validaciones por campo y cobertura traída del backend.
- **Login, cierre de sesión y "Mi perfil"** contra la API.
- **Rutas protegidas** por sesión y por rol, más las páginas "Acceso denegado" y "No encontrada".

## Rutas

| Ruta                | Acceso                          |
| ------------------- | ------------------------------- |
| `/`                 | Pública (cambia con sesión)     |
| `/login`            | Solo sin sesión                 |
| `/registro`         | Solo sin sesión                 |
| `/perfil`           | Cualquier usuario con sesión    |
| `/admin/...`        | Solo `admin`                    |
| `/medico/...`       | Solo `medico`                   |
| `/operador/...`     | Solo `operador`                 |
| `/paciente/...`     | Solo `paciente`                 |
| `/acceso-denegado`  | Pública                         |
| cualquier otra      | "Página no encontrada"          |

Sin sesión, una ruta protegida redirige al login (y después del login vuelve a la ruta pedida).
Con sesión pero con otro rol, redirige a "Acceso denegado".

## Estructura

```
src/
├── environments/environment.ts   # URL base de la API (único lugar)
└── app/
    ├── app.ts / app.html          # layout: header + menú + pantalla + footer
    ├── app.routes.ts              # todas las rutas y sus guards
    ├── app.config.ts              # router, HttpClient + interceptor, fechas
    ├── core/
    │   ├── config/                # datos de contacto de la clínica (footer)
    │   ├── guards/                # sesionGuard, invitadoGuard, rolGuard
    │   ├── interceptores/         # agrega el token a cada petición
    │   ├── modelos/               # Usuario, Cobertura, RespuestaApi<T>
    │   ├── navegacion/            # opciones del menú por rol
    │   ├── servicios/             # auth, coberturas y estado de la sesión
    │   └── utilidades/            # validadores, fechas y mensajes de error
    ├── layout/                    # encabezado, menu-lateral, pie
    └── paginas/                   # inicio, login, registro, perfil y pantallas de estado
```

## Decisiones de diseño

- **Teléfono obligatorio en el registro.** La consigna no lo lista, pero la columna `telefono`
  es `NOT NULL` sin valor por defecto y el backend lo exige.
- **Validaciones iguales a las del backend.** Mismos largos que las columnas de la base (DNI de 7
  u 8 dígitos, email de hasta 30, teléfono de hasta 10, contraseña de 6 a 72 bytes), así el
  usuario ve el error en el campo antes de enviar.
- **Los errores del backend se muestran tal cual.** La API devuelve el motivo en el campo `estado`
  ("El DNI ya está registrado", "DNI o contraseña incorrectos"). Si es un duplicado, además se
  marca el campo correspondiente.
- **Sesión en `localStorage`.** Se guardan el token y el usuario que devuelve el login, para que
  la sesión sobreviva a la recarga. Al arrancar, si el token ya venció, la sesión se descarta.
- **Token vencido o inválido durante el uso.** Si el backend responde 401 a una petición que
  llevaba token, el interceptor cierra la sesión y manda al login.
- **Footer con datos fijos.** `GET /sedes` es solo para admin y el footer se ve sin sesión, así
  que dirección y teléfono se copiaron de la Sede Centro del script de la base. Correo y redes
  son de ejemplo: la base no los tiene.
- **Los guards del front son comodidad, no seguridad.** Lo que protege los datos es el backend,
  que valida el token y el rol en cada petición.
