import { Router } from "express";
import validate from "../middlewares/validate.js";
import { loginSchema } from "../schemas/authSchema.js";

// Router de autenticación: el login es público (no lleva requireAuth)
function createAuthRouter(controller) {
  const router = Router();

  router.post("/login", validate(loginSchema), controller.login);

  return router;
}

export default createAuthRouter;
