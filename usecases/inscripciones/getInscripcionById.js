// Caso de uso: obtener una inscripción por id (null si no existe; el controlador decide el 404)
async function getInscripcionById(id, dao) {
  return dao.getById(id);
}

export default getInscripcionById;
