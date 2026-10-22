// Caso de uso: obtener una clase por id (null si no existe; el controlador decide el 404)
async function getClaseById(id, dao) {
  return dao.getById(id);
}

export default getClaseById;
