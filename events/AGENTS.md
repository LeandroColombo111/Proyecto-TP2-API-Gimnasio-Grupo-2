# AGENTS.md — events/ (flujo completo de eventos)

> Scope: bus y nombres de eventos. Este archivo explica el flujo de **todo** el sistema de eventos
> (`events/`, `alerts/`, `notifications/`). Leer también el `AGENTS.md` de la raíz.

## Idea
Una regla de negocio y su efecto secundario (avisar, notificar) no deben estar mezclados. El caso de uso solo
**avisa que algo pasó**; otro módulo **decide qué hacer**.

```
usecases/inscribirSocio  --emit-->  events (EventEmitter)  --on-->  alerts/ (listener)  --notify-->  notifications/
   (regla de negocio)                   (bus)                      (reacciona)                 (consola / archivo)
```

## Qué hay acá
| Archivo | Para qué |
|---|---|
| `eventNames.js` | `EVENTS`: nombres de los eventos, en un solo lugar |
| `eventBus.js` | `createEventBus()`: devuelve un `EventEmitter` nuevo |

## Eventos actuales
| Constante | Nombre | Payload |
|---|---|---|
| `EVENTS.INSCRIPCION_CREADA` | `inscripcion.creada` | `{ inscripcionId, socio: { id, nombre, email }, clase: { id, nombre, dia, horario } }` |
| `EVENTS.CLASE_CUPO_BAJO` | `clase.cupoBajo` | `{ claseId, nombre, cuposDisponibles }` |

## Reglas
- El bus se crea **una vez** en `container/container.js` y se **inyecta** (`events`) en los casos de uso y en
  `alerts/`. Nunca importar un bus global.
- Usar siempre las constantes de `EVENTS`, nunca strings sueltos.
- El payload es un **objeto plano** con lo mínimo necesario, no instancias ni el objeto completo de la entidad.
- Se emite **solo si la operación se concretó** y **después** de guardar.
- Un listener que falla **no debe romper la operación** que emitió el evento: cada listener captura sus errores.

## Al agregar un evento
1. Agregar la constante en `eventNames.js`.
2. Emitirlo desde el caso de uso (`events.emit(EVENTS.XXX, payload)`); el caso de uso recibe `events` por la
   factory `makeXxxUseCases`.
3. Crear o ampliar un listener en `alerts/` y registrarlo en `container/container.js`.
4. Documentar el evento en `README.md` (sección Eventos) y en `docs/API_DOCUMENTATION.md`.
5. Agregar un caso a la sección "Eventos" de `requests.http`.
