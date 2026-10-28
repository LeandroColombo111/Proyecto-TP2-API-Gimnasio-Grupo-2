import { Router } from "express";
import { NOTIFIER_TYPE, ALERT_NOTIFIER_TYPE } from "../config/config.js";
import { getSociosDao, getClasesDao, getInscripcionesDao } from "../dao/daoFactory.js";
import makeSocioUseCases from "../usecases/socios/makeSocioUseCases.js";
import makeClaseUseCases from "../usecases/clases/makeClaseUseCases.js";
import makeInscripcionUseCases from "../usecases/inscripciones/makeInscripcionUseCases.js";
import SociosController from "../controllers/sociosController.js";
import ClasesController from "../controllers/clasesController.js";
import InscripcionesController from "../controllers/inscripcionesController.js";
import createSociosRouter from "../routes/sociosRoutes.js";
import createClasesRouter from "../routes/clasesRoutes.js";
import createInscripcionesRouter from "../routes/inscripcionesRoutes.js";
import createDocsRouter from "../routes/docsRoutes.js";
import { createEventBus } from "../events/eventBus.js";
import { getNotifier } from "../notifications/notifierFactory.js";
import { registerInscripcionListeners } from "../alerts/registerInscripcionListeners.js";
import { registerCupoListeners } from "../alerts/registerCupoListeners.js";

// Composition Root: acá se arman DAOs -> casos de uso -> controladores -> routers
async function buildContainer() {
  // 1. DAOs (la factory elige según PERSISTENCE_TYPE)
  const sociosDao = getSociosDao();
  const clasesDao = getClasesDao();
  const inscripcionesDao = getInscripcionesDao();

  // 2. Bus de eventos, notificadores y listeners
  const events = createEventBus();
  const notifier = getNotifier(NOTIFIER_TYPE, "notifications.log");
  const alertNotifier = getNotifier(ALERT_NOTIFIER_TYPE, "alerts.log");
  registerInscripcionListeners(events, notifier);
  registerCupoListeners(events, alertNotifier);

  // 3. Casos de uso, con sus dependencias inyectadas
  const socioUseCases = makeSocioUseCases({ sociosDao, inscripcionesDao });
  const claseUseCases = makeClaseUseCases({ clasesDao, inscripcionesDao });
  const inscripcionUseCases = makeInscripcionUseCases({ inscripcionesDao, sociosDao, clasesDao, events });

  // 4. Controladores
  const sociosController = new SociosController(socioUseCases);
  const clasesController = new ClasesController(claseUseCases);
  const inscripcionesController = new InscripcionesController(inscripcionUseCases);

  // 5. Routers
  const router = Router();
  router.get("/health", (req, res) => res.json({ status: "ok" }));
  router.use("/api-docs", await createDocsRouter());
  router.use("/socios", createSociosRouter(sociosController));
  router.use("/clases", createClasesRouter(clasesController));
  router.use("/inscripciones", createInscripcionesRouter(inscripcionesController));

  return router;
}

export default buildContainer;
