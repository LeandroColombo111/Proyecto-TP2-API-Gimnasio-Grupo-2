import { EVENTS } from "../events/eventNames.js";

// Listener de alertas para el staff: reacciona a clase.cupoBajo.
// Captura sus propios errores para no romper el flujo que emitió el evento.
function registerCupoListeners(bus, notifier) {
  bus.on(EVENTS.CLASE_CUPO_BAJO, async ({ claseId, nombre, cuposDisponibles }) => {
    try {
      await notifier.notify({
        subject: `Cupo bajo: ${nombre}`,
        body: `La clase "${nombre}" (id: ${claseId}) tiene ${cuposDisponibles} cupos disponibles.`,
      });
    } catch (error) {
      console.error("[Alertas] No se pudo enviar la alerta de cupo bajo:", error);
    }
  });
}

export { registerCupoListeners };
