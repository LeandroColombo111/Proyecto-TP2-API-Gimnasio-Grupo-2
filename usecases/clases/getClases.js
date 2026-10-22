// Caso de uso: listar todas las clases
async function getClases(dao) {
  return dao.getAll();
}

export default getClases;
