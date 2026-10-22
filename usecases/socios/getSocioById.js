// Caso de uso: obtener un socio por id (null si no existe; el controlador decide el 404)
async function getSocioById(id, dao) {
  return dao.getById(id);
}

export default getSocioById;
