# AGENTS.md — API Gimnasio

Guía para cualquier persona (o herramienta) que trabaje en este repositorio. Explica **qué es el proyecto, cómo
está organizado y qué reglas hay que respetar**. Si algo de acá no coincide con el código, se corrige este archivo.

## Proyecto

API REST de un gimnasio, hecha como TP Integrador de Taller de Programación 2 (ORT). Gestiona **Socios**,
**Clases** e **Inscripciones**. Un socio se inscribe a muchas clases y una clase tiene muchos socios
(relación N a N a través de Inscripciones).

**Stack:** Node.js (ES Modules) · Express 5 · Zod 4 · swagger-ui-express + yaml. Sin TypeScript y sin
contenedores de DI (la inyección de dependencias es manual, con factories).

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor con recarga automática (usa .env)
npm start          # servidor normal (usa .env)
```

- El `.env` se crea a partir de `.env.example` y **no se versiona**.
- Swagger UI: http://localhost:8000/api-docs
- Pruebas manuales: `requests.http` (extensión REST Client de VS Code).

## Estructura del proyecto

```
index.js                  # Arranque: app, middlewares globales, router del contenedor, notFound, errorHandler
config/config.js          # Única lectura de process.env (con valores por defecto)
container/container.js    # Composition Root: arma DAOs -> casos de uso -> controladores -> routers
routes/                   # Rutas + validaciones (una por recurso, más docsRoutes)
controllers/              # Traducen HTTP <-> casos de uso. Delgados, sin reglas de negocio
usecases/                 # Reglas de negocio. Reciben sus dependencias por parámetro
  socios/ clases/ inscripciones/
dao/                      # Acceso a datos (hoy: en memoria)
  socios/ clases/ inscripciones/  daoFactory.js  memoryUtils.js
schemas/                  # Schemas Zod (body, params y query)
middlewares/              # validate, logger, errorHandler, notFound
errors/AppError.js        # Error de dominio: code, message, statusCode, details
events/                   # Bus de eventos (EventEmitter) y nombres de eventos
alerts/                   # Listeners: reaccionan a los eventos
notifications/            # Notificadores (consola, archivo) y su factory
docs/                     # openapi.yaml y documentación de la API
requests.http             # Casos de prueba manuales
```

## Cómo viaja una request

```
Request → logger → express.json → routes (validate con Zod) → controller → usecase → dao
                                                                    │
                                          errores → AppError → errorHandler → { error: {...} }
