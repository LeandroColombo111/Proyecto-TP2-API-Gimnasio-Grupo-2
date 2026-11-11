// Ejecuta una secuencia fija de pedidos contra la API y guarda status + body de cada uno en un JSON.
// Se corre una vez con PERSISTENCE_TYPE=memory y otra con PERSISTENCE_TYPE=sequelize (con la base vacía),
// y después scripts/comparar.js muestra las diferencias entre los dos resultados.
//
// Uso: node --env-file=.env scripts/paridad.js <urlBase> <archivoSalida>
//   ej: node --env-file=.env scripts/paridad.js http://localhost:8000 resultado-memory.json
import { writeFile } from "node:fs/promises";

const [urlBase, archivoSalida] = process.argv.slice(2);
if (!urlBase || !archivoSalida) {
  console.error("Uso: node scripts/paridad.js <urlBase> <archivoSalida>");
  process.exit(1);
}

const json = { "Content-Type": "application/json" };

// Credenciales del administrador (las mismas del .env; por eso el script se corre con --env-file=.env)
const email = process.env.ADMIN_EMAIL ?? "admin@gimnasio.com";
const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error("Falta ADMIN_PASSWORD: correr con  node --env-file=.env scripts/paridad.js ...");
  process.exit(1);
}

// Cada paso: [nombre, método, ruta, body, opcion]. Los ids dependen del orden, por eso la secuencia es fija.
// Los pedidos que modifican datos llevan el token del administrador, salvo que la opción diga otra cosa:
//   "sin-token"   -> no se manda el encabezado Authorization
//   "token-falso" -> se manda un token inventado
const pasos = [
  ["health", "GET", "/health"],

  // Autenticación
  ["login ok", "POST", "/auth/login", { email, password }],
  ["login contraseña incorrecta", "POST", "/auth/login", { email, password: "incorrecta" }],
  ["login email inexistente", "POST", "/auth/login", { email: "nadie@mail.com", password }],
  ["login body invalido", "POST", "/auth/login", { email: "x" }],
  ["escritura sin token", "POST", "/socios", {}, "sin-token"],
  ["escritura con token falso", "POST", "/socios", {}, "token-falso"],
  ["borrar sin token", "DELETE", "/socios/1", undefined, "sin-token"],
  ["cancelar sin token", "PATCH", "/inscripciones/1/cancelar", undefined, "sin-token"],

  // Socios: listados, filtros, orden y paginación
  ["socios lista", "GET", "/socios"],
  ["socios paginado y ordenado", "GET", "/socios?limit=2&page=2&sort=-apellido"],
  ["socios busqueda q", "GET", "/socios?q=gom"],
  ["socios inactivos", "GET", "/socios?activo=false"],
  ["socios page invalida", "GET", "/socios?page=0"],
  ["socios sort invalido", "GET", "/socios?sort=edad"],

  // Socios: alta, duplicados, validación, modificación, 404
  ["socio crear", "POST", "/socios", { nombre: "Julia", apellido: "Medina", email: "Julia.Medina@mail.com", dni: "33444555" }],
  ["socio email duplicado", "POST", "/socios", { nombre: "X", apellido: "Y", email: "julia.medina@mail.com", dni: "40000001" }],
  ["socio dni duplicado", "POST", "/socios", { nombre: "X", apellido: "Y", email: "x@mail.com", dni: "33444555" }],
  ["socio body vacio", "POST", "/socios", {}],
  ["socio obtener", "GET", "/socios/4"],
  ["socio obtener inexistente", "GET", "/socios/999"],
  ["socio id invalido", "GET", "/socios/abc"],
  ["socio modificar", "PUT", "/socios/4", { telefono: "1155559999" }],
  ["socio modificar email ajeno", "PUT", "/socios/4", { email: "martin.gomez@mail.com" }],
  ["socio modificar inexistente", "PUT", "/socios/999", { nombre: "Nadie" }],

  // Clases
  ["clases lista", "GET", "/clases"],
  ["clases con cupo ordenadas", "GET", "/clases?conCupo=true&sort=-horario&limit=2"],
  ["clases por dia", "GET", "/clases?dia=lunes"],
  ["clases por instructor", "GET", "/clases?instructor=ana"],
  ["clase crear", "POST", "/clases", { nombre: "Pilates", instructor: "Marina Ruiz", dia: "martes", horario: "10:30", cupoMaximo: 12 }],
  ["clase dia invalido", "POST", "/clases", { nombre: "P", instructor: "M", dia: "domingo", horario: "10:30", cupoMaximo: 12 }],
  ["clase obtener inexistente", "GET", "/clases/999"],

  // Inscripciones: reglas de negocio y cupos (Spinning, clase 2, tiene cupo 2)
  ["inscribir socio 1 en clase 2", "POST", "/inscripciones", { socioId: 1, claseId: 2 }],
  ["inscribir de nuevo (ya inscripto)", "POST", "/inscripciones", { socioId: 1, claseId: 2 }],
  ["inscribir socio 2 en clase 2", "POST", "/inscripciones", { socioId: 2, claseId: 2 }],
  ["inscribir sin cupo", "POST", "/inscripciones", { socioId: 4, claseId: 2 }],
  ["inscribir socio inactivo", "POST", "/inscripciones", { socioId: 3, claseId: 1 }],
  ["inscribir socio inexistente", "POST", "/inscripciones", { socioId: 999, claseId: 1 }],
  ["inscribir clase inexistente", "POST", "/inscripciones", { socioId: 1, claseId: 999 }],
  ["inscribir body invalido", "POST", "/inscripciones", { socioId: "a" }],
  ["clase 2 sin cupos", "GET", "/clases/2"],
  ["inscripciones lista", "GET", "/inscripciones"],
  ["inscripciones filtradas", "GET", "/inscripciones?claseId=2&estado=activa"],
  ["inscripcion obtener", "GET", "/inscripciones/1"],
  ["inscripcion inexistente", "GET", "/inscripciones/999"],

  // Relación N a N y reglas cruzadas
  ["clases del socio 1", "GET", "/socios/1/clases"],
  ["socios de la clase 2", "GET", "/clases/2/socios"],
  ["clases de socio inexistente", "GET", "/socios/999/clases"],
  ["borrar socio con inscripciones", "DELETE", "/socios/1"],
  ["borrar clase con inscripciones", "DELETE", "/clases/2"],
  ["bajar cupo por debajo de inscriptos", "PUT", "/clases/2", { cupoMaximo: 1 }],
  ["subir cupo", "PUT", "/clases/2", { cupoMaximo: 5 }],

  // Cancelar y volver a inscribir
  ["cancelar inscripcion 1", "PATCH", "/inscripciones/1/cancelar"],
  ["cancelar de nuevo", "PATCH", "/inscripciones/1/cancelar"],
  ["cancelar inexistente", "PATCH", "/inscripciones/999/cancelar"],
  ["clase 2 despues de cancelar", "GET", "/clases/2"],
  ["reinscribir socio 1 en clase 2", "POST", "/inscripciones", { socioId: 1, claseId: 2 }],
  ["inscripciones lista final", "GET", "/inscripciones"],

  // Borrados que sí se pueden hacer (solo quedan inscripciones canceladas)
  ["cancelar inscripcion 2", "PATCH", "/inscripciones/2/cancelar"],
  ["cancelar inscripcion 3", "PATCH", "/inscripciones/3/cancelar"],
  ["borrar socio 2 (inscripcion cancelada)", "DELETE", "/socios/2"],
  ["borrar socio inexistente", "DELETE", "/socios/999"],
  ["borrar clase 2 (inscripciones canceladas)", "DELETE", "/clases/2"],
  ["inscripciones con socio y clase borrados", "GET", "/inscripciones"],
  ["socios lista final", "GET", "/socios?sort=apellido"],
];

