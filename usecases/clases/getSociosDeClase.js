import AppError from "../../errors/AppError.js";

// Caso de uso: socios con una inscripción activa en la clase (relación N a N)
async function getSociosDeClase(id, dao, inscripcionesDao) {
  const clase = await dao.getById(id);
  if (!clase) {
    throw new AppError("CLASE_NOT_FOUND", "No existe una clase con ese id", 404);
  }
  return inscripcionesDao.getSociosActivosByClase(id);
}

export default getSociosDeClase;
