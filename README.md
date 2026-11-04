# API Gimnasio

## Persistencia

Los datos se pueden guardar de dos maneras, que se eligen con la variable `PERSISTENCE_TYPE` del `.env`
(hay que reiniciar el servidor al cambiarla):

| `PERSISTENCE_TYPE` | Qué usa | Datos |
|---|---|---|
| `memory` | Arrays en memoria | Se pierden al reiniciar el servidor |
| `sequelize` | Sequelize + SQLite, en el archivo de `DB_STORAGE` (por defecto `./database.sqlite`) | Persisten |

Cada entidad (Socios, Clases, Inscripciones) tiene un DAO por modo, con la **misma interfaz**. Los casos de uso,
los controladores y las rutas no cambian: solo cambia el DAO que arma `dao/daoFactory.js`. Los dos modos responden
igual (misma forma y mismos códigos).

- Con `sequelize`, al arrancar se crean las tablas y, si están vacías, se cargan los mismos datos de ejemplo que en memoria.
- Para volver a los datos de ejemplo, apagar el servidor y borrar `database.sqlite`.
- Inscribir y cancelar usan una **transacción**: la inscripción y el cupo de la clase se actualizan juntos, o no se
  actualiza ninguno.
- Para comprobar que los dos modos responden igual: `npm run paridad` y `npm run paridad:comparar` (ver `connection/AGENTS.md`).

## Eventos

La aplicación usa un bus de eventos (`EventEmitter`, en `events/eventBus.js`). Los casos de uso **emiten**
un evento cuando algo importante ocurre y los **listeners** (carpeta `alerts/`) reaccionan, sin que el caso
de uso sepa qué hacen. Los eventos se emiten solo si la operación se concretó: si la inscripción falla no se
notifica nada.

| Evento | Se emite cuando | Payload | Listener | Notificador |
|---|---|---|---|---|
| `inscripcion.creada` | Se inscribe un socio a una clase | `{ inscripcionId, socio: { id, nombre, email }, clase: { id, nombre, dia, horario } }` | `alerts/registerInscripcionListeners.js`: envía la bienvenida al socio | Principal (`NOTIFIER_TYPE`, consola por defecto) |
| `clase.cupoBajo` | Tras inscribir, la clase queda con `cuposDisponibles <= CUPO_BAJO_THRESHOLD` | `{ claseId, nombre, cuposDisponibles }` | `alerts/registerCupoListeners.js`: avisa al staff | De alertas (`ALERT_NOTIFIER_TYPE`, archivo `alerts.log` por defecto) |

Los nombres de los eventos están en `events/eventNames.js` y el armado (bus, notificadores y listeners)
se hace en `container/container.js`.

### Notificadores

Todos implementan la misma interfaz `notify({ subject, body })`, por eso se pueden intercambiar sin tocar los
casos de uso ni los listeners:

- `console`: escribe en la consola.
- `file`: agrega al final de un archivo (`notifications.log` para la bienvenida, `alerts.log` para las alertas).
  Los `.log` no se versionan.

Cada listener captura sus propios errores (`try/catch` + `console.error`): si un notificador falla, la
inscripción ya realizada igual responde `201`.

### Variables de entorno relacionadas

| Variable | Default | Descripción |
|---|---|---|
| `CUPO_BAJO_THRESHOLD` | `2` | Cupos libres a partir de los cuales se emite `clase.cupoBajo` |
| `NOTIFIER_TYPE` | `console` | Notificador de la bienvenida (`console` o `file`) |
| `ALERT_NOTIFIER_TYPE` | `file` | Notificador de las alertas (`console` o `file`) |
