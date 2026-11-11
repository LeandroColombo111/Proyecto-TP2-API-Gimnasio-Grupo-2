import { Router } from "express";
import validate, { validateParams, validateQuery } from "../middlewares/validate.js";
import {
  createInscripcionSchema,
  inscripcionIdParamSchema,
  queryInscripcionesSchema,
} from "../schemas/inscripcionSchema.js";

// Router de Inscripciones: recibe el controlador y el middleware de autenticación ya armados.
// Los GET son públicos; inscribir y cancelar exigen un token (requireAuth va primero).
function createInscripcionesRouter(controller, requireAuth) {
  const router = Router();

  router.get("/", validateQuery(queryInscripcionesSchema), controller.list);
  router.get("/:id", validateParams(inscripcionIdParamSchema), controller.get);
  router.post("/", requireAuth, validate(createInscripcionSchema), controller.create);
  router.patch("/:id/cancelar", requireAuth, validateParams(inscripcionIdParamSchema), controller.cancelar);

  return router;
}

export default createInscripcionesRouter;
