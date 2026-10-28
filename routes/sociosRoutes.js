import { Router } from "express";
import validate, { validateParams, validateQuery } from "../middlewares/validate.js";
import { createSocioSchema, updateSocioSchema, socioIdParamSchema, querySociosSchema } from "../schemas/socioSchema.js";

// Router de Socios: recibe el controlador ya armado y le asigna validaciones a cada ruta
function createSociosRouter(controller) {
  const router = Router();

  router.get("/", validateQuery(querySociosSchema), controller.list);
  router.get("/:id", validateParams(socioIdParamSchema), controller.get);
  router.get("/:id/clases", validateParams(socioIdParamSchema), controller.listClases);
  router.post("/", validate(createSocioSchema), controller.create);
  router.put("/:id", validateParams(socioIdParamSchema), validate(updateSocioSchema), controller.update);
  router.delete("/:id", validateParams(socioIdParamSchema), controller.remove);

  return router;
}

export default createSociosRouter;
