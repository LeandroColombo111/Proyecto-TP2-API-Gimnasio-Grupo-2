import AppError from "../../errors/AppError.js";

// Caso de uso: modificar una clase (null si no existe).
// Si cambia cupoMaximo: no puede quedar por debajo de los inscriptos activos, y
// los cupos disponibles se recalculan como cupoMaximo - inscriptos activos.
async function updateClase(id, changes, dao, inscripcionesDao) {
  const actual = await dao.getById(id);
  if (!actual) return null;

  const cambios = { ...changes };

  if (cambios.cupoMaximo !== undefined) {
    const activas = await inscripcionesDao.countActivasByClase(id);
    if (cambios.cupoMaximo < activas) {
      throw new AppError(
        "CUPO_INVALIDO",
        `El cupo máximo no puede ser menor a los inscriptos activos (${activas})`,
        409,
      );
    }
    cambios.cuposDisponibles = cambios.cupoMaximo - activas;
  }

  return dao.update(id, cambios);
}

export default updateClase;
