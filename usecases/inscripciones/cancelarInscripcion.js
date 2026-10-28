import AppError from "../../errors/AppError.js";

// Caso de uso: cancelar una inscripción. El DAO cambia el estado y devuelve el cupo juntos.
async function cancelarInscripcion(id, dao) {
  const inscripcion = await dao.getById(id);
  if (!inscripcion) {
    throw new AppError("INSCRIPCION_NOT_FOUND", "No existe una inscripción con ese id", 404);
  }

  if (inscripcion.estado === "cancelada") {
    throw new AppError("INSCRIPCION_YA_CANCELADA", "La inscripción ya estaba cancelada", 409);
  }

  return dao.cancelar(id);
}

export default cancelarInscripcion;
