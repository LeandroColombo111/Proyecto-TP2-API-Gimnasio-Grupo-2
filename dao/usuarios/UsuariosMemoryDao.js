/**
 * DAO de Usuarios en memoria (solo para el login).
 * El hash de la contraseña sale ÚNICAMENTE por getByEmailConHash, que usa el login para comparar.
 * save devuelve el usuario sin el hash, para que no viaje hacia afuera sin necesidad.
 */
class UsuariosMemoryDao {
  #usuarios = [];
  #nextId = 1;

  // Devuelve el usuario CON passwordHash (o null). Solo debe usarlo el login.
  async getByEmailConHash(email) {
    const usuario = this.#usuarios.find((u) => u.email === email);
    return usuario ? { ...usuario } : null;
  }

  // Guarda un usuario y lo devuelve SIN el hash
  async save({ email, passwordHash, rol = "admin" }) {
    const nuevo = { id: this.#nextId, email, passwordHash, rol };
    this.#nextId += 1;
    this.#usuarios.push(nuevo);
    return { id: nuevo.id, email: nuevo.email, rol: nuevo.rol };
  }
}

export { UsuariosMemoryDao };
export default new UsuariosMemoryDao();
