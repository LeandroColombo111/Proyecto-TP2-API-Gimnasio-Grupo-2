import consoleNotifier from "./consoleNotifier.js";
import { createFileNotifier } from "./fileNotifier.js";

// Devuelve el notificador según el tipo configurado ("console" o "file")
function getNotifier(type, filePath) {
  if (type === "console") return consoleNotifier;
  if (type === "file") return createFileNotifier(filePath);

  throw new Error(`Tipo de notificador no soportado: ${type}`);
}

export { getNotifier };
