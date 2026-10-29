# API Gimnasio — Documentación de la API

Resumen legible de todos los endpoints. La versión interactiva (con "Try it out") está en Swagger UI:
**http://localhost:8000/api-docs**, generada desde [`openapi.yaml`](./openapi.yaml). Si hay diferencias, manda el
`openapi.yaml` y se corrige este documento.

**Base URL:** `http://localhost:8000`

## Autenticación

Hoy **ningún endpoint requiere autenticación**. La protección con JWT de los endpoints de escritura
(`POST`, `PUT`, `PATCH`, `DELETE`) está planificada.

## Convenciones

- Los `id` son números enteros positivos. Un id inválido (ej: `abc`) responde `400`.
- Todos los bodies y respuestas son JSON (`Content-Type: application/json`).
- Los errores siempre tienen el formato `{ error: { code, message, details? } }`. Ver
  [`API_RESPONSE_STRUCTURE.md`](./API_RESPONSE_STRUCTURE.md).
- Las fechas son strings ISO 8601 (ej: `2026-10-28T21:46:50.155Z`).
- Los listados de **Socios** y **Clases** son paginados. El de **Inscripciones** devuelve un array simple.

### Paginación, orden y filtros

Parámetros comunes de los listados paginados:

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | entero ≥ 1 | `1` | Número de página |
| `limit` | entero 1–100 | `10` | Resultados por página |
| `sort` | string | sin orden | Campo de orden. El prefijo `-` indica descendente (ej: `-apellido`) |

Respuesta paginada:

