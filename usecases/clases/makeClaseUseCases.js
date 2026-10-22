import getClases from "./getClases.js";
import getClaseById from "./getClaseById.js";
import createClase from "./createClase.js";
import updateClase from "./updateClase.js";
import deleteClase from "./deleteClase.js";

// Factory de casos de uso de Clases: recibe las dependencias y se las inyecta a cada caso de uso.
function makeClaseUseCases({ clasesDao }) {
  return {
    getClases: () => getClases(clasesDao),
    getClaseById: (id) => getClaseById(id, clasesDao),
    createClase: (data) => createClase(data, clasesDao),
    updateClase: (id, changes) => updateClase(id, changes, clasesDao),
    deleteClase: (id) => deleteClase(id, clasesDao),
  };
}

export default makeClaseUseCases;
