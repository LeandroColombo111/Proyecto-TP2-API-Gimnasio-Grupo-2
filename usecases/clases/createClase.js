// Caso de uso: crear una clase.
// cuposDisponibles no viene en el body: al crear, todos los cupos están libres.
async function createClase(data, dao) {
  return dao.save({ ...data, cuposDisponibles: data.cupoMaximo });
}

export default createClase;
