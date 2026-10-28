import armarPagina from "../paginar.js";

// Caso de uso: listar clases con filtros (dia, instructor, conCupo), orden y paginación
async function getClases(query, dao) {
  const { sort, page, limit, ...filtros } = query;
  const resultado = await dao.getAll({ filtros, sort, page, limit });
  return armarPagina(resultado, page, limit);
}

export default getClases;