```json
{
  "data": [ /* resultados */ ],
  "meta": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

`total` es la cantidad de resultados antes de paginar.

---

## Health

### `GET /health`
Verifica que el servidor está vivo. Responde `200` con `{ "status": "ok" }`.

---

## Socios

Modelo:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | entero | Lo asigna el sistema |
| `nombre` | string | Obligatorio |
| `apellido` | string | Obligatorio |
| `email` | string | Obligatorio, válido y **único** (se guarda en minúsculas) |
| `dni` | string | Obligatorio, 7 u 8 dígitos y **único** |
| `telefono` | string \| null | Opcional |
| `activo` | boolean | Default `true`. Un socio inactivo no puede inscribirse |

### `GET /socios`
Lista socios con filtros, orden y paginación.

| Query | Tipo | Descripción |
|---|---|---|
| `activo` | `true` \| `false` | Filtra por socios activos o inactivos |
| `q` | string | Texto a buscar en nombre, apellido o email |
| `sort` | `apellido` \| `-apellido` \| `nombre` \| `-nombre` | Orden |
| `page`, `limit` | entero | Ver paginación |

**200:** respuesta paginada de socios. **400:** query inválida.

```json
{
  "data": [
    { "id": 2, "nombre": "Martín", "apellido": "Gómez", "email": "martin.gomez@mail.com",
      "dni": "32456789", "telefono": null, "activo": true }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### `GET /socios/:id`
Devuelve un socio. **200** con el socio · **400** id inválido · **404** `SOCIO_NOT_FOUND`.

### `POST /socios`
Crea un socio.

Body:
```json
{
  "nombre": "Julia",
  "apellido": "Medina",
  "email": "julia.medina@mail.com",
  "dni": "33444555",
  "telefono": "1155550010"
}
```
`telefono` y `activo` son opcionales.

**201** con el socio creado · **400** `VALIDATION_ERROR` · **409** `EMAIL_DUPLICADO` o `DNI_DUPLICADO`.

### `PUT /socios/:id`
Modifica un socio. Se envían solo los campos a cambiar, pero **al menos uno**. No se aceptan campos desconocidos.

Body (ejemplo): `{ "telefono": "1155559999", "activo": false }`

**200** con el socio actualizado · **400** · **404** `SOCIO_NOT_FOUND` · **409** `EMAIL_DUPLICADO` o
`DNI_DUPLICADO` (si el valor pertenece a **otro** socio; conservar el propio no es duplicado).

### `DELETE /socios/:id`
Borra un socio. **204** sin body · **400** · **404** `SOCIO_NOT_FOUND` · **409** `SOCIO_CON_INSCRIPCIONES`
(tiene inscripciones activas).

### `GET /socios/:id/clases`
Clases en las que el socio tiene una inscripción **activa** (relación N a N).
**200** con un array de clases (puede estar vacío) · **400** · **404** `SOCIO_NOT_FOUND`.

---

## Clases

Modelo:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | entero | Lo asigna el sistema |
| `nombre` | string | Obligatorio |
| `instructor` | string | Obligatorio |
| `dia` | string | `lunes`, `martes`, `miercoles`, `jueves`, `viernes` o `sabado` |
| `horario` | string | Formato `HH:MM` (00:00 a 23:59) |
| `cupoMaximo` | entero | Mayor a 0 |
| `cuposDisponibles` | entero | **Lo calcula el sistema**, no se envía en el body |

### `GET /clases`
Lista clases con filtros, orden y paginación.

| Query | Tipo | Descripción |
|---|---|---|
| `dia` | día válido | Filtra por día |
| `instructor` | string | Texto a buscar en el nombre del instructor |
| `conCupo` | `true` \| `false` | `true`: solo clases con cupos libres; `false`: solo las llenas |
| `sort` | `horario` \| `-horario` \| `nombre` \| `-nombre` | Orden |
| `page`, `limit` | entero | Ver paginación |

**200:** respuesta paginada de clases. **400:** query inválida.

### `GET /clases/:id`
**200** · **400** · **404** `CLASE_NOT_FOUND`.

### `POST /clases`
Body:
```json
{ "nombre": "Pilates", "instructor": "Marina Ruiz", "dia": "martes", "horario": "10:30", "cupoMaximo": 12 }
```
`cuposDisponibles` arranca igual a `cupoMaximo`.

**201** con la clase creada · **400** (día, horario o cupo inválidos).

### `PUT /clases/:id`
Modifica una clase (al menos un campo; no se acepta `cuposDisponibles`).

Si cambia `cupoMaximo`:
- no puede ser menor a los inscriptos activos, y
- `cuposDisponibles` se recalcula como `cupoMaximo - inscriptos activos`.

**200** · **400** · **404** `CLASE_NOT_FOUND` · **409** `CUPO_INVALIDO`.

### `DELETE /clases/:id`
**204** · **400** · **404** `CLASE_NOT_FOUND` · **409** `CLASE_CON_INSCRIPCIONES` (tiene inscripciones activas).

### `GET /clases/:id/socios`
Socios con una inscripción **activa** en la clase.
**200** con un array de socios (puede estar vacío) · **400** · **404** `CLASE_NOT_FOUND`.

---

## Inscripciones

Una inscripción une a un socio con una clase. No se edita ni se borra: se **cancela** (así se conserva el
historial).

Modelo:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | entero | Lo asigna el sistema |
| `socioId` | entero | Socio inscripto |
| `claseId` | entero | Clase a la que se inscribió |
| `fechaInscripcion` | string ISO | La pone el sistema |
| `estado` | `activa` \| `cancelada` | Empieza en `activa` |
| `socio` | objeto | `{ id, nombre, apellido }` |
| `clase` | objeto | `{ id, nombre, dia, horario }` |

### `GET /inscripciones`
Lista inscripciones. Query opcional: `socioId`, `claseId`, `estado` (`activa` | `cancelada`).
**200** con un array · **400** query inválida.

### `GET /inscripciones/:id`
**200** · **400** · **404** `INSCRIPCION_NOT_FOUND`.

### `POST /inscripciones`
Inscribe un socio a una clase. En una sola operación crea la inscripción y descuenta un cupo de la clase.

Body: `{ "socioId": 1, "claseId": 2 }`

Respuesta **201**:
```json
{
  "id": 1,
  "socioId": 1,
  "claseId": 2,
  "fechaInscripcion": "2026-10-28T21:46:50.155Z",
  "estado": "activa",
  "socio": { "id": 1, "nombre": "Lucía", "apellido": "Fernández" },
  "clase": { "id": 2, "nombre": "Spinning", "dia": "miercoles", "horario": "19:00" }
}
```

Reglas, en este orden (la primera que falla corta):

| # | Regla | Error |
|---|---|---|
| 1 | El socio existe | 404 `SOCIO_NOT_FOUND` |
| 2 | La clase existe | 404 `CLASE_NOT_FOUND` |
| 3 | El socio está activo | 409 `SOCIO_INACTIVO` |
| 4 | No está ya inscripto en esa clase | 409 `YA_INSCRIPTO` |
| 5 | La clase tiene cupo | 409 `CLASE_SIN_CUPO` |

Además de **400** `VALIDATION_ERROR` si el body es inválido.

Eventos: al inscribir se emite `inscripcion.creada` y, si la clase queda con `cuposDisponibles <=
CUPO_BAJO_THRESHOLD`, también `clase.cupoBajo`. Si la inscripción falla, no se emite nada.

### `PATCH /inscripciones/:id/cancelar`
Cancela la inscripción y devuelve un cupo a la clase.

**200** con la inscripción (`estado: "cancelada"`) · **400** · **404** `INSCRIPCION_NOT_FOUND` · **409**
`INSCRIPCION_YA_CANCELADA`.

---

## Eventos

| Evento | Cuándo | Efecto |
|---|---|---|
| `inscripcion.creada` | Se inscribe un socio | Bienvenida por el notificador principal (consola por defecto) |
| `clase.cupoBajo` | La clase queda con pocos cupos | Alerta por el notificador de alertas (`alerts.log` por defecto) |

Detalle en la sección de eventos del [`README.md`](../README.md).

---

## Ejemplos con curl

```bash
# Crear un socio
curl -X POST http://localhost:8000/socios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Julia","apellido":"Medina","email":"julia.medina@mail.com","dni":"33444555"}'

# Listar socios paginados y ordenados
curl "http://localhost:8000/socios?limit=5&page=1&sort=-apellido"

# Inscribir un socio a una clase
curl -X POST http://localhost:8000/inscripciones \
  -H "Content-Type: application/json" \
  -d '{"socioId":1,"claseId":2}'

# Cancelar la inscripción 1
curl -X PATCH http://localhost:8000/inscripciones/1/cancelar
```

Más casos (éxito y error) en [`requests.http`](../requests.http).
