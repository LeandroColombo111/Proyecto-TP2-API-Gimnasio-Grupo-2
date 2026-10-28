const PORT = Number(process.env.PORT) || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const PERSISTENCE_TYPE = process.env.PERSISTENCE_TYPE || "memory";

// Cuando una clase queda con este número de cupos libres (o menos) se emite clase.cupoBajo
const CUPO_BAJO_THRESHOLD = Number(process.env.CUPO_BAJO_THRESHOLD ?? 2);
// Notificador de bienvenida y notificador de alertas: "console" o "file"
const NOTIFIER_TYPE = process.env.NOTIFIER_TYPE || "console";
const ALERT_NOTIFIER_TYPE = process.env.ALERT_NOTIFIER_TYPE || "file";

export { PORT, NODE_ENV, PERSISTENCE_TYPE, CUPO_BAJO_THRESHOLD, NOTIFIER_TYPE, ALERT_NOTIFIER_TYPE };
