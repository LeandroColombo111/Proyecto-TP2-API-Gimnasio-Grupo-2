# AGENTS.md — controllers/

> Scope: capa de controladores. Antes de editar acá, leer también el `AGENTS.md` de la raíz.

## Responsabilidad
Traducir **HTTP ↔ casos de uso**: leer `req`, llamar a un caso de uso y responder con el status correcto.
Son **delgados**: sin reglas de negocio y sin conocer ningún DAO.

## Qué hay acá
`sociosController.js`, `clasesController.js`, `inscripcionesController.js`: una clase por recurso.

## Reglas
- Una **clase** con un campo privado `#useCases` que recibe por constructor. No importa DAOs ni casos de uso
  sueltos.
- Los métodos son **arrow functions** (`list = async (req, res) => {...}`) para poder pasarlos a las rutas sin
  perder `this`.
- Los datos validados ya están en `req.body`, `req.params` y `req.query`, **ya convertidos** por Zod (números,
  booleanos, defaults). No volver a parsearlos.
- Status: `200` por defecto, `201` al crear (`res.status(201).json(...)`), `204` al borrar (`res.status(204).send()`).
- Los errores se **lanzan** con `throw new AppError(...)`. Nunca armar `res.status(4xx).json({ error })` a mano:
  el `errorHandler` lo hace.
- No hace falta `try/catch` ni un wrapper `asyncHandler`: Express 5 captura los errores de los handlers `async`.

## Patrón
```js
class SociosController {
  #useCases;

  constructor(useCases) {
    this.#useCases = useCases;
  }

  get = async (req, res) => {
    const socio = await this.#useCases.getSocioById(req.params.id);
    if (!socio) throw new AppError("SOCIO_NOT_FOUND", "No existe un socio con ese id", 404);
    res.json(socio);
  };
}
```

## Dónde vive el 404
- Los casos de uso `getXxxById`, `updateXxx` y `deleteXxx` devuelven `null` o `false` si no existe, y **el
  controlador** lanza el `*_NOT_FOUND` (estilo heredado de la clase).
- Los casos de uso de inscripciones y de la relación N a N lanzan el `AppError` ellos mismos.
- Para código nuevo, preferir que lo lance el caso de uso: el 404 es una regla del dominio.

## Errores comunes
- Importar un DAO "para ahorrar una llamada": rompe la arquitectura.
- Armar el objeto de respuesta a mano cuando el caso de uso ya lo devuelve completo.
