import AppError from "../../errors/AppError.js";

// Caso de uso: borrar una clase (false si no existe).
// Regla: no se puede borrar una clase con inscripciones activas.
async function deleteClase(id, dao, inscripcionesDao) {
  const clase = await dao.getById(id);
  if (!clase) return false;

  if ((await inscripcionesDao.countActivasByClase(id)) > 0) {
    throw new AppError("CLASE_CON_INSCRIPCIONES", "No se puede borrar una clase con inscripciones activas", 409);
  }
  return dao.delete(id);
}

export default deleteClase;
