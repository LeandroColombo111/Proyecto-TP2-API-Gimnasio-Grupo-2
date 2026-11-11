import express, { Router } from "express";
import { fileURLToPath } from "node:url";
import {
  NOTIFIER_TYPE,
  ALERT_NOTIFIER_TYPE,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from "../config/config.js";
import { getSociosDao, getClasesDao, getInscripcionesDao, getUsuariosDao } from "../dao/daoFactory.js";
import makeSocioUseCases from "../usecases/socios/makeSocioUseCases.js";
import makeClaseUseCases from "../usecases/clases/makeClaseUseCases.js";
import makeInscripcionUseCases from "../usecases/inscripciones/makeInscripcionUseCases.js";
import makeAuthUseCases from "../usecases/auth/makeAuthUseCases.js";
import SociosController from "../controllers/sociosController.js";
import ClasesController from "../controllers/clasesController.js";
import InscripcionesController from "../controllers/inscripcionesController.js";
import AuthController from "../controllers/authController.js";
import createSociosRouter from "../routes/sociosRoutes.js";
import createClasesRouter from "../routes/clasesRoutes.js";
import createInscripcionesRouter from "../routes/inscripcionesRoutes.js";
import createAuthRouter from "../routes/authRoutes.js";
import createDocsRouter from "../routes/docsRoutes.js";
import createRequireAuth from "../middlewares/requireAuth.js";
import createTokenService from "../auth/tokenService.js";
import createPasswordService from "../auth/passwordService.js";
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
  const usuariosDao = getUsuariosDao();

  // Los DAO de Sequelize tienen init() (crea las tablas y carga datos de ejemplo); los de memoria no lo necesitan
  for (const dao of [sociosDao, clasesDao, inscripcionesDao, usuariosDao]) {
    if (typeof dao.init === "function") {
      await dao.init();
    }
  }

  // 2. Servicios de autenticación (el token y el hash de contraseñas) y el middleware que protege las rutas
  const tokenService = createTokenService({ secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN });
  const passwordService = createPasswordService();
  const requireAuth = createRequireAuth(tokenService);

  // 3. Bus de eventos, notificadores y listeners
  const events = createEventBus();
  const notifier = getNotifier(NOTIFIER_TYPE, "notifications.log");
  const alertNotifier = getNotifier(ALERT_NOTIFIER_TYPE, "alerts.log");
  registerInscripcionListeners(events, notifier);
  registerCupoListeners(events, alertNotifier);

  // 4. Casos de uso, con sus dependencias inyectadas
  const socioUseCases = makeSocioUseCases({ sociosDao, inscripcionesDao });
  const claseUseCases = makeClaseUseCases({ clasesDao, inscripcionesDao });
  const inscripcionUseCases = makeInscripcionUseCases({ inscripcionesDao, sociosDao, clasesDao, events });
  const authUseCases = makeAuthUseCases({ usuariosDao, passwordService, tokenService });

  // El usuario administrador se crea al arrancar si todavía no existe
  await authUseCases.crearAdminInicial({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  // 5. Controladores
  const sociosController = new SociosController(socioUseCases);
  const clasesController = new ClasesController(claseUseCases);
  const inscripcionesController = new InscripcionesController(inscripcionUseCases);
  const authController = new AuthController(authUseCases);

  // 6. Routers (los que modifican datos reciben requireAuth)
  const router = Router();
  // Página de demo (public/index.html): se abre en http://localhost:8000
  router.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));
  router.get("/health", (req, res) => res.json({ status: "ok" }));
  router.use("/api-docs", await createDocsRouter());
  router.use("/auth", createAuthRouter(authController));
  router.use("/socios", createSociosRouter(sociosController, requireAuth));
  router.use("/clases", createClasesRouter(clasesController, requireAuth));
  router.use("/inscripciones", createInscripcionesRouter(inscripcionesController, requireAuth));

  return router;
}

export default buildContainer;
