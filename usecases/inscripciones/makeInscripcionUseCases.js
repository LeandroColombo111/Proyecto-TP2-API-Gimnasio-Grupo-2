import getInscripciones from "./getInscripciones.js";
import getInscripcionById from "./getInscripcionById.js";
import inscribirSocio from "./inscribirSocio.js";
import cancelarInscripcion from "./cancelarInscripcion.js";

// Factory de casos de uso de Inscripciones: recibe las dependencias y se las inyecta a cada caso de uso.
function makeInscripcionUseCases({ inscripcionesDao, sociosDao, clasesDao, events }) {
  return {
    getInscripciones: (filtros) => getInscripciones(filtros, inscripcionesDao),
    getInscripcionById: (id) => getInscripcionById(id, inscripcionesDao),
    inscribirSocio: (data) => inscribirSocio(data, { inscripcionesDao, sociosDao, clasesDao, events }),
    cancelarInscripcion: (id) => cancelarInscripcion(id, inscripcionesDao),
  };
}

export default makeInscripcionUseCases;