```

Ejemplo: `POST /inscripciones` → `routes/inscripcionesRoutes.js` → `controllers/inscripcionesController.js` →
`usecases/inscripciones/inscribirSocio.js` (reglas + eventos) → `dao/inscripciones/InscripcionesMemoryDao.js`.

## Mapa de scopes (documentación por carpeta)

Cada capa tiene su propio `AGENTS.md` con las reglas **de esa capa**, un patrón de código real y los errores
comunes. Este archivo (la raíz) tiene lo transversal; los de las carpetas tienen el detalle.

**Antes de editar archivos de una carpeta, leer su `AGENTS.md`.**

| Si trabajás en... | Leer |
|---|---|
| `routes/` | [`routes/AGENTS.md`](routes/AGENTS.md) |
| `controllers/` | [`controllers/AGENTS.md`](controllers/AGENTS.md) |
| `usecases/` (reglas de negocio) | [`usecases/AGENTS.md`](usecases/AGENTS.md) |
| `dao/` (acceso a datos) | [`dao/AGENTS.md`](dao/AGENTS.md) |
| `schemas/` (Zod) | [`schemas/AGENTS.md`](schemas/AGENTS.md) |
| `middlewares/` y `errors/` | [`middlewares/AGENTS.md`](middlewares/AGENTS.md) |
| `container/` (armado de dependencias) | [`container/AGENTS.md`](container/AGENTS.md) |
| `events/` (flujo completo de eventos) | [`events/AGENTS.md`](events/AGENTS.md) |
| `alerts/` (listeners) | [`alerts/AGENTS.md`](alerts/AGENTS.md) |
| `notifications/` (notificadores) | [`notifications/AGENTS.md`](notifications/AGENTS.md) |
| `docs/` (OpenAPI y documentación) | [`docs/AGENTS.md`](docs/AGENTS.md) |

Para entender **qué hace el negocio** (entidades, reglas, cupos), leer la sección "Modelo de dominio" de
[`CLAUDE.md`](CLAUDE.md).

## Guía para una IA (o para alguien nuevo) que trabaja en el proyecto

**Orden de lectura recomendado**
1. Este archivo (reglas transversales).
2. `CLAUDE.md`: modelo de dominio y estado por sprint.
3. El `AGENTS.md` de la carpeta donde se va a trabajar.
4. El código vecino: copiar el patrón de un archivo existente antes de inventar uno nuevo
   (ej: para un recurso nuevo, mirar `socios` completo).

**Qué se puede modificar y qué no**
- Se puede: agregar archivos y endpoints siguiendo los patrones, ampliar casos de uso, schemas, DAO y docs.
- No se cambia sin avisar: el formato de error (`{ error: { code, message, details? } }`), los `code` existentes,
  la interfaz de los DAO, el orden de los middlewares de `index.js`.
- No se agregan librerías, TypeScript ni contenedores de DI. Si hiciera falta una dependencia, se consulta.

**Cosas que suelen salir mal**
- `req.query` en Express 5 no se puede reasignar: ver `middlewares/AGENTS.md`.
- No hace falta `asyncHandler`: Express 5 captura los errores de los handlers `async`.
- Los datos viven en memoria y se reinician con el servidor. Para repetir una prueba, reiniciar.
- Hay un solo proceso en el puerto 8000: si el servidor "no cambia", puede haber otro viejo corriendo.
- El proyecto se **defiende de forma oral**: priorizar código simple y fácil de explicar sobre soluciones ingeniosas.

**Cómo verificar un cambio** (todavía no hay tests automatizados)
```bash
npm run dev                                    # el servidor tiene que arrancar sin errores
curl -s http://localhost:8000/health           # { "status": "ok" }
```
Después, probar el endpoint tocado con `requests.http` o desde Swagger (`/api-docs`), con un caso de éxito y uno
por cada error posible. Si se tocó una regla de negocio, repetir el caso que dispara el error.

## Convenciones obligatorias

**Arquitectura**
- Capas: `routes → controllers → usecases → dao`. Nadie salta una capa.
- Los **controladores no conocen ningún DAO**. Los **casos de uso no importan DAOs concretos**: los reciben por
  parámetro mediante las factories `makeXxxUseCases({ ... })`.
- Quien decide qué DAO se usa es `dao/daoFactory.js` (según `PERSISTENCE_TYPE`), y quien arma todo es
  `container/container.js`.
- Las **reglas de negocio viven en los casos de uso**, no en los controladores, rutas ni schemas.

**Errores**
- Los errores de dominio se lanzan con `throw new AppError(code, message, statusCode)`. Nunca `throw new Error()`
  en un caso de uso.
- Hay un único `errorHandler` y un único `notFound`. El formato de error es siempre
  `{ error: { code, message, details? } }`.
- Códigos HTTP usados: 200, 201, 204, 400, 404, 409, 500.

**Validación**
- Todo dato de entrada (body, params y query) se valida con Zod usando `validate`, `validateParams` o
  `validateQuery` de `middlewares/validate.js`.
- Zod valida la **forma** del dato. Lo que requiere consultar datos (ej: email duplicado) va en el caso de uso.

**DAO**
- Cada entidad tiene DAO con la **misma interfaz** (hoy en memoria; el segundo, con Sequelize, está planificado).
- Los DAO devuelven **objetos planos y copias**, nunca el objeto interno ni instancias de un ORM.
- Todos los métodos son `async`, para no cambiar la firma cuando llegue la base de datos.

**Eventos**
- El caso de uso **emite** el evento solo después de que la operación se concretó. Un **listener en `alerts/`**
  reacciona con un **notificador** que tiene la interfaz `notify({ subject, body })`.
- Cada listener captura sus propios errores (`try/catch` + `console.error`) y no los relanza: un fallo de
  notificación nunca tumba la operación.

**Configuración**
- Toda variable de entorno se lee **solo** en `config/config.js`. Toda variable nueva se agrega también a
  `.env.example`.

**Estilo**
- Nombres de variables, funciones y comentarios en español (como en clase). Comentarios cortos que expliquen el
  **por qué**.
- Archivos y carpetas consistentes: la carpeta es `usecases/` (minúscula). Cuidar mayúsculas/minúsculas en los
  imports (en Linux importa).
- Código simple y legible. No agregar librerías ni patrones que no se necesiten.

## Cómo agregar un endpoint (primero el contrato, después el código)

1. **Contrato:** describir el endpoint en `docs/openapi.yaml` (ruta, parámetros, body con ejemplo, y todas las
   respuestas: éxito y errores). Reutilizar `components/schemas` con `$ref`.
2. **Schema Zod** en `schemas/` para body, params y query.
3. **Caso de uso** en `usecases/<recurso>/` con sus reglas, y registrarlo en `makeXxxUseCases`.
4. **DAO:** si hace falta un método nuevo, agregarlo con la misma interfaz en todos los DAO del recurso.
5. **Controlador:** un método arrow corto que llame al caso de uso y responda con el status correcto.
6. **Ruta** en `routes/` con `validate...` y registrar todo en `container/container.js` si es un recurso nuevo.
7. **Pruebas manuales** en `requests.http` (un caso de éxito y uno por cada error posible).
8. **Documentación:** actualizar `docs/API_DOCUMENTATION.md` y, si cambia el formato, `docs/API_RESPONSE_STRUCTURE.md`.

## Cómo agregar una regla de negocio

1. Escribirla en el caso de uso, lanzando `AppError` con un `code` en MAYÚSCULAS y el status que corresponda
   (409 si choca con el estado de los datos, 404 si no existe).
2. Documentar el `code` en `docs/openapi.yaml` y en `docs/API_RESPONSE_STRUCTURE.md`.
3. Agregar el caso en `requests.http`.

## Cómo agregar un evento

1. Agregar el nombre en `events/eventNames.js`.
2. Emitirlo desde el caso de uso (con un payload plano), recibiendo `events` por parámetro.
3. Crear o ampliar un listener en `alerts/` (con `try/catch`) y registrarlo en `container/container.js`.
4. Documentarlo en la sección de eventos del `README.md`.

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `8000` | Puerto del servidor |
| `NODE_ENV` | `development` | Entorno |
| `PERSISTENCE_TYPE` | `memory` | Tipo de persistencia (`memory`; `sequelize` está planificado) |
| `CUPO_BAJO_THRESHOLD` | `2` | Cupos libres a partir de los cuales se emite `clase.cupoBajo` |
| `NOTIFIER_TYPE` | `console` | Notificador de la bienvenida (`console` o `file`) |
| `ALERT_NOTIFIER_TYPE` | `file` | Notificador de las alertas (`console` o `file`) |

## Estado del proyecto

| Área | Estado |
|---|---|
| Base: capas, contenedor, validación, errores | Hecho |
| CRUD de Socios y Clases (memoria) | Hecho |
| Inscripciones, reglas de negocio y relación N a N | Hecho |
| Filtros, orden y paginación | Hecho |
| Eventos `inscripcion.creada` y `clase.cupoBajo` | Hecho |
| Swagger en `/api-docs` | Hecho (cubre los endpoints actuales) |
| Persistencia con Sequelize + transacción | Planificado |
| JWT y hash de contraseñas | Planificado |
| Tests de casos de uso | Planificado |
| README completo | Planificado |

## Qué NO hacer

- No importar un DAO dentro de un controlador o de un caso de uso.
- No poner reglas de negocio en rutas, controladores o schemas de Zod.
- No leer `process.env` fuera de `config/config.js`.
- No responder errores con `res.status(...).json(...)` a mano: se lanza un `AppError`.
- No subir `node_modules`, `.env`, `*.sqlite` ni `*.log`.
- No dejar un endpoint nuevo sin documentar en `docs/openapi.yaml` y sin casos en `requests.http`.

## Definición de terminado

Un cambio está terminado cuando:
- [ ] Respeta las capas y las convenciones de arriba.
- [ ] Valida la entrada con Zod y devuelve los códigos HTTP correctos.
- [ ] Está documentado en `docs/openapi.yaml` (con ejemplos y errores) y tiene casos en `requests.http`.
- [ ] Se probó a mano (Swagger o `requests.http`) con casos de éxito y de error.
- [ ] No quedaron `console.log` de debug ni código muerto.

## Commits

Mensajes cortos en español con prefijo: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
(ej: `feat(inscripciones): inscripción y cancelación con reglas de cupo`). Commits chicos y progresivos,
y cada integrante aporta los suyos.

## Documentación relacionada

- [`CLAUDE.md`](CLAUDE.md): modelo de dominio, reglas de negocio, estado por sprint y template de PR.
- `AGENTS.md` dentro de cada carpeta de capa: ver "Mapa de scopes" más arriba.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md): endpoints, parámetros y ejemplos.
- [`docs/API_RESPONSE_STRUCTURE.md`](docs/API_RESPONSE_STRUCTURE.md): formato de respuestas y catálogo de errores.
- [`docs/openapi.yaml`](docs/openapi.yaml): contrato OpenAPI 3 (se ve en `/api-docs`).
- [`README.md`](README.md): descripción general y eventos.
