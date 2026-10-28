import sociosMemoryDao from "../socios/SociosMemoryDao.js";
import clasesMemoryDao from "../clases/ClasesMemoryDao.js";

/**
 * DAO de Inscripciones en memoria.
 * Recibe los DAO de socios y clases para devolver cada inscripción con los datos básicos
 * del socio y de la clase (lo mismo que hará el include de Sequelize).
 */
class InscripcionesMemoryDao {
  #inscripciones = [];
  #nextId = 1;
  #sociosDao;
  #clasesDao;

  constructor(sociosDao = sociosMemoryDao, clasesDao = clasesMemoryDao) {
    this.#sociosDao = sociosDao;
    this.#clasesDao = clasesDao;
  }

  // Agrega { socio, clase } a la inscripción. Si el socio o la clase fueron borrados queda null.
  async #conRelaciones(inscripcion) {
    const socio = await this.#sociosDao.getById(inscripcion.socioId);
    const clase = await this.#clasesDao.getById(inscripcion.claseId);
    return {
      ...inscripcion,
      socio: socio ? { id: socio.id, nombre: socio.nombre, apellido: socio.apellido } : null,
      clase: clase ? { id: clase.id, nombre: clase.nombre, dia: clase.dia, horario: clase.horario } : null,
    };
  }

  // filtros opcionales: socioId, claseId, estado
  async getAll(filtros = {}) {
    const encontradas = this.#inscripciones.filter(
      (i) =>
        (filtros.socioId === undefined || i.socioId === filtros.socioId) &&
        (filtros.claseId === undefined || i.claseId === filtros.claseId) &&
        (filtros.estado === undefined || i.estado === filtros.estado),
    );
    return Promise.all(encontradas.map((i) => this.#conRelaciones(i)));
  }

  async getById(id) {
    const inscripcion = this.#inscripciones.find((i) => i.id === Number(id));
    return inscripcion ? this.#conRelaciones(inscripcion) : null;
  }

  // Inscripción activa de un socio en una clase (o null)
  async findActiva(socioId, claseId) {
    const inscripcion = this.#inscripciones.find(
      (i) => i.socioId === socioId && i.claseId === claseId && i.estado === "activa",
    );
    return inscripcion ? { ...inscripcion } : null;
  }

  async countActivasByClase(claseId) {
    return this.#inscripciones.filter((i) => i.claseId === Number(claseId) && i.estado === "activa").length;
  }

  async countActivasBySocio(socioId) {
    return this.#inscripciones.filter((i) => i.socioId === Number(socioId) && i.estado === "activa").length;
  }

  // Clases en las que el socio tiene una inscripción activa
  async getClasesActivasBySocio(socioId) {
    const activas = this.#inscripciones.filter((i) => i.socioId === Number(socioId) && i.estado === "activa");
    const clases = await Promise.all(activas.map((i) => this.#clasesDao.getById(i.claseId)));
    return clases.filter(Boolean);
  }

  // Socios con una inscripción activa en la clase
  async getSociosActivosByClase(claseId) {
    const activas = this.#inscripciones.filter((i) => i.claseId === Number(claseId) && i.estado === "activa");
    const socios = await Promise.all(activas.map((i) => this.#sociosDao.getById(i.socioId)));
    return socios.filter(Boolean);
  }

  // Crea la inscripción Y resta 1 al cupo de la clase. Devuelve null si la clase no tiene cupo.
  // Primero se reserva el cupo con ajustarCupo (que chequea y resta sin ningún await en el medio,
  // por eso es atómico en memoria) y recién después se guarda la inscripción.
  async inscribir({ socioId, claseId }) {
    const clase = await this.#clasesDao.ajustarCupo(claseId, -1);
    if (!clase) return null;

    const nueva = {
      id: this.#nextId,
      socioId,
      claseId,
      fechaInscripcion: new Date().toISOString(),
      estado: "activa",
    };
    this.#nextId += 1;
    this.#inscripciones.push(nueva);
    return this.#conRelaciones(nueva);
  }

  // Pone la inscripción en "cancelada" Y devuelve el cupo a la clase. Devuelve null si no existe.
  async cancelar(id) {
    const inscripcion = this.#inscripciones.find((i) => i.id === Number(id));
    if (!inscripcion) return null;

    inscripcion.estado = "cancelada";
    await this.#clasesDao.ajustarCupo(inscripcion.claseId, 1);
    return this.#conRelaciones(inscripcion);
  }
}

export { InscripcionesMemoryDao };
export default new InscripcionesMemoryDao();
