/**
 * DAO de Socios en memoria.
 * Todos los métodos son async para mantener la misma firma que tendrá el DAO de Sequelize.
 */
class SociosMemoryDao {
  // Campos privados: nadie fuera de la clase puede tocar el array directamente
  #socios;
  #nextId;

  constructor(sociosIniciales = [
    { id: 1, nombre: "Lucía", apellido: "Fernández", email: "lucia.fernandez@mail.com", dni: "30123456", telefono: "1155550001", activo: true },
    { id: 2, nombre: "Martín", apellido: "Gómez", email: "martin.gomez@mail.com", dni: "32456789", telefono: null, activo: true },
    { id: 3, nombre: "Sofía", apellido: "Ramírez", email: "sofia.ramirez@mail.com", dni: "35789012", telefono: "1155550003", activo: false },
  ]) {
    this.#socios = sociosIniciales.map((socio) => ({ ...socio }));
    const maxId = this.#socios.reduce((max, socio) => (socio.id > max ? socio.id : max), 0);
    this.#nextId = maxId + 1;
  }

  // Devuelve copias para que quien llama no pueda modificar el estado interno
  async getAll() {
    return this.#socios.map((socio) => ({ ...socio }));
  }

  async getById(id) {
    const socio = this.#socios.find((s) => s.id === Number(id));
    return socio ? { ...socio } : null;
  }

  async getByEmail(email) {
    const socio = this.#socios.find((s) => s.email === email);
    return socio ? { ...socio } : null;
  }

  async getByDni(dni) {
    const socio = this.#socios.find((s) => s.dni === dni);
    return socio ? { ...socio } : null;
  }

  // El id lo asigna el DAO: si el dato trae uno, se ignora
  async save(data) {
    const { id: _ignorado, ...datos } = data;
    const nuevo = { id: this.#nextId, ...datos, telefono: datos.telefono ?? null };
    this.#nextId += 1;
    this.#socios.push(nuevo);
    return { ...nuevo };
  }

  // Devuelve el socio actualizado, o null si no existe. El id no se puede modificar.
  async update(id, changes) {
    const indice = this.#socios.findIndex((s) => s.id === Number(id));
    if (indice === -1) return null;

    const { id: _ignorado, ...cambios } = changes;
    this.#socios[indice] = { ...this.#socios[indice], ...cambios };
    return { ...this.#socios[indice] };
  }

  // Devuelve true si borró, false si no existía
  async delete(id) {
    const indice = this.#socios.findIndex((s) => s.id === Number(id));
    if (indice === -1) return false;

    this.#socios.splice(indice, 1);
    return true;
  }
}

// Se exporta la clase (para tests) y una instancia por defecto (para la app)
export { SociosMemoryDao };
export default new SociosMemoryDao();
