import { appendFile } from "node:fs/promises";

// Factory: recibe la ruta del archivo para poder tener un log de notificaciones y otro de alertas
function createFileNotifier(filePath) {
  return {
    async notify({ subject, body }) {
      await appendFile(filePath, `[${new Date().toISOString()}] ${subject}\n${body}\n\n`, "utf8");
    },
  };
}

export { createFileNotifier };
