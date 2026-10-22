import { Router } from "express";
import { getSociosDao, getClasesDao } from "../dao/daoFactory.js";
import makeSocioUseCases from "../usecases/socios/makeSocioUseCases.js";
import makeClaseUseCases from "../usecases/clases/makeClaseUseCases.js";
import SociosController from "../controllers/sociosController.js";
import ClasesController from "../controllers/clasesController.js";
import createSociosRouter from "../routes/sociosRoutes.js";
import createClasesRouter from "../routes/clasesRoutes.js";
import createDocsRouter from "../routes/docsRoutes.js";

// Composition Root: acá se arman DAOs -> casos de uso -> controladores -> routers
async function buildContainer() {
  // 1. DAOs (la factory elige según PERSISTENCE_TYPE)
  const sociosDao = getSociosDao();
  const clasesDao = getClasesDao();

  // 2. Casos de uso, con sus dependencias inyectadas
  const socioUseCases = makeSocioUseCases({ sociosDao });
  const claseUseCases = makeClaseUseCases({ clasesDao });

  // 3. Controladores
  const sociosController = new SociosController(socioUseCases);
  const clasesController = new ClasesController(claseUseCases);

  // 4. Routers
  const router = Router();
  router.get("/health", (req, res) => res.json({ status: "ok" }));
  router.use("/api-docs", await createDocsRouter());
  router.use("/socios", createSociosRouter(sociosController));
  router.use("/clases", createClasesRouter(clasesController));

  return router;
}

export default buildContainer;
