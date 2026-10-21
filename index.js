import express from "express";
import { PORT } from "./config/config.js";
import buildContainer from "./container/container.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

async function startServer() {
  const app = express();
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
