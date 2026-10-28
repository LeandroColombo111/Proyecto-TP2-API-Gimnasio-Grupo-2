import getClases from "./getClases.js";
import getClaseById from "./getClaseById.js";
import createClase from "./createClase.js";
import updateClase from "./updateClase.js";
import deleteClase from "./deleteClase.js";
import getSociosDeClase from "./getSociosDeClase.js";

// Factory de casos de uso de Clases: recibe las dependencias y se las inyecta a cada caso de uso.
function makeClaseUseCases({ clasesDao, inscripcionesDao }) {
  return {
    getClases: (query) => getClases(query, clasesDao),
    getClaseById: (id) => getClaseById(id, clasesDao),
    createClase: (data) => createClase(data, clasesDao),
    updateClase: (id, changes) => updateClase(id, changes, clasesDao, inscripcionesDao),
    deleteClase: (id) => deleteClase(id, clasesDao, inscripcionesDao),
    getSociosDeClase: (id) => getSociosDeClase(id, clasesDao, inscripcionesDao),
  };
}

export default makeClaseUseCases;
