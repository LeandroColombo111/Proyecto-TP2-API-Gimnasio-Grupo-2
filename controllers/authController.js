// Controlador de autenticación: traduce HTTP <-> casos de uso. No conoce ningún DAO.
class AuthController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  // POST /auth/login
  login = async (req, res) => {
    res.json(await this.#useCases.login(req.body));
  };
}

export default AuthController;
