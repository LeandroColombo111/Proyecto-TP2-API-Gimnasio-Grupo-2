# API Gimnasio — Estructura de las respuestas

Cómo responde la API en cada caso, para que quien la consuma (por ejemplo un frontend) sepa siempre qué esperar.

## Respuestas de éxito

La API **no usa un sobre** (`{ status, data }`): devuelve directamente el recurso o la lista.

| Caso | Status | Body |
|---|---|---|
| Obtener o modificar un recurso | `200` | El recurso |
| Crear un recurso | `201` | El recurso creado |
| Borrar un recurso | `204` | Sin body |
| Listado simple | `200` | Un array |
| Listado paginado (socios y clases) | `200` | `{ data: [...], meta: {...} }` |

### Un recurso

```json
{
  "id": 1,
  "nombre": "Lucía",
  "apellido": "Fernández",
  "email": "lucia.fernandez@mail.com",
  "dni": "30123456",
  "telefono": "1155550001",
  "activo": true
}
```

### Listado simple

Lo usan `GET /inscripciones`, `GET /socios/:id/clases` y `GET /clases/:id/socios`. Si no hay resultados,
devuelve `[]` (nunca `null`).

### Listado paginado

Lo usan `GET /socios` y `GET /clases`.

```json
{
  "data": [ { "id": 1, "nombre": "Funcional", "...": "..." } ],
  "meta": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

| Campo de `meta` | Descripción |
|---|---|
| `page` | Página actual (empieza en 1) |
| `limit` | Resultados por página |
| `total` | Cantidad total de resultados, antes de paginar |
| `totalPages` | `ceil(total / limit)` |

## Respuestas de error

**Todos** los errores tienen el mismo formato:

```json
{
  "error": {
    "code": "EMAIL_DUPLICADO",
    "message": "Ya existe un socio con ese email",
    "details": [ { "field": "email", "message": "..." } ]
  }
}
```

| Campo | Siempre presente | Descripción |
|---|---|---|
| `code` | Sí | Código estable en MAYÚSCULAS, pensado para que el cliente decida qué hacer |
| `message` | Sí | Texto legible para una persona |
| `details` | No | Solo en errores de validación: lista de `{ field, message }` |

El `code` no cambia aunque se modifique el `message`: el cliente debe basarse en el `code`.

### Error de validación (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de body inválidos",
    "details": [
      { "field": "email", "message": "El email no es válido" },
      { "field": "dni", "message": "El DNI debe tener 7 u 8 dígitos" }
    ]
  }
}
```

- `message` indica qué parte falló: `body`, `params` o `query`.
- `field` es el nombre del campo. Si el problema es del objeto completo (ej: body vacío en un `PUT`), vale
  `(root)`.

### Error inesperado (500)

```json
{ "error": { "code": "INTERNAL_ERROR", "message": "Ocurrió un error inesperado en el servidor" } }
```

El mensaje es genérico a propósito: el detalle del error se registra en la consola del servidor y no se expone al
cliente.

## Catálogo de errores

### 400 — Request inválido

| Code | Cuándo |
|---|---|
| `VALIDATION_ERROR` | El body, los params o la query no cumplen el schema de Zod |
| `INVALID_JSON` | El body no es un JSON válido |

### 404 — No encontrado

| Code | Cuándo |
|---|---|
| `ROUTE_NOT_FOUND` | La ruta no existe |
| `SOCIO_NOT_FOUND` | No existe un socio con ese id |
| `CLASE_NOT_FOUND` | No existe una clase con ese id |
| `INSCRIPCION_NOT_FOUND` | No existe una inscripción con ese id |

### 409 — Conflicto con una regla de negocio

El dato tiene la forma correcta, pero choca con el estado actual de los datos.

| Code | Cuándo |
|---|---|
| `EMAIL_DUPLICADO` | Ya existe otro socio con ese email |
| `DNI_DUPLICADO` | Ya existe otro socio con ese DNI |
| `SOCIO_CON_INSCRIPCIONES` | Se intenta borrar un socio con inscripciones activas |
| `CLASE_CON_INSCRIPCIONES` | Se intenta borrar una clase con inscripciones activas |
| `CUPO_INVALIDO` | Se baja `cupoMaximo` por debajo de los inscriptos activos |
| `SOCIO_INACTIVO` | Se inscribe a un socio inactivo |
| `YA_INSCRIPTO` | El socio ya tiene una inscripción activa en esa clase |
| `CLASE_SIN_CUPO` | La clase no tiene cupos disponibles |
| `INSCRIPCION_YA_CANCELADA` | Se cancela una inscripción ya cancelada |

### 500 — Error del servidor

| Code | Cuándo |
|---|---|
| `INTERNAL_ERROR` | Error no controlado |

### Planificados (con JWT)

| Status | Code | Cuándo |
|---|---|---|
| 401 | `CREDENCIALES_INVALIDAS` | Email o contraseña incorrectos en el login |
| 401 | `UNAUTHORIZED` | Falta el token en un endpoint protegido |
| 401 | `TOKEN_INVALIDO` | El token es inválido o expiró |

## Cuál usar: 400, 404 o 409

| Situación | Status |
|---|---|
| El dato no tiene la forma esperada (falta un campo, tipo incorrecto, formato inválido) | `400` |
| El recurso pedido no existe | `404` |
| El dato es válido pero no se puede aplicar por el estado actual (duplicado, sin cupo, ya inscripto) | `409` |

## Cómo se genera cada respuesta (para quien programa)

```
Zod falla en validate()      → AppError VALIDATION_ERROR (400, con details)
Regla de negocio en usecase  → throw new AppError(code, message, statusCode)
Recurso no encontrado        → el controlador o el caso de uso lanza AppError *_NOT_FOUND (404)
JSON mal formado             → errorHandler lo traduce a INVALID_JSON (400)
Cualquier otro error         → errorHandler responde INTERNAL_ERROR (500) y lo registra en consola
```

Todo error pasa por el **único** `middlewares/errorHandler.js`. Los controladores nunca arman respuestas de
error a mano: lanzan un `AppError`.

## Ejemplo de consumo (frontend)

```javascript
const respuesta = await fetch("http://localhost:8000/inscripciones", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ socioId: 1, claseId: 2 }),
});

if (respuesta.ok) {
  const inscripcion = await respuesta.json(); // 201
  console.log("Inscripción creada:", inscripcion.id);
} else {
  const { error } = await respuesta.json();
  if (error.code === "CLASE_SIN_CUPO") {
    console.log("La clase está llena");
  } else {
    console.error(error.code, error.message, error.details);
  }
}
```

Para borrar (`204`) no hay body: no se debe llamar a `respuesta.json()`.

## Documentación relacionada

- [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md): endpoints y ejemplos.
- [`openapi.yaml`](./openapi.yaml): contrato OpenAPI 3 (Swagger UI en `/api-docs`).
