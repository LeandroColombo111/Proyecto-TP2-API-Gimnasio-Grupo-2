import express from "express";
import { PORT } from "./config/config.js";
import buildContainer from "./container/container.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./middlewares/logger.js";

async function startServer() {
  const app = express();
  app.use(logger);
  app.use(express.json());

  try {
    app.use(await buildContainer());
  } catch (err) {
    console.error("Error al inicializar el contenedor:", err);
    process.exit(1);
  }

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => console.log(`API Gimnasio en http://localhost:${PORT}`));
}

startServer();
