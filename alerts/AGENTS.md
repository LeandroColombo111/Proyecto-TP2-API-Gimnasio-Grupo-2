# AGENTS.md — alerts/

> Scope: listeners de eventos. El flujo completo está en `events/AGENTS.md`. Leer también el `AGENTS.md` de la
> raíz.

## Responsabilidad
Reaccionar a un evento usando un **notificador**. Es el "efecto secundario" que el caso de uso no conoce.

## Qué hay acá
| Archivo | Escucha | Hace |
|---|---|---|
| `registerInscripcionListeners.js` | `inscripcion.creada` | Envía la bienvenida al socio (notificador principal) |
| `registerCupoListeners.js` | `clase.cupoBajo` | Avisa al staff (notificador de alertas) |

## Reglas
- Cada archivo exporta `registerXxxListeners(bus, notifier)`: recibe el bus y el notificador **por parámetro**. No
  importa notificadores concretos.
- El listener usa **solo** `notifier.notify({ subject, body })`. Por eso se puede cambiar de consola a archivo sin
  tocarlo.
- **Obligatorio:** el cuerpo del listener va en `try/catch` y los errores se registran con `console.error` **sin
  relanzar**. Un fallo de notificación nunca debe tumbar la operación (la inscripción ya hecha igual responde 201).
- Un listener no modifica datos del dominio: solo notifica.

## Patrón
```js
function registerCupoListeners(bus, notifier) {
  bus.on(EVENTS.CLASE_CUPO_BAJO, async ({ claseId, nombre, cuposDisponibles }) => {
    try {
      await notifier.notify({ subject: `Cupo bajo: ${nombre}`, body: `...${cuposDisponibles}...` });
    } catch (error) {
      console.error("[Alertas] No se pudo enviar la alerta de cupo bajo:", error);
    }
  });
}
```

## Al agregar un listener
Registrarlo en `container/container.js` pasándole el notificador que corresponda. Ver el paso a paso en
`events/AGENTS.md`.
