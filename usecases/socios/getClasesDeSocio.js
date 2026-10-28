import AppError from "../../errors/AppError.js";

// Caso de uso: clases en las que el socio tiene una inscripción activa (relación N a N)
async function getClasesDeSocio(id, dao, inscripcionesDao) {
  const socio = await dao.getById(id);
  if (!socio) {
    throw new AppError("SOCIO_NOT_FOUND", "No existe un socio con ese id", 404);
  }
  return inscripcionesDao.getClasesActivasBySocio(id);
}

export default getClasesDeSocio;
