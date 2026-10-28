// Caso de uso: listar inscripciones, con filtros opcionales (socioId, claseId, estado)
async function getInscripciones(filtros, dao) {
  return dao.getAll(filtros);
}

export default getInscripciones;
