# AGENTS.md — schemas/

> Scope: validación de entrada con Zod 4. Antes de editar acá, leer también el `AGENTS.md` de la raíz.

## Responsabilidad
Validar la **forma** de body, params y query. No valida reglas de negocio: eso va en `usecases/`.

## Qué hay acá
| Archivo | Exporta |
|---|---|
| `socioSchema.js` | `createSocioSchema`, `updateSocioSchema`, `socioIdParamSchema`, `querySociosSchema` |
| `claseSchema.js` | `createClaseSchema`, `updateClaseSchema`, `claseIdParamSchema`, `queryClasesSchema`, `DIAS` |
| `inscripcionSchema.js` | `createInscripcionSchema`, `inscripcionIdParamSchema`, `queryInscripcionesSchema` |

## Reglas
- Mensajes de error **en español**, claros para quien consume la API.
- Un objeto base con los campos comunes (`camposSocio`, `camposClase`) que reutilizan alta y modificación.
- **Alta:** campos obligatorios y defaults (ej: `activo` por defecto `true`).
- **Modificación:** `.partial().strict().refine(...)`.
  - `.partial()`: todos los campos opcionales.
  - `.strict()`: rechaza claves desconocidas en vez de ignorarlas.
  - `.refine(...)`: exige al menos un campo. Sin defaults: un default se aplicaría aunque el campo no se envíe.
- **Params:** `id` con `z.coerce.number().int().positive()`.
- **Query:** todo llega como **string**, así que se convierte (`z.coerce`). Defaults de paginación:
  `page` = 1 (mínimo 1) y `limit` = 10 (máximo 100). El `sort` es un `z.enum` cerrado.
- Campos que el sistema calcula (`cuposDisponibles`, `id`, `fechaInscripcion`) **no** están en los schemas de
  alta ni de modificación.

## Trampas
- **Booleanos en query:** `z.coerce.boolean()` convierte el string `"false"` en `true`. Se usa
  `z.enum(["true", "false"]).transform((v) => v === "true")`.
- **Email:** `z.email().toLowerCase()` para que `A@x.com` y `a@x.com` cuenten como el mismo email.
- El DNI es **string**, no número (puede empezar con 0 y no se opera aritméticamente).

## Patrón
```js
const camposSocio = { nombre: z.string().trim().min(1, "El nombre es obligatorio"), /* ... */ };

export const createSocioSchema = z.object({ ...camposSocio, activo: camposSocio.activo.default(true) });

export const updateSocioSchema = z
  .object(camposSocio)
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, { message: "Debe enviar al menos un campo para modificar" });
```

## Al cambiar un schema
Actualizar el schema equivalente en `docs/openapi.yaml` (`components/schemas`) y la tabla de
`docs/API_DOCUMENTATION.md`, y agregar un caso inválido en `requests.http`.
