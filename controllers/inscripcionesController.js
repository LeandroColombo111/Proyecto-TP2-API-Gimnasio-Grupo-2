import AppError from "../errors/AppError.js";

// Controlador de Inscripciones: traduce HTTP <-> casos de uso. No conoce ningún DAO.
class InscripcionesController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // GET /inscripciones (?socioId=&claseId=&estado=)
  list = async (req, res) => {
    res.json(await this.#useCases.getInscripciones(req.query));
  };

  // GET /inscripciones/:id
  get = async (req, res) => {
    const inscripcion = await this.#useCases.getInscripcionById(req.params.id);
    if (!inscripcion) {
      throw new AppError("INSCRIPCION_NOT_FOUND", "No existe una inscripción con ese id", 404);
    }
    res.json(inscripcion);
  };

  // POST /inscripciones
  create = async (req, res) => {
    const inscripcion = await this.#useCases.inscribirSocio(req.body);
    res.status(201).json(inscripcion);
  };

  // PATCH /inscripciones/:id/cancelar
  cancelar = async (req, res) => {
    res.json(await this.#useCases.cancelarInscripcion(req.params.id));
  };
}

export default InscripcionesController;
