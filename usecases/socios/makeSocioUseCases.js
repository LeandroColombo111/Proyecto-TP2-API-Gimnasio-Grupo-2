import getSocios from "./getSocios.js";
import getSocioById from "./getSocioById.js";
import createSocio from "./createSocio.js";
import updateSocio from "./updateSocio.js";
import deleteSocio from "./deleteSocio.js";
import getClasesDeSocio from "./getClasesDeSocio.js";

// Factory de casos de uso de Socios: recibe las dependencias y se las inyecta a cada caso de uso,
// así el controlador los usa sin saber qué DAO hay detrás.
function makeSocioUseCases({ sociosDao, inscripcionesDao }) {
  return {
    getSocios: (query) => getSocios(query, sociosDao),
    getSocioById: (id) => getSocioById(id, sociosDao),
    createSocio: (data) => createSocio(data, sociosDao),
    updateSocio: (id, changes) => updateSocio(id, changes, sociosDao),
    deleteSocio: (id) => deleteSocio(id, sociosDao, inscripcionesDao),
    getClasesDeSocio: (id) => getClasesDeSocio(id, sociosDao, inscripcionesDao),
  };
}

export default makeSocioUseCases;
