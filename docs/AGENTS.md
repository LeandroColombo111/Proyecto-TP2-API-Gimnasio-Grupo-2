# AGENTS.md — docs/

> Scope: documentación de la API. Leer también el `AGENTS.md` de la raíz.

## Qué hay acá
| Archivo | Para qué |
|---|---|
| `openapi.yaml` | **Contrato OpenAPI 3.0.3.** Lo sirve Swagger UI en `/api-docs`. Es la fuente de verdad |
| `API_DOCUMENTATION.md` | Resumen legible de los endpoints, con ejemplos |
| `API_RESPONSE_STRUCTURE.md` | Formato de respuestas y catálogo de códigos de error |

## Regla principal: los cuatro se actualizan juntos
Cada cambio de endpoint, regla o código de error toca, en el mismo cambio:

| Si cambia... | Actualizar |
|---|---|
| Un endpoint (ruta, body, query, respuestas) | `openapi.yaml`, `API_DOCUMENTATION.md`, `requests.http` |
| Un código de error o status | `openapi.yaml` (ejemplos), `API_RESPONSE_STRUCTURE.md` (catálogo) |
| Una regla de negocio | `API_DOCUMENTATION.md` (tabla de reglas) y la sección de dominio de `CLAUDE.md` |
| Una variable de entorno | `.env.example`, `README.md` y `AGENTS.md` (tabla de variables) |
| El estado de un sprint | `AGENTS.md` y `CLAUDE.md` (tablas de estado) |

Si el `openapi.yaml` y otro documento se contradicen, **manda el `openapi.yaml`** y se corrige el otro.

## Convenciones de `openapi.yaml`
- Los modelos viven una sola vez en `components/schemas` y se reutilizan con `$ref` (`Socio`, `Clase`,
  `Inscripcion`, `*Create`, `*Update`, `Error`, `Paginated*`). **Nada de schemas repetidos inline.**
- Parámetros reutilizables en `components/parameters` (`IdPath`, `Page`, `Limit`).
- Respuestas comunes en `components/responses` (`BadRequest`, `NotFound`, `Conflict`, `InternalError`).
- Cada endpoint documenta método, ruta, descripción, parámetros (con ejemplo), body (con ejemplo) y **todas** sus
  respuestas posibles: éxito y errores (400, 404, 409, 500).
- Si un endpoint puede dar varios `409`, usar `examples` con un ejemplo por cada `code`.
- Los textos y ejemplos van en español.

## Cómo validar
1. Levantar el servidor: `npm run dev`. Si el yaml tiene un error de sintaxis, el servidor **no arranca**.
2. Abrir http://localhost:8000/api-docs y probar los endpoints con "Try it out".
3. Comparar la lista de rutas de `routes/` con las de `openapi.yaml`: tienen que coincidir.

## Estilo
- Documentar **lo que existe**, no lo que está planificado. Lo planificado va marcado como tal (ver "Planificados"
  en `API_RESPONSE_STRUCTURE.md`).
- Sin duplicar el contenido de la raíz: este scope solo explica cómo mantener los documentos.
