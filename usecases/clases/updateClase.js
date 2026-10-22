// Caso de uso: modificar una clase (null si no existe).
async function updateClase(id, changes, dao) {
  const cambios = { ...changes };

  // TODO Sprint 2: cuposDisponibles = cupoMaximo - inscripciones activas, y rechazar con
  // CUPO_INVALIDO si el nuevo cupo es menor a los inscriptos. Por ahora no hay inscripciones.
  if (cambios.cupoMaximo !== undefined) {
    cambios.cuposDisponibles = cambios.cupoMaximo;
  }

  return dao.update(id, cambios);
}

export default updateClase;
