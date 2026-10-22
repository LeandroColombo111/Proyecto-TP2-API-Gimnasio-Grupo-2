// Caso de uso: listar todos los socios
async function getSocios(dao) {
  return dao.getAll();
}

export default getSocios;
