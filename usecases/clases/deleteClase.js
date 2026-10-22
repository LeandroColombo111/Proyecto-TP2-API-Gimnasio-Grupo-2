// Caso de uso: borrar una clase (false si no existe)
// TODO Sprint 2: no permitir borrar si tiene inscripciones activas (CLASE_CON_INSCRIPCIONES)
async function deleteClase(id, dao) {
  return dao.delete(id);
}

export default deleteClase;
