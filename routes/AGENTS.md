# AGENTS.md — routes/

> Scope: capa de rutas. Antes de editar acá, leer también el `AGENTS.md` de la raíz.

## Responsabilidad
Definir **qué URL y verbo** llegan a **qué método del controlador**, y aplicar la **validación** de cada ruta.
Nada más: sin reglas de negocio, sin acceso a datos, sin armar respuestas.

## Qué hay acá
| Archivo | Recurso |
|---|---|
| `sociosRoutes.js` | `/socios` (incluye `/:id/clases`) |
| `clasesRoutes.js` | `/clases` (incluye `/:id/socios`) |
| `inscripcionesRoutes.js` | `/inscripciones` (incluye `PATCH /:id/cancelar`) |
| `authRoutes.js` | `/auth` (`POST /login`, público) |
| `docsRoutes.js` | `/api-docs` (Swagger UI, lee `docs/openapi.yaml`) |

## Reglas
- Cada archivo exporta una **factory** `createXxxRouter(controller, requireAuth)`: recibe el controlador y el
  middleware de autenticación ya armados. Nunca importa un controlador, un caso de uso ni un DAO directamente.
- Las rutas que **modifican datos** (`POST`, `PUT`, `PATCH`, `DELETE`) llevan `requireAuth` como **primer**
  middleware, antes de validar nada. Los `GET` y el login son públicos.
- Cada ruta declara sus validaciones en este orden: `requireAuth` (si corresponde) → `validateParams` →
  `validateQuery` → `validate` (body) → método del controlador.
- Los schemas se importan de `schemas/`. No se definen schemas Zod acá.
- Las rutas de la relación N a N (`/:id/clases`, `/:id/socios`) se declaran junto a `/:id` del mismo recurso.

## Patrón
```js
function createSociosRouter(controller, requireAuth) {
  const router = Router();

  router.get("/", validateQuery(querySociosSchema), controller.list);
  router.get("/:id", validateParams(socioIdParamSchema), controller.get);
  router.post("/", requireAuth, validate(createSocioSchema), controller.create);
  router.put("/:id", requireAuth, validateParams(socioIdParamSchema), validate(updateSocioSchema), controller.update);
  router.delete("/:id", requireAuth, validateParams(socioIdParamSchema), controller.remove);

  return router;
}
```

## Al agregar una ruta
1. Documentarla primero en `docs/openapi.yaml`.
2. Agregar el schema en `schemas/` y el método en el controlador.
3. Registrar el router en `container/container.js` solo si es un recurso nuevo.
4. Agregar casos en `requests.http`.

## Errores comunes
- Olvidar `validateParams` en una ruta con `:id`: un id como `abc` llegaría al caso de uso.
- Poner lógica en una ruta (`if`, consultas): va en el caso de uso.
