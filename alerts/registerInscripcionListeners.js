import { EVENTS } from "../events/eventNames.js";

// Listener de bienvenida: reacciona a inscripcion.creada.
// Captura sus propios errores: si el notificador falla, la inscripción ya hecha no se ve afectada.
function registerInscripcionListeners(bus, notifier) {
  bus.on(EVENTS.INSCRIPCION_CREADA, async ({ inscripcionId, socio, clase }) => {
    try {
      await notifier.notify({
        subject: `Bienvenido a ${clase.nombre}`,
        body: `Hola ${socio.nombre} (${socio.email}), quedaste inscripto a ${clase.nombre} el ${clase.dia} a las ${clase.horario}. Inscripción #${inscripcionId}.`,
      });
    } catch (error) {
      console.error("[Inscripciones] No se pudo enviar la bienvenida:", error);
    }
  });
}

export { registerInscripcionListeners };
