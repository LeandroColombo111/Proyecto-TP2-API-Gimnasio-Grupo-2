import { PERSISTENCE_TYPE } from "../config/config.js";
import sociosMemoryDao from "./socios/SociosMemoryDao.js";
import clasesMemoryDao from "./clases/ClasesMemoryDao.js";

// Factory de DAOs: devuelve la implementación que corresponde según PERSISTENCE_TYPE.
// Los casos de uso nunca saben cuál les tocó.
function getSociosDao() {
  if (PERSISTENCE_TYPE === "sequelize") {
    // TODO Sprint 3: devolver SociosSequelizeDao
    throw new Error("La persistencia sequelize todavía no está implementada");
  }
  return sociosMemoryDao;
}

function getClasesDao() {
  if (PERSISTENCE_TYPE === "sequelize") {
    // TODO Sprint 3: devolver ClasesSequelizeDao
    throw new Error("La persistencia sequelize todavía no está implementada");
  }
  return clasesMemoryDao;
}

export { getSociosDao, getClasesDao };
