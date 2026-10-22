// Caso de uso: borrar un socio (false si no existe)
// TODO Sprint 2: no permitir borrar si tiene inscripciones activas (SOCIO_CON_INSCRIPCIONES)
async function deleteSocio(id, dao) {
  return dao.delete(id);
}

export default deleteSocio;
