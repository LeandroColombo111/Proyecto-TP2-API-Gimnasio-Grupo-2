# CLAUDE.md — API Gimnasio

@AGENTS.md

Las convenciones de arquitectura, la estructura de carpetas, los comandos y el paso a paso para agregar
endpoints, reglas y eventos están en `AGENTS.md` (importado arriba). Este archivo agrega el **modelo de dominio**,
el **estado del trabajo** y el **template de PR**.

## Reglas de trabajo

- No hacer `git commit` ni `git push` salvo que se pida de forma explícita.
- Antes de cambiar código, leer el caso de uso, el DAO y el schema involucrados: el comportamiento está repartido
  en capas.
- **Trabajar por scopes:** cada carpeta de capa tiene su `AGENTS.md` (`routes/`, `controllers/`, `usecases/`,
  `dao/`, `schemas/`, `middlewares/`, `container/`, `events/`, `alerts/`, `notifications/`, `docs/`). Antes de editar
  archivos de una carpeta, leer su `AGENTS.md`: tiene las reglas, el patrón y los errores comunes de esa capa. El
  mapa completo está en la sección "Mapa de scopes" de `AGENTS.md`.
- Si un cambio toca un endpoint, actualizar en el mismo cambio `docs/openapi.yaml`,
  `docs/API_DOCUMENTATION.md` y `requests.http`.
- Ante la duda entre dos diseños, elegir el más simple y fácil de explicar: el proyecto se defiende de forma oral.

---

# Modelo de dominio

## Entidades

**Socio** — persona que se inscribe a clases.

| Campo | Notas |
|---|---|
| `id` | Lo asigna el DAO |
| `nombre`, `apellido` | Obligatorios |
| `email` | Obligatorio, único, se guarda en minúsculas |
| `dni` | Obligatorio, único, string de 7 u 8 dígitos |
| `telefono` | Opcional (`null` si no se envía) |
| `activo` | Boolean, default `true`. Un socio inactivo no puede inscribirse |

**Clase** — actividad con día, horario y cupo.

| Campo | Notas |
|---|---|
| `id` | Lo asigna el DAO |
| `nombre`, `instructor` | Obligatorios |
| `dia` | `lunes`, `martes`, `miercoles`, `jueves`, `viernes` o `sabado` |
| `horario` | `HH:MM` (00:00 a 23:59) |
| `cupoMaximo` | Entero mayor a 0 |
| `cuposDisponibles` | **Lo calcula el sistema**: nunca viene en el body |

**Inscripción** — une a un socio con una clase.

| Campo | Notas |
|---|---|
| `id` | Lo asigna el DAO |
| `socioId`, `claseId` | Referencias a socio y clase |
| `fechaInscripcion` | ISO 8601, la pone el sistema |
| `estado` | `activa` o `cancelada` |

**Usuario** — solo para autenticación (no tiene CRUD).

| Campo | Notas |
|---|---|
| `id` | Lo asigna el DAO |
| `email` | Único, en minúsculas |
| `passwordHash` | Hash bcrypt de la contraseña. Nunca sale en una respuesta |
| `rol` | `admin` |

## Relaciones

```
Socio 1 ──── N Inscripcion N ──── 1 Clase
```

Socio y Clase tienen una relación **N a N a través de Inscripción**. Una inscripción nunca se borra ni se edita:
se **cancela**, para conservar el historial. Las consultas de la relación (`GET /socios/:id/clases` y
`GET /clases/:id/socios`) solo cuentan inscripciones **activas**.

## Reglas de negocio

Todas viven en los casos de uso (`usecases/`).

| Regla | Dónde | Error |
|---|---|---|
| Email o DNI duplicado (alta y modificación; en la modificación se excluye al propio socio) | `createSocio`, `updateSocio` | 409 `EMAIL_DUPLICADO` / `DNI_DUPLICADO` |
| No borrar un socio con inscripciones activas | `deleteSocio` | 409 `SOCIO_CON_INSCRIPCIONES` |
| No borrar una clase con inscripciones activas | `deleteClase` | 409 `CLASE_CON_INSCRIPCIONES` |
| No bajar `cupoMaximo` por debajo de los inscriptos activos | `updateClase` | 409 `CUPO_INVALIDO` |
| Inscribir: el socio y la clase deben existir | `inscribirSocio` | 404 `SOCIO_NOT_FOUND` / `CLASE_NOT_FOUND` |
| Inscribir: el socio debe estar activo | `inscribirSocio` | 409 `SOCIO_INACTIVO` |
| Inscribir: no puede estar ya inscripto (activa) en esa clase | `inscribirSocio` | 409 `YA_INSCRIPTO` |
| Inscribir: la clase debe tener cupo | `inscribirSocio` | 409 `CLASE_SIN_CUPO` |
| Cancelar una inscripción ya cancelada | `cancelarInscripcion` | 409 `INSCRIPCION_YA_CANCELADA` |

