import { UsuarioModel, sincronizar } from "../models/index.js";
import { aPlano } from "../sequelizeUtils.js";

/**
 * DAO de Usuarios con Sequelize (SQLite). Misma interfaz que UsuariosMemoryDao.
 * El hash de la contraseña sale ÚNICAMENTE por getByEmailConHash, que usa el login para comparar.
 */
class UsuariosSequelizeDao {
  async init() {
    await sincronizar();
  }

  // Devuelve el usuario CON passwordHash (o null). Solo debe usarlo el login.
  async getByEmailConHash(email) {
    const usuario = await UsuarioModel.findOne({ where: { email } });
    return usuario ? aPlano(usuario) : null;
  }

  // Guarda un usuario y lo devuelve SIN el hash
  async save({ email, passwordHash, rol = "admin" }) {
    const nuevo = await UsuarioModel.create({ email, passwordHash, rol });
    return { id: nuevo.id, email: nuevo.email, rol: nuevo.rol };
  }
}

export { UsuariosSequelizeDao };
export default new UsuariosSequelizeDao();
