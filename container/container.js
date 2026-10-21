import { Router } from "express";

// Composition Root: acá se van a armar DAOs -> casos de uso -> controladores -> routers
async function buildContainer() {
  const router = Router();
  router.get("/health", (req, res) => res.json({ status: "ok" }));
  return router;
}

export default buildContainer;