El orden de los chequeos de `inscribirSocio` importa: socio existe → clase existe → socio activo → no está ya
inscripto → hay cupo. La primera regla que falla corta con su error.

## Cupos (cómo se calcula `cuposDisponibles`)

- Al **crear** una clase: `cuposDisponibles = cupoMaximo`.
- Al **inscribir**: se resta 1. Al **cancelar**: se suma 1.
- Al **modificar `cupoMaximo`**: `cuposDisponibles = cupoMaximo - inscripciones activas` (y se rechaza si el nuevo
  cupo es menor a las activas).
- Inscribir es una operación de **dos escrituras** (crear la inscripción y restar el cupo) que tienen que ocurrir
  juntas. En memoria, `ClasesMemoryDao.ajustarCupo` chequea y resta sin ningún `await` en el medio, por eso dos
  pedidos simultáneos no pueden quedarse con el último cupo. Con Sequelize se resuelve con una **transacción**.

## Eventos

| Evento | Se emite en | Condición | Listener |
|---|---|---|---|
| `inscripcion.creada` | `inscribirSocio` | La inscripción se concretó | `alerts/registerInscripcionListeners.js` (bienvenida) |
| `clase.cupoBajo` | `inscribirSocio` | Después de inscribir, `cuposDisponibles <= CUPO_BAJO_THRESHOLD` | `alerts/registerCupoListeners.js` (alerta al staff) |

Si la inscripción falla, **no se emite ningún evento**. Los listeners capturan sus propios errores.

## Datos de ejemplo (memoria)

Al arrancar, los DAO en memoria traen datos de ejemplo. Spinning tiene cupo 2 a propósito, para probar
`CLASE_SIN_CUPO` y la alerta de cupo bajo; el socio 3 está inactivo para probar `SOCIO_INACTIVO`.

| Entidad | Datos |
|---|---|
| Socios | 1 Lucía Fernández (activa), 2 Martín Gómez (activo), 3 Sofía Ramírez (**inactiva**) |
| Clases | 1 Funcional (lunes 08:00, cupo 10), 2 Spinning (miércoles 19:00, **cupo 2**), 3 Yoga (viernes 18:00, cupo 15) |

Con `PERSISTENCE_TYPE=memory` los datos viven en memoria: al reiniciar el servidor vuelven a estos valores. Con
`sequelize` se cargan en la base solo si la tabla está vacía y después **persisten** (para volver a estos valores,
borrar `database.sqlite`).

## Trampa conocida: `req.query` en Express 5

En Express 5 `req.query` se recalcula en cada acceso: asignarle claves no guarda nada. Por eso
`middlewares/validate.js` lo redefine con `Object.defineProperty` después de validar. Si se toca ese middleware,
verificar que los filtros numéricos y booleanos de la query sigan llegando ya convertidos (ej: `?conCupo=true`,
`?page=2`).

---

# Trabajo en curso

El proyecto se desarrolla por sprints (un milestone de GitHub por sprint).

| Sprint | Contenido | Estado |
|---|---|---|
| 1 | Base del proyecto, Swagger, CRUD de Socios y Clases en memoria | Hecho |
| 2 | Inscripciones, reglas de negocio, relación N a N, filtros y paginación, eventos | Hecho |
| 3 | Persistencia con Sequelize + SQLite, transacción, paridad con memoria | Hecho |
| 4 | JWT, hash de contraseñas, tests de casos de uso | JWT y hash: hecho. Tests de casos de uso: pendiente |
| 5 | Swagger y README completos, auditoría contra la consigna, ensayo de defensa | Pendiente |

## Sprint 3: cómo quedó la persistencia

- Cada entidad tiene dos DAO con la **misma interfaz**: `dao/*/…MemoryDao.js` y `dao/*/…SequelizeDao.js`.
  `dao/daoFactory.js` elige según `PERSISTENCE_TYPE` (`memory` | `sequelize`) y el contenedor llama a `init()` de
  los DAO que lo tengan (crea las tablas y carga los datos de ejemplo si están vacías).
- Los modelos están en `dao/models/` y las asociaciones **centralizadas** en `dao/models/index.js`:
  `hasMany` / `belongsTo` para la relación 1 a N, y `belongsToMany` a través de `Inscripcion` para la N a N.
- Los DAO devuelven **objetos planos**. Casos de uso, controladores y rutas **no se tocaron**.
- `inscribir` y `cancelar` de `InscripcionesSequelizeDao` usan una **transacción** (la inscripción y el cupo se
  escriben juntos; si algo falla, rollback).
- Ambos modos responden **igual**: `npm run paridad` ejecuta 65 pedidos contra cada modo y `npm run paridad:comparar`
  muestra las diferencias (hoy ninguna).

### Detalles de Sequelize que hay que conocer

- **Restricción única en la tabla intermedia:** por defecto `belongsToMany` crea `UNIQUE (socioId, claseId)` y un
  socio no podría volver a inscribirse tras cancelar. Se evita con `through: { model, unique: false }` (la opción va
  dentro de `through`, no en el `belongsToMany`).
