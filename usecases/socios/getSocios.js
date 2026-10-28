import armarPagina from "../paginar.js";

// Caso de uso: listar socios con filtros (activo, q), orden y paginación
async function getSocios(query, dao) {
  const { sort, page, limit, ...filtros } = query;
  const resultado = await dao.getAll({ filtros, sort, page, limit });
  return armarPagina(resultado, page, limit);
}

export default getSocios;
