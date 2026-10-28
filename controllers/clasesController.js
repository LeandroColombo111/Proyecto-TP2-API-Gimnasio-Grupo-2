import AppError from "../errors/AppError.js";

// Controlador de Clases: traduce HTTP <-> casos de uso. No conoce ningún DAO.
class ClasesController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  #noEncontrada() {
    return new AppError("CLASE_NOT_FOUND", "No existe una clase con ese id", 404);
  }

  // GET /clases (?dia=&instructor=&conCupo=&sort=&page=&limit=)
  list = async (req, res) => {
    res.json(await this.#useCases.getClases(req.query));
  };

  // GET /clases/:id/socios
  listSocios = async (req, res) => {
    res.json(await this.#useCases.getSociosDeClase(req.params.id));
  };

  // GET /clases/:id
  get = async (req, res) => {
    const clase = await this.#useCases.getClaseById(req.params.id);
    if (!clase) throw this.#noEncontrada();
    res.json(clase);
  };

  // POST /clases
  create = async (req, res) => {
    const clase = await this.#useCases.createClase(req.body);
    res.status(201).json(clase);
  };

  // PUT /clases/:id
  update = async (req, res) => {
    const clase = await this.#useCases.updateClase(req.params.id, req.body);
    if (!clase) throw this.#noEncontrada();
    res.json(clase);
  };

  // DELETE /clases/:id
  remove = async (req, res) => {
    const borrada = await this.#useCases.deleteClase(req.params.id);
    if (!borrada) throw this.#noEncontrada();
    res.status(204).send();
  };
}

export default ClasesController;
