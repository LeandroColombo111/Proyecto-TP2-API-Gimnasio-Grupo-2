# AGENTS.md — notifications/

> Scope: notificadores. El flujo completo está en `events/AGENTS.md`. Leer también el `AGENTS.md` de la raíz.

## Responsabilidad
Entregar una notificación por un canal concreto (consola, archivo). Todos los notificadores tienen la **misma
interfaz**, y por eso son intercambiables.

## Interfaz
```js
async notify({ subject, body })
```

## Qué hay acá
| Archivo | Qué hace |
|---|---|
| `consoleNotifier.js` | Imprime `[NOTIFICACIÓN] subject` y el cuerpo en la consola |
| `fileNotifier.js` | `createFileNotifier(filePath)`: agrega la notificación al final de un archivo |
| `notifierFactory.js` | `getNotifier(type, filePath)`: devuelve el notificador según `"console"` o `"file"` |

## Reglas
- Cualquier notificador nuevo implementa `notify({ subject, body })` y se agrega a `notifierFactory.js`.
- `fileNotifier` es una **factory** porque hay dos archivos: `notifications.log` (bienvenida) y `alerts.log`
  (alertas). La ruta la decide el contenedor.
- Los `.log` **no se versionan** (están en `.gitignore`).
- Un tipo desconocido lanza un error claro en el arranque (`Tipo de notificador no soportado`).
- Un notificador **puede lanzar** si falla (ej: el archivo no se puede escribir): quien lo llama, el listener, es
  quien captura el error.

## Al agregar un canal (ej: email)
1. Crear `xxxNotifier.js` con `notify({ subject, body })`.
2. Agregar el tipo en `notifierFactory.js`.
3. Documentar el valor nuevo de `NOTIFIER_TYPE` / `ALERT_NOTIFIER_TYPE` en `.env.example`, `README.md` y
   `AGENTS.md`.

Los listeners y los casos de uso **no se tocan**: ese es el punto del diseño.
