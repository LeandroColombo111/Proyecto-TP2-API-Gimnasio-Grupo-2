import { Op } from "sequelize";
import { SocioModel, sincronizar } from "../models/index.js";
import { armarOrden, armarPagina, aPlano } from "../sequelizeUtils.js";

/**
 * DAO de Socios con Sequelize (SQLite).
 * Tiene EXACTAMENTE la misma interfaz que SociosMemoryDao: los casos de uso no notan la diferencia.
 */
class SociosSequelizeDao {
  // Crea las tablas y, si la tabla está vacía, carga los mismos datos de ejemplo que el DAO en memoria
  async init() {
    await sincronizar();

    if ((await SocioModel.count()) === 0) {
      await SocioModel.bulkCreate([
        { nombre: "Lucía", apellido: "Fernández", email: "lucia.fernandez@mail.com", dni: "30123456", telefono: "1155550001", activo: true },
        { nombre: "Martín", apellido: "Gómez", email: "martin.gomez@mail.com", dni: "32456789", telefono: null, activo: true },
        { nombre: "Sofía", apellido: "Ramírez", email: "sofia.ramirez@mail.com", dni: "35789012", telefono: "1155550003", activo: false },
      ]);
    }
  }

  // Filtra, ordena y pagina en la base. Devuelve { items, total } (total = cantidad antes de paginar).
  async getAll({ filtros = {}, sort, page = 1, limit = 10 } = {}) {
    const where = {};

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }
    if (filtros.q) {
      const texto = `%${filtros.q}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: texto } },
        { apellido: { [Op.like]: texto } },
        { email: { [Op.like]: texto } },
      ];
    }

    // findAndCountAll trae la página y, en la misma llamada, el total de resultados
    const { rows, count } = await SocioModel.findAndCountAll({
      where,
      order: armarOrden(sort),
      ...armarPagina(page, limit),
    });
    return { items: rows.map(aPlano), total: count };
  }

  async getById(id) {
    const socio = await SocioModel.findByPk(id);
    return socio ? aPlano(socio) : null;
  }

  async getByEmail(email) {
    const socio = await SocioModel.findOne({ where: { email } });
    return socio ? aPlano(socio) : null;
  }

  async getByDni(dni) {
    const socio = await SocioModel.findOne({ where: { dni } });
    return socio ? aPlano(socio) : null;
  }

  // El id lo asigna la base: si el dato trae uno, se ignora
  async save(data) {
    const { id: _ignorado, ...datos } = data;
    const nuevo = await SocioModel.create({ ...datos, telefono: datos.telefono ?? null });
    return aPlano(nuevo);
  }

  // Devuelve el socio actualizado, o null si no existe. El id no se puede modificar.
  async update(id, changes) {
    const socio = await SocioModel.findByPk(id);
    if (!socio) return null;

    const { id: _ignorado, ...cambios } = changes;
    await socio.update(cambios);
    return aPlano(socio);
  }

  // Devuelve true si borró, false si no existía
  async delete(id) {
    const borrados = await SocioModel.destroy({ where: { id } });
    return borrados > 0;
  }
}

export { SociosSequelizeDao };
export default new SociosSequelizeDao();
