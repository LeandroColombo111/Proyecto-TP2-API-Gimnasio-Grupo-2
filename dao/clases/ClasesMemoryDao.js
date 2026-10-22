/**
 * DAO de Clases en memoria.
 * Todos los métodos son async para mantener la misma firma que tendrá el DAO de Sequelize.
 */
class ClasesMemoryDao {
  #clases;
  #nextId;

  constructor(clasesIniciales = [
    { id: 1, nombre: "Funcional", instructor: "Carlos Pérez", dia: "lunes", horario: "08:00", cupoMaximo: 10, cuposDisponibles: 10 },
    { id: 2, nombre: "Spinning", instructor: "Ana Torres", dia: "miercoles", horario: "19:00", cupoMaximo: 2, cuposDisponibles: 2 },
    { id: 3, nombre: "Yoga", instructor: "Laura Díaz", dia: "viernes", horario: "18:00", cupoMaximo: 15, cuposDisponibles: 15 },
  ]) {
    this.#clases = clasesIniciales.map((clase) => ({ ...clase }));
    const maxId = this.#clases.reduce((max, clase) => (clase.id > max ? clase.id : max), 0);
    this.#nextId = maxId + 1;
  }

  async getAll() {
    return this.#clases.map((clase) => ({ ...clase }));
  }

  async getById(id) {
    const clase = this.#clases.find((c) => c.id === Number(id));
    return clase ? { ...clase } : null;
  }

  // El id lo asigna el DAO: si el dato trae uno, se ignora
  async save(data) {
    const { id: _ignorado, ...datos } = data;
    const nueva = { id: this.#nextId, ...datos };
    this.#nextId += 1;
    this.#clases.push(nueva);
    return { ...nueva };
  }

  // Devuelve la clase actualizada, o null si no existe. El id no se puede modificar.
  async update(id, changes) {
    const indice = this.#clases.findIndex((c) => c.id === Number(id));
    if (indice === -1) return null;

    const { id: _ignorado, ...cambios } = changes;
    this.#clases[indice] = { ...this.#clases[indice], ...cambios };
    return { ...this.#clases[indice] };
  }

  // Devuelve true si borró, false si no existía
  async delete(id) {
    const indice = this.#clases.findIndex((c) => c.id === Number(id));
    if (indice === -1) return false;

    this.#clases.splice(indice, 1);
    return true;
  }
}

export { ClasesMemoryDao };
export default new ClasesMemoryDao();