- **Sin claves foráneas** (`constraints: false`): una inscripción cancelada queda como historial aunque se borre el
  socio o la clase, igual que en memoria (el `include` devuelve `socio: null` / `clase: null`).
- **`sync()` una sola vez:** los tres DAO llaman a `sincronizar()` (`dao/models/index.js`), que guarda la promesa y
  la reutiliza.
- **Orden:** sin `sort` se ordena por `id`. Con `sort` se compara en minúsculas (`lower(campo)`), y el `id` desempata.
- **Limitación conocida:** SQLite ordena por código de carácter, así que un apellido que empiece con tilde
  ("Álvarez") queda después de la "z", mientras que el DAO en memoria usa `localeCompare("es")`.

## Sprint 4: autenticación (hecho) y tests (pendiente)

**Cómo quedó el JWT**
- `POST /auth/login` (público) devuelve `{ token, expiresIn }`. Los `POST`, `PUT`, `PATCH` y `DELETE` de socios,
  clases e inscripciones requieren `Authorization: Bearer <token>` mediante `middlewares/requireAuth.js`. Los `GET`
  quedan públicos.
- `auth/tokenService.js` (firmar y verificar con `jsonwebtoken`) y `auth/passwordService.js` (hashear y comparar con
  `bcryptjs`, 10 rondas) se **inyectan** desde el contenedor: ningún caso de uso importa esas librerías.
- Hay una entidad **Usuario** (`id`, `email`, `passwordHash`, `rol`) con DAO en memoria y con Sequelize
  (`dao/usuarios/`), misma interfaz. El hash solo sale por `getByEmailConHash`, que usa el login; `save` devuelve el
  usuario sin el hash.
- Al arrancar, `usecases/auth/crearAdminInicial.js` crea el administrador (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) si no
  existe y la contraseña se guarda hasheada. Sin `ADMIN_PASSWORD` no se crea ningún usuario.
- Errores 401: `CREDENCIALES_INVALIDAS` (login; **el mismo** para email inexistente y contraseña incorrecta),
  `UNAUTHORIZED` (falta el token) y `TOKEN_INVALIDO` (inválido, alterado o vencido).
- Variables nuevas en `config/config.js` y `.env.example` (con valores de ejemplo): `JWT_SECRET`, `JWT_EXPIRES_IN`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`. En `production` `JWT_SECRET` es obligatorio.
- Flujo completo y reglas: `auth/AGENTS.md`.
- `npm run paridad` ahora hace login primero y verifica también los `401` (65 pedidos iguales en ambos modos).

**Pendiente del Sprint 4:** tests de los casos de uso usando DAOs en memoria como dobles (sin servidor ni base de
datos), con el `code` y el `statusCode` del `AppError` verificados.

---

# Template de PR

Usar este template para todas las PRs del proyecto.

```markdown
## Qué hace este PR
[Descripción breve, 1 o 2 líneas]

## Por qué
[Contexto: por qué hace falta este cambio]

## Tipo
- [ ] Feature
- [ ] Bugfix
- [ ] Docs
- [ ] Refactor

## Issue / Milestone
[Link al issue de GitHub o nombre del milestone]

<!-- Si es BUGFIX, completar esta sección -->
## Bugfix (si aplica)
### Antes
[Qué pasaba: describir, o pegar el log / captura]

### Después
[Qué cambió: describir, o pegar el log / captura]

<!-- Si es FEATURE, completar esta sección -->
## Feature (si aplica)
### Evidencia
[Endpoints, reglas o comportamientos nuevos: qué se agregó y qué hace cada uno]

## Cómo probarlo
1.
2.
```

**Ejemplo de PR bien completada:**

```markdown
## Qué hace este PR
Agrega la inscripción y cancelación de socios a clases, con las reglas de cupo.

## Por qué
Es el núcleo de la relación N a N entre Socios y Clases (Sprint 2).

## Tipo
- [x] Feature
- [ ] Bugfix
- [ ] Docs
- [ ] Refactor

## Issue / Milestone
Sprint 2 - Inscripciones, reglas y eventos

## Feature (si aplica)
### Evidencia
- `POST /inscripciones`: inscribe y descuenta un cupo. Valida socio, clase, socio activo, no duplicada y cupo.
- `PATCH /inscripciones/:id/cancelar`: cancela y devuelve el cupo.
- `GET /socios/:id/clases` y `GET /clases/:id/socios`: consultas de la relación.
- Se emiten `inscripcion.creada` y `clase.cupoBajo`.

## Cómo probarlo
1. `npm run dev` y abrir http://localhost:8000/api-docs
2. Inscribir al socio 1 y al 2 en Spinning (clase 2): ambos dan 201 y el cupo llega a 0.
3. Inscribir a otro socio: 409 `CLASE_SIN_CUPO`.
4. Cancelar la inscripción 1: 200 y el cupo vuelve a 1.
```

El PR descripto con este template **no lleva pies automáticos** ni firmas de herramientas: solo las secciones de
arriba.
