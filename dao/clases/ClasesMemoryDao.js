import { ordenar, paginar } from "../memoryUtils.js";

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

  // Filtra, ordena y pagina. Devuelve { items, total } (total = cantidad antes de paginar).
  async getAll({ filtros = {}, sort, page = 1, limit = 10 } = {}) {
    let clases = this.#clases;

    if (filtros.dia) {
      clases = clases.filter((c) => c.dia === filtros.dia);
    }
    if (filtros.instructor) {
      const texto = filtros.instructor.toLowerCase();
      clases = clases.filter((c) => c.instructor.toLowerCase().includes(texto));
    }
    if (filtros.conCupo !== undefined) {
      clases = clases.filter((c) => (c.cuposDisponibles > 0) === filtros.conCupo);
    }

    const ordenadas = ordenar(clases, sort);
    const items = paginar(ordenadas, page, limit).map((clase) => ({ ...clase }));
    return { items, total: ordenadas.length };
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

  // Suma delta (+1 / -1) a los cupos disponibles. Devuelve la clase actualizada, o null si no existe
  // o si el resultado quedaría fuera de 0..cupoMaximo (ej: no hay cupo para restar).
  // El chequeo y la escritura no tienen ningún await en el medio: como Node ejecuta de a un
  // pedido por vez, dos inscripciones simultáneas no pueden quedarse con el último cupo.
  async ajustarCupo(id, delta) {
    const clase = this.#clases.find((c) => c.id === Number(id));
    if (!clase) return null;

    const nuevo = clase.cuposDisponibles + delta;
    if (nuevo < 0 || nuevo > clase.cupoMaximo) return null;

    clase.cuposDisponibles = nuevo;
    return { ...clase };
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
