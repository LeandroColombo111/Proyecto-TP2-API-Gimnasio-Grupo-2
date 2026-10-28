import { Router } from "express";
import validate, { validateParams, validateQuery } from "../middlewares/validate.js";
import {
  createInscripcionSchema,
  inscripcionIdParamSchema,
  queryInscripcionesSchema,
} from "../schemas/inscripcionSchema.js";

// Router de Inscripciones: recibe el controlador ya armado y le asigna validaciones a cada ruta
function createInscripcionesRouter(controller) {
  const router = Router();

  router.get("/", validateQuery(queryInscripcionesSchema), controller.list);
  router.get("/:id", validateParams(inscripcionIdParamSchema), controller.get);
  router.post("/", validate(createInscripcionSchema), controller.create);
  router.patch("/:id/cancelar", validateParams(inscripcionIdParamSchema), controller.cancelar);

  return router;
}

export default createInscripcionesRouter;
