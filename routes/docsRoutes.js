import { readFile } from "node:fs/promises";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";

// Lee docs/openapi.yaml una sola vez al arrancar y lo sirve con Swagger UI
async function createDocsRouter() {
  const contenido = await readFile(new URL("../docs/openapi.yaml", import.meta.url), "utf8");
  const documento = parse(contenido);

  const router = Router();
  router.use("/", swaggerUi.serve, swaggerUi.setup(documento));
  return router;
}

export default createDocsRouter;
