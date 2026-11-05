/**
 * INICIO AUTOMÁTICO DEL FRONTEND (`npm run iniciar`)
 * =================================================
 *
 * Deja todo listo y levanta la aplicación con un solo comando, pensado para la
 * PC donde se hace la defensa (recién clonado el repo). Hace, en orden:
 *
 *   1. `npm install` si todavía no están las dependencias.
 *   2. Lee la URL de la API de `src/environments/environment.ts` y verifica que
 *      el backend responda en `/health`. Si no responde, avisa (hay que correr
 *      antes `npm run iniciar` en la carpeta del backend) pero sigue igual: la
 *      app arranca y muestra "No se pudo conectar con el servidor".
 *   3. Controla que el puerto 4200 esté libre (el backend solo acepta pedidos
 *      de http://localhost:4200, ver `CORS_ORIGEN`).
 *   4. Levanta `ng serve` con el Angular CLI del propio proyecto (no hace falta
 *      tenerlo instalado globalmente) y abre el navegador.
 *
 * Con qué se conecta: lo invoca el script `iniciar` de `package.json`; lee
 * `src/environments/environment.ts` (único lugar con la URL de la API).
 *
 * Está en CommonJS (.cjs) y solo usa módulos de Node: funciona aunque todavía
 * no exista `node_modules`.
 */

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const PUERTO = 4200;

/** Imprime un paso con formato uniforme. */
function paso(texto) {
  console.log(`\n▶ ${texto}`);
}

/** Corta la ejecución con un mensaje claro. */
function abortar(texto) {
  console.error(`\n✖ ${texto}\n`);
  process.exit(1);
}

/** 1. Instala las dependencias si faltan. */
function instalarDependencias() {
  if (fs.existsSync(path.join(RAIZ, "node_modules", "@angular", "core"))) return;
  paso("Instalando dependencias (npm install, puede tardar un par de minutos)...");
  // `shell: true` hace falta en Windows, donde npm es un .cmd.
  const resultado = spawnSync("npm install", {
    cwd: RAIZ,
    stdio: ["ignore", "inherit", "inherit"],
    shell: true,
  });
  if (resultado.status !== 0) {
    abortar(
      "Falló npm install. Si el error menciona 'edgesOut', actualizá npm con " +
        "`npm install -g npm@11` y volvé a intentar.",
    );
  }
}

/** Lee `apiUrl` de environment.ts (no se duplica la URL en otro lado). */
function urlDeLaApi() {
  const archivo = path.join(RAIZ, "src", "environments", "environment.ts");
  const coincidencia = fs.readFileSync(archivo, "utf8").match(/apiUrl:\s*'([^']+)'/);
  return coincidencia ? coincidencia[1] : "http://localhost:3000";
}

/** 2. Avisa si el backend no responde. */
async function verificarBackend() {
  const url = urlDeLaApi();
  paso(`Verificando el backend en ${url}/health ...`);
  try {
    const respuesta = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) });
    const cuerpo = await respuesta.json();
    if (cuerpo?.datos?.base_de_datos === "ok") {
      console.log("  ✓ Backend y base de datos respondiendo.");
      return;
    }
    console.warn("  ⚠ El backend responde pero no puede conectarse a la base. Revisá su .env.");
  } catch {
    console.warn(
      "  ⚠ El backend no responde. Abrí otra terminal en la carpeta del backend y corré " +
        "`npm run iniciar`. La app se levanta igual y mostrará el error de conexión.",
    );
  }
}

/** Resuelve `true` si nadie está escuchando en el puerto. */
function puertoLibre(puerto) {
  return new Promise((resolver) => {
    const servidor = net.createServer();
    servidor.once("error", () => resolver(false));
    servidor.once("listening", () => servidor.close(() => resolver(true)));
    servidor.listen(puerto);
  });
}

async function main() {
  console.log("Clínica Virtual — inicio automático del frontend");

  instalarDependencias();
  await verificarBackend();

  paso(`Verificando que el puerto ${PUERTO} esté libre...`);
  if (!(await puertoLibre(PUERTO))) {
    abortar(
      `El puerto ${PUERTO} está ocupado (¿ya hay otro ng serve abierto?). Cerralo y volvé a ` +
        "intentar: el backend solo acepta pedidos de http://localhost:4200.",
    );
  }

  paso(`Levantando la aplicación en http://localhost:${PUERTO} (Ctrl+C para detenerla)...`);
  // NG_CLI_ANALYTICS=false evita que el CLI, la primera vez que se usa en una
  // PC, se quede esperando la respuesta a "¿querés compartir estadísticas?".
  const servidor = spawn(`npx ng serve --port ${PUERTO} --open`, {
    cwd: RAIZ,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NG_CLI_ANALYTICS: "false" },
  });
  servidor.on("exit", (codigo) => process.exit(codigo ?? 0));
}

main().catch((error) => abortar(error.message));
