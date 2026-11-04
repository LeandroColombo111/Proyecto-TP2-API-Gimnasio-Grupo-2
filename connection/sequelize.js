import { Sequelize } from "sequelize";
import { DB_STORAGE } from "../config/config.js";

// Conexión a SQLite. El archivo se crea solo la primera vez que se usa.
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: DB_STORAGE,
  logging: false, // poner console.log para ver las consultas SQL
});

export default sequelize;
