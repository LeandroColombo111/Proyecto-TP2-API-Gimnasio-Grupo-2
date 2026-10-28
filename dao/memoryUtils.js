// Helpers compartidos por los DAO en memoria para ordenar y paginar un array.
// El DAO de Sequelize hará lo mismo con order/offset/limit en la base.

// sort viene como "campo" (ascendente) o "-campo" (descendente). Sin sort, se deja el orden original.
function ordenar(items, sort) {
  if (!sort) return items;

  const descendente = sort.startsWith("-");
  const campo = descendente ? sort.slice(1) : sort;
  const ordenados = [...items].sort((a, b) => String(a[campo]).localeCompare(String(b[campo]), "es"));
  return descendente ? ordenados.reverse() : ordenados;
}

// page empieza en 1
function paginar(items, page, limit) {
  const desde = (page - 1) * limit;
  return items.slice(desde, desde + limit);
}

export { ordenar, paginar };
