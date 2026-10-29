# AGENTS.md — middlewares/ (y errors/)

> Scope: middlewares transversales y manejo de errores. Antes de editar acá, leer también el `AGENTS.md` de la
> raíz y `docs/API_RESPONSE_STRUCTURE.md`.

## Qué hay acá
| Archivo | Para qué |
|---|---|
| `validate.js` | `validate(schema, target)`, `validateParams`, `validateQuery`: validan con Zod |
| `errorHandler.js` | **Único** manejador de errores: arma `{ error: { code, message, details? } }` |
| `notFound.js` | 404 `ROUTE_NOT_FOUND` para rutas inexistentes |
| `logger.js` | Registra método, url, status y duración al terminar cada request |
| `../errors/AppError.js` | Error de dominio: `code`, `message`, `statusCode`, `details` |

## Reglas
- **Un solo** `errorHandler` y **un solo** `notFound`. Los errores no se responden en otro lado.
- El formato de error es un contrato con quien consume la API: no cambiarlo sin actualizar
  `docs/API_RESPONSE_STRUCTURE.md` y `docs/openapi.yaml`.
- `errorHandler` distingue tres casos:
  1. `AppError` → su `statusCode`, `code` y `message`.
  2. JSON mal formado (`err.type === "entity.parse.failed"`) → `INVALID_JSON` (400).
  3. Cualquier otro → `INTERNAL_ERROR` (500) con un mensaje genérico; el detalle va a la consola, nunca al cliente.
- `validate` convierte los errores de Zod en `AppError("VALIDATION_ERROR", ..., 400, details)`, con
  `details: [{ field, message }]`. Si el problema es del objeto completo, `field` vale `(root)`.
- Los middlewares no contienen reglas de negocio.

## Trampa crítica: `req.query` en Express 5
`req.query` es un **getter** que se recalcula en cada acceso: `Object.assign(req.query, datos)` no guarda nada y
`req.query = ...` no se puede. Por eso `validate` lo redefine así:

```js
Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true });
```

Para `req.params` alcanza con `Object.assign`, y `req.body` se reasigna directo. Si se toca `validate.js`,
comprobar que `?page=2&conCupo=true` llegue al controlador como número y booleano, no como strings.

## Orden en `index.js`
`logger` → `express.json()` → router del contenedor → `notFound` → `errorHandler`. El `errorHandler` va **último**.

## Al agregar un middleware
Si es global, se monta en `index.js`. Si es de una ruta, se aplica en `routes/`. Si agrega códigos de error, se
documentan en `docs/API_RESPONSE_STRUCTURE.md`.
