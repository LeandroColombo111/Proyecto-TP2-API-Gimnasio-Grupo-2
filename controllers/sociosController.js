import AppError from "../errors/AppError.js";

// Controlador de Socios: traduce HTTP <-> casos de uso. No conoce ningún DAO.
class SociosController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  #noEncontrado() {
    return new AppError("SOCIO_NOT_FOUND", "No existe un socio con ese id", 404);
  }

  // GET /socios (?activo=&q=&sort=&page=&limit=)
  list = async (req, res) => {
    res.json(await this.#useCases.getSocios(req.query));
  };

  // GET /socios/:id/clases
  listClases = async (req, res) => {
    res.json(await this.#useCases.getClasesDeSocio(req.params.id));
  };

  // GET /socios/:id
  get = async (req, res) => {
    const socio = await this.#useCases.getSocioById(req.params.id);
    if (!socio) throw this.#noEncontrado();
    res.json(socio);
  };

  // POST /socios
  create = async (req, res) => {
    const socio = await this.#useCases.createSocio(req.body);
    res.status(201).json(socio);
  };

  // PUT /socios/:id
  update = async (req, res) => {
    const socio = await this.#useCases.updateSocio(req.params.id, req.body);
    if (!socio) throw this.#noEncontrado();
    res.json(socio);
  };

  // DELETE /socios/:id
  remove = async (req, res) => {
    const borrado = await this.#useCases.deleteSocio(req.params.id);
    if (!borrado) throw this.#noEncontrado();
    res.status(204).send();
  };
}

export default SociosController;
