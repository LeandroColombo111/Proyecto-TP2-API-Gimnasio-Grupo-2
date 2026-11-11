import { SociosMemoryDao } from "../../dao/socios/SociosMemoryDao.js";
import { ClasesMemoryDao } from "../../dao/clases/ClasesMemoryDao.js";
import { InscripcionesMemoryDao } from "../../dao/inscripciones/InscripcionesMemoryDao.js";
import { UsuariosMemoryDao } from "../../dao/usuarios/UsuariosMemoryDao.js";
import { createEventBus } from "../../events/eventBus.js";
import makeSocioUseCases from "../../usecases/socios/makeSocioUseCases.js";
import makeClaseUseCases from "../../usecases/clases/makeClaseUseCases.js";
import makeInscripcionUseCases from "../../usecases/inscripciones/makeInscripcionUseCases.js";
import makeAuthUseCases from "../../usecases/auth/makeAuthUseCases.js";
import { EVENTS } from "../../events/eventNames.js";

// Arma todo lo que necesitan los tests, con DAO en memoria NUEVOS (con los datos de ejemplo).
// Cada test llama a crearEntorno() y así empieza de cero: los tests no se afectan entre sí.
function crearEntorno() {
  const sociosDao = new SociosMemoryDao();
  const clasesDao = new ClasesMemoryDao();
  const inscripcionesDao = new InscripcionesMemoryDao(sociosDao, clasesDao);
  const usuariosDao = new UsuariosMemoryDao();

  // Bus real, pero anotamos cada evento emitido para poder verificarlo después
  const events = createEventBus();
  const eventos = [];
  for (const nombre of Object.values(EVENTS)) {
    events.on(nombre, (payload) => eventos.push({ nombre, payload }));
  }

  return {
    sociosDao,
    clasesDao,
    inscripcionesDao,
    usuariosDao,
    events,
    eventos,
    socios: makeSocioUseCases({ sociosDao, inscripcionesDao }),
    clases: makeClaseUseCases({ clasesDao, inscripcionesDao }),
    inscripciones: makeInscripcionUseCases({ inscripcionesDao, sociosDao, clasesDao, events }),
  };
}

// Servicios de auth falsos: rápidos y predecibles (no usan bcrypt ni jsonwebtoken).
// Así el test del caso de uso prueba SU lógica y no las librerías.
function crearServiciosAuthFalsos() {
  const tokensEmitidos = [];
  const passwordService = {
    hashear: async (password) => `hash(${password})`,
    comparar: async (password, hash) => hash === `hash(${password})`,
  };
  const tokenService = {
    expiresIn: "1h",
    firmar: (payload) => {
      tokensEmitidos.push(payload);
      return "token-falso";
    },
  };
  return { passwordService, tokenService, tokensEmitidos };
}

function crearEntornoAuth() {
  const usuariosDao = new UsuariosMemoryDao();
  const { passwordService, tokenService, tokensEmitidos } = crearServiciosAuthFalsos();
  return {
    usuariosDao,
    passwordService,
    tokensEmitidos,
    auth: makeAuthUseCases({ usuariosDao, passwordService, tokenService }),
  };
}

export { crearEntorno, crearEntornoAuth };
