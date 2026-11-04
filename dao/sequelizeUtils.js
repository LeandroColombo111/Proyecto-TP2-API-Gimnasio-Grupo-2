import { fn, col } from "sequelize";

// Helpers compartidos por los DAO de Sequelize. Hacen en la base lo mismo que memoryUtils.js hace en un array.

// sort viene como "campo" (ascendente) o "-campo" (descendente). Sin sort se ordena por id.
// Se compara en minúsculas para que "ana" y "Ana" queden juntas, y el id desempata.
function armarOrden(sort) {
  if (!sort) return [["id", "ASC"]];

  const descendente = sort.startsWith("-");
  const campo = descendente ? sort.slice(1) : sort;
  return [[fn("lower", col(campo)), descendente ? "DESC" : "ASC"], ["id", "ASC"]];
}

// page empieza en 1
function armarPagina(page, limit) {
  return { limit, offset: (page - 1) * limit };
}

// Los DAO tienen que devolver objetos planos, nunca instancias del modelo
function aPlano(instancia) {
  return instancia.get({ plain: true });
}

export { armarOrden, armarPagina, aPlano };
