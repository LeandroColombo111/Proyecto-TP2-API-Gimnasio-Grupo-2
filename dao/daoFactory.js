import { PERSISTENCE_TYPE } from "../config/config.js";
import sociosMemoryDao from "./socios/SociosMemoryDao.js";
import sociosSequelizeDao from "./socios/SociosSequelizeDao.js";
import clasesMemoryDao from "./clases/ClasesMemoryDao.js";
import clasesSequelizeDao from "./clases/ClasesSequelizeDao.js";
import inscripcionesMemoryDao from "./inscripciones/InscripcionesMemoryDao.js";
import inscripcionesSequelizeDao from "./inscripciones/InscripcionesSequelizeDao.js";
import usuariosMemoryDao from "./usuarios/UsuariosMemoryDao.js";
import usuariosSequelizeDao from "./usuarios/UsuariosSequelizeDao.js";

// Factory de DAOs: devuelve la implementación que corresponde según PERSISTENCE_TYPE ("memory" o "sequelize").
// Los casos de uso nunca saben cuál les tocó.
function getSociosDao() {
  return PERSISTENCE_TYPE === "sequelize" ? sociosSequelizeDao : sociosMemoryDao;
}

function getClasesDao() {
  return PERSISTENCE_TYPE === "sequelize" ? clasesSequelizeDao : clasesMemoryDao;
}

function getInscripcionesDao() {
  return PERSISTENCE_TYPE === "sequelize" ? inscripcionesSequelizeDao : inscripcionesMemoryDao;
}

function getUsuariosDao() {
  return PERSISTENCE_TYPE === "sequelize" ? usuariosSequelizeDao : usuariosMemoryDao;
}

export { getSociosDao, getClasesDao, getInscripcionesDao, getUsuariosDao };
