import { Router } from "express";
import validate, { validateParams, validateQuery } from "../middlewares/validate.js";
import { createClaseSchema, updateClaseSchema, claseIdParamSchema, queryClasesSchema } from "../schemas/claseSchema.js";

// Router de Clases: recibe el controlador y el middleware de autenticación ya armados.
// Los GET son públicos; las rutas que modifican datos exigen un token (requireAuth va primero).
function createClasesRouter(controller, requireAuth) {
  const router = Router();

  router.get("/", validateQuery(queryClasesSchema), controller.list);
  router.get("/:id", validateParams(claseIdParamSchema), controller.get);
  router.get("/:id/socios", validateParams(claseIdParamSchema), controller.listSocios);
  router.post("/", requireAuth, validate(createClaseSchema), controller.create);
  router.put("/:id", requireAuth, validateParams(claseIdParamSchema), validate(updateClaseSchema), controller.update);
  router.delete("/:id", requireAuth, validateParams(claseIdParamSchema), controller.remove);

  return router;
}

export default createClasesRouter;
