import { Router } from "express";
import validate, { validateParams } from "../middlewares/validate.js";
import { createClaseSchema, updateClaseSchema, claseIdParamSchema } from "../schemas/claseSchema.js";

// Router de Clases: recibe el controlador ya armado y le asigna validaciones a cada ruta
function createClasesRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", validateParams(claseIdParamSchema), controller.get);
  router.post("/", validate(createClaseSchema), controller.create);
  router.put("/:id", validateParams(claseIdParamSchema), validate(updateClaseSchema), controller.update);
  router.delete("/:id", validateParams(claseIdParamSchema), controller.remove);

  return router;
}

export default createClasesRouter;
