// Notificador que escribe en la consola. Todos los notificadores tienen la misma interfaz: notify({ subject, body }).
const consoleNotifier = {
  async notify({ subject, body }) {
    console.log(`[NOTIFICACIÓN] ${subject}\n${body}`);
  },
};

export default consoleNotifier;
