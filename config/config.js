const PORT = Number(process.env.PORT) || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const PERSISTENCE_TYPE = process.env.PERSISTENCE_TYPE || "memory";

// Ruta del archivo de SQLite (solo se usa con PERSISTENCE_TYPE=sequelize)
const DB_STORAGE = process.env.DB_STORAGE || "./database.sqlite";

// Cuando una clase queda con este número de cupos libres (o menos) se emite clase.cupoBajo
const CUPO_BAJO_THRESHOLD = Number(process.env.CUPO_BAJO_THRESHOLD ?? 2);
// Notificador de bienvenida y notificador de alertas: "console" o "file"
const NOTIFIER_TYPE = process.env.NOTIFIER_TYPE || "console";
const ALERT_NOTIFIER_TYPE = process.env.ALERT_NOTIFIER_TYPE || "file";

// Autenticación (JWT). El secreto firma los tokens: en producción tiene que ser propio y no estar en el repo.
if (NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET: en producción es obligatorio");
}
const JWT_SECRET = process.env.JWT_SECRET || "secreto-solo-para-desarrollo";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Usuario administrador que se crea al arrancar si no existe. Sin ADMIN_PASSWORD no se crea ninguno.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gimnasio.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export {
  PORT,
  NODE_ENV,
  PERSISTENCE_TYPE,
  DB_STORAGE,
  CUPO_BAJO_THRESHOLD,
  NOTIFIER_TYPE,
  ALERT_NOTIFIER_TYPE,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
};
