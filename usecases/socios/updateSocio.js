import AppError from "../../errors/AppError.js";

// Caso de uso: modificar un socio (null si no existe).
// Misma regla de unicidad que en el alta, pero excluyendo al propio socio:
// si conserva su email o DNI no es un duplicado.
async function updateSocio(id, changes, dao) {
  const actual = await dao.getById(id);
  if (!actual) return null;

  if (changes.email !== undefined) {
    const otro = await dao.getByEmail(changes.email);
    if (otro && otro.id !== actual.id) {
      throw new AppError("EMAIL_DUPLICADO", "Ya existe un socio con ese email", 409);
    }
  }
  if (changes.dni !== undefined) {
    const otro = await dao.getByDni(changes.dni);
    if (otro && otro.id !== actual.id) {
      throw new AppError("DNI_DUPLICADO", "Ya existe un socio con ese DNI", 409);
    }
  }

  return dao.update(id, changes);
}

export default updateSocio;
