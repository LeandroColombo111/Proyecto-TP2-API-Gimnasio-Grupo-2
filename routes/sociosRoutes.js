import { Router } from "express";
import validate, { validateParams, validateQuery } from "../middlewares/validate.js";
import { createSocioSchema, updateSocioSchema, socioIdParamSchema, querySociosSchema } from "../schemas/socioSchema.js";

// Router de Socios: recibe el controlador y el middleware de autenticación ya armados.
// Los GET son públicos; las rutas que modifican datos exigen un token (requireAuth va primero).
function createSociosRouter(controller, requireAuth) {
  const router = Router();

  router.get("/", validateQuery(querySociosSchema), controller.list);
  router.get("/:id", validateParams(socioIdParamSchema), controller.get);
  router.get("/:id/clases", validateParams(socioIdParamSchema), controller.listClases);
  router.post("/", requireAuth, validate(createSocioSchema), controller.create);
  router.put("/:id", requireAuth, validateParams(socioIdParamSchema), validate(updateSocioSchema), controller.update);
  router.delete("/:id", requireAuth, validateParams(socioIdParamSchema), controller.remove);

  return router;
}

export default createSociosRouter;
