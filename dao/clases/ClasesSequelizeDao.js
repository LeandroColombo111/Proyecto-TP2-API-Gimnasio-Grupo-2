import { Op } from "sequelize";
import { ClaseModel, sincronizar } from "../models/index.js";
import { armarOrden, armarPagina, aPlano } from "../sequelizeUtils.js";

/**
 * DAO de Clases con Sequelize (SQLite).
 * Tiene EXACTAMENTE la misma interfaz que ClasesMemoryDao: los casos de uso no notan la diferencia.
 */
class ClasesSequelizeDao {
  // Crea las tablas y, si la tabla está vacía, carga los mismos datos de ejemplo que el DAO en memoria
  async init() {
    await sincronizar();

    if ((await ClaseModel.count()) === 0) {
      await ClaseModel.bulkCreate([
        { nombre: "Funcional", instructor: "Carlos Pérez", dia: "lunes", horario: "08:00", cupoMaximo: 10, cuposDisponibles: 10 },
        { nombre: "Spinning", instructor: "Ana Torres", dia: "miercoles", horario: "19:00", cupoMaximo: 2, cuposDisponibles: 2 },
        { nombre: "Yoga", instructor: "Laura Díaz", dia: "viernes", horario: "18:00", cupoMaximo: 15, cuposDisponibles: 15 },
      ]);
    }
  }

  // Filtra, ordena y pagina en la base. Devuelve { items, total } (total = cantidad antes de paginar).
  async getAll({ filtros = {}, sort, page = 1, limit = 10 } = {}) {
    const where = {};

    if (filtros.dia) {
      where.dia = filtros.dia;
    }
    if (filtros.instructor) {
      where.instructor = { [Op.like]: `%${filtros.instructor}%` };
    }
    if (filtros.conCupo !== undefined) {
      // conCupo=true: con cupos libres; conCupo=false: sin cupos libres
      where.cuposDisponibles = filtros.conCupo ? { [Op.gt]: 0 } : { [Op.lte]: 0 };
    }

    const { rows, count } = await ClaseModel.findAndCountAll({
      where,
      order: armarOrden(sort),
      ...armarPagina(page, limit),
    });
    return { items: rows.map(aPlano), total: count };
  }

  async getById(id) {
    const clase = await ClaseModel.findByPk(id);
    return clase ? aPlano(clase) : null;
  }

  // El id lo asigna la base: si el dato trae uno, se ignora
  async save(data) {
    const { id: _ignorado, ...datos } = data;
    const nueva = await ClaseModel.create(datos);
    return aPlano(nueva);
  }

  // Devuelve la clase actualizada, o null si no existe. El id no se puede modificar.
  async update(id, changes) {
    const clase = await ClaseModel.findByPk(id);
    if (!clase) return null;

    const { id: _ignorado, ...cambios } = changes;
    await clase.update(cambios);
    return aPlano(clase);
  }

  // Suma delta (+1 / -1) a los cupos disponibles. Devuelve la clase actualizada, o null si no existe
  // o si el resultado quedaría fuera de 0..cupoMaximo (igual que el DAO en memoria).
  async ajustarCupo(id, delta) {
    const clase = await ClaseModel.findByPk(id);
    if (!clase) return null;

    const nuevo = clase.cuposDisponibles + delta;
    if (nuevo < 0 || nuevo > clase.cupoMaximo) return null;

    await clase.update({ cuposDisponibles: nuevo });
    return aPlano(clase);
  }

  // Devuelve true si borró, false si no existía
  async delete(id) {
    const borradas = await ClaseModel.destroy({ where: { id } });
    return borradas > 0;
  }
}

export { ClasesSequelizeDao };
export default new ClasesSequelizeDao();
