// Arma la respuesta paginada { data, meta } a partir de lo que devuelve el DAO ({ items, total })
function armarPagina({ items, total }, page, limit) {
  return {
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export default armarPagina;
