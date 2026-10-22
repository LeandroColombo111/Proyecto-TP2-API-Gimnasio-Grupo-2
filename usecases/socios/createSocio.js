import AppError from "../../errors/AppError.js";

// Caso de uso: crear un socio.
// Reglas: el email y el DNI no pueden estar registrados (Zod valida el formato, no la unicidad,
// porque para saber si ya existe hay que consultar los datos).
async function createSocio(data, dao) {
  if (await dao.getByEmail(data.email)) {
    throw new AppError("EMAIL_DUPLICADO", "Ya existe un socio con ese email", 409);
  }
  if (await dao.getByDni(data.dni)) {
    throw new AppError("DNI_DUPLICADO", "Ya existe un socio con ese DNI", 409);
  }
  return dao.save(data);
}

export default createSocio;
