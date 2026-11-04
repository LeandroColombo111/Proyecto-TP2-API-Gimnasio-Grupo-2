import { sequelize, SocioModel, ClaseModel, InscripcionModel, sincronizar } from "../models/index.js";
import { aPlano } from "../sequelizeUtils.js";

// Cada inscripción se devuelve con los datos básicos del socio y de la clase (include),
// con la misma forma que arma el DAO en memoria. Si el socio o la clase fueron borrados queda null.
const INCLUIR = [
  { model: SocioModel, as: "socio", attributes: ["id", "nombre", "apellido"] },
  { model: ClaseModel, as: "clase", attributes: ["id", "nombre", "dia", "horario"] },
];

/**
 * DAO de Inscripciones con Sequelize (SQLite).
 * Tiene la misma interfaz que InscripcionesMemoryDao. Inscribir y cancelar usan una transacción.
 */
class InscripcionesSequelizeDao {
  async init() {
    await sincronizar();
  }

  // filtros opcionales: socioId, claseId, estado
  async getAll(filtros = {}) {
    const where = {};
    if (filtros.socioId !== undefined) where.socioId = filtros.socioId;
    if (filtros.claseId !== undefined) where.claseId = filtros.claseId;
    if (filtros.estado !== undefined) where.estado = filtros.estado;

    const inscripciones = await InscripcionModel.findAll({ where, include: INCLUIR, order: [["id", "ASC"]] });
    return inscripciones.map(aPlano);
  }

  async getById(id) {
    const inscripcion = await InscripcionModel.findByPk(id, { include: INCLUIR });
    return inscripcion ? aPlano(inscripcion) : null;
  }

  // Inscripción activa de un socio en una clase (o null)
  async findActiva(socioId, claseId) {
    const inscripcion = await InscripcionModel.findOne({ where: { socioId, claseId, estado: "activa" } });
    return inscripcion ? aPlano(inscripcion) : null;
  }

  async countActivasByClase(claseId) {
    return InscripcionModel.count({ where: { claseId, estado: "activa" } });
  }

  async countActivasBySocio(socioId) {
    return InscripcionModel.count({ where: { socioId, estado: "activa" } });
  }

  // Clases en las que el socio tiene una inscripción activa.
  // Se usa la asociación N a N: el include con "through" filtra la tabla intermedia por estado.
  async getClasesActivasBySocio(socioId) {
    const clases = await ClaseModel.findAll({
      include: [
        {
          model: SocioModel,
          as: "socios",
          attributes: [],
          where: { id: socioId },
          through: { attributes: [], where: { estado: "activa" } },
        },
      ],
      order: [["id", "ASC"]],
    });
    return clases.map(quitarRelacion("socios"));
  }

  // Socios con una inscripción activa en la clase
  async getSociosActivosByClase(claseId) {
    const socios = await SocioModel.findAll({
      include: [
        {
          model: ClaseModel,
          as: "clases",
          attributes: [],
          where: { id: claseId },
          through: { attributes: [], where: { estado: "activa" } },
        },
      ],
      order: [["id", "ASC"]],
    });
    return socios.map(quitarRelacion("clases"));
  }

  // Crea la inscripción Y resta 1 al cupo de la clase. Devuelve null si la clase no tiene cupo.
  // Las dos escrituras van en una transacción: o se hacen las dos o no se hace ninguna.
  // Sin transacción, si el proceso se cae entre el create y el decrement, quedaría una inscripción
  // creada con el cupo sin descontar (la clase se podría sobrevender). Con la transacción, si algo falla
  // en el medio, Sequelize hace rollback y la base queda como estaba.
  async inscribir({ socioId, claseId }) {
    const inscripcionId = await sequelize.transaction(async (t) => {
      const clase = await ClaseModel.findByPk(claseId, { transaction: t });
      if (!clase || clase.cuposDisponibles <= 0) return null;

      const inscripcion = await InscripcionModel.create(
        { socioId, claseId, fechaInscripcion: new Date(), estado: "activa" },
        { transaction: t },
      );
      await clase.decrement("cuposDisponibles", { by: 1, transaction: t });
      return inscripcion.id;
    });

    // Se lee después de la transacción para devolver la inscripción con su socio y su clase
    return inscripcionId === null ? null : this.getById(inscripcionId);
  }

  // Pone la inscripción en "cancelada" Y devuelve el cupo a la clase, también en una transacción.
  // Devuelve null si la inscripción no existe.
  async cancelar(id) {
    const encontrada = await sequelize.transaction(async (t) => {
      const inscripcion = await InscripcionModel.findByPk(id, { transaction: t });
      if (!inscripcion) return false;

      await inscripcion.update({ estado: "cancelada" }, { transaction: t });
      await ClaseModel.increment("cuposDisponibles", { by: 1, where: { id: inscripcion.claseId }, transaction: t });
      return true;
    });

    return encontrada ? this.getById(id) : null;
  }
}

// Convierte la instancia en objeto plano y quita la propiedad de la asociación que armó el include
function quitarRelacion(nombre) {
  return (instancia) => {
    const { [nombre]: _ignorada, ...plano } = aPlano(instancia);
    return plano;
  };
}

export { InscripcionesSequelizeDao };
export default new InscripcionesSequelizeDao();
