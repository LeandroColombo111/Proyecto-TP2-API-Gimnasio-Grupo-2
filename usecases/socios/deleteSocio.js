import AppError from "../../errors/AppError.js";

// Caso de uso: borrar un socio (false si no existe).
// Regla: no se puede borrar un socio con inscripciones activas.
async function deleteSocio(id, dao, inscripcionesDao) {
  const socio = await dao.getById(id);
  if (!socio) return false;

  if ((await inscripcionesDao.countActivasBySocio(id)) > 0) {
    throw new AppError("SOCIO_CON_INSCRIPCIONES", "No se puede borrar un socio con inscripciones activas", 409);
  }
  return dao.delete(id);
}

export default deleteSocio;
