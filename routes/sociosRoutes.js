import { Router } from "express";
import validate, { validateParams } from "../middlewares/validate.js";
import { createSocioSchema, updateSocioSchema, socioIdParamSchema } from "../schemas/socioSchema.js";

// Router de Socios: recibe el controlador ya armado y le asigna validaciones a cada ruta
function createSociosRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", validateParams(socioIdParamSchema), controller.get);
  router.post("/", validate(createSocioSchema), controller.create);
  router.put("/:id", validateParams(socioIdParamSchema), validate(updateSocioSchema), controller.update);
  router.delete("/:id", validateParams(socioIdParamSchema), controller.remove);

  return router;
}

export default createSociosRouter;