// La fecha de inscripción y el token cambian en cada corrida: se reemplazan para poder comparar
function sinDatosVariables(valor) {
  if (Array.isArray(valor)) return valor.map(sinDatosVariables);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, v]) => {
        if (clave === "fechaInscripcion") return [clave, "<fecha>"];
        if (clave === "token") return [clave, "<token>"];
        return [clave, sinDatosVariables(v)];
      }),
    );
  }
  return valor;
}

// Primero se inicia sesión para tener un token con el que hacer los pedidos que modifican datos
const login = await fetch(`${urlBase}/auth/login`, { method: "POST", headers: json, body: JSON.stringify({ email, password }) });
if (!login.ok) {
  console.error(`No se pudo iniciar sesión (status ${login.status}). Revisar ADMIN_EMAIL y ADMIN_PASSWORD.`);
  process.exit(1);
}
const { token } = await login.json();

const resultados = [];
for (const [nombre, metodo, ruta, body, opcion] of pasos) {
  const encabezados = {};
  if (body) Object.assign(encabezados, json);
  if (metodo !== "GET" && !ruta.startsWith("/auth") && opcion !== "sin-token") {
    encabezados.Authorization = `Bearer ${opcion === "token-falso" ? "abc.def.ghi" : token}`;
  }

  const respuesta = await fetch(urlBase + ruta, {
    method: metodo,
    headers: encabezados,
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await respuesta.text();
  resultados.push({ nombre, pedido: `${metodo} ${ruta}`, status: respuesta.status, body: texto ? sinDatosVariables(JSON.parse(texto)) : null });
}

await writeFile(archivoSalida, JSON.stringify(resultados, null, 2), "utf8");
console.log(`${resultados.length} pedidos guardados en ${archivoSalida}`);
