# AGENTS.md — dao/

> Scope: acceso a datos. Antes de editar acá, leer también el `AGENTS.md` de la raíz y el de `connection/`.

## Responsabilidad
Leer y escribir datos. Cada entidad tiene **dos adaptadores con la misma interfaz**: en memoria y con Sequelize
(SQLite). Los casos de uso no saben cuál les tocó.

## Qué hay acá
```
socios/          SociosMemoryDao.js          SociosSequelizeDao.js
clases/          ClasesMemoryDao.js          ClasesSequelizeDao.js
inscripciones/   InscripcionesMemoryDao.js   InscripcionesSequelizeDao.js
models/          SocioModel.js, ClaseModel.js, InscripcionModel.js, index.js (asociaciones y sincronizar())
daoFactory.js    getSociosDao / getClasesDao / getInscripcionesDao, según PERSISTENCE_TYPE
memoryUtils.js   ordenar y paginar un array (helpers de los DAO en memoria)
sequelizeUtils.js  armarOrden, armarPagina y aPlano (helpers de los DAO de Sequelize)
```

## Interfaz (el contrato que cumplen todos los adaptadores)
| Entidad | Métodos |
|---|---|
| Socios | `getAll({ filtros, sort, page, limit })` → `{ items, total }`, `getById`, `getByEmail`, `getByDni`, `save`, `update`, `delete` |
| Clases | `getAll({ filtros, sort, page, limit })` → `{ items, total }`, `getById`, `save`, `update`, `delete`, `ajustarCupo(id, delta)` |
| Inscripciones | `getAll(filtros)`, `getById`, `findActiva(socioId, claseId)`, `countActivasByClase`, `countActivasBySocio`, `getClasesActivasBySocio`, `getSociosActivosByClase`, `inscribir({ socioId, claseId })`, `cancelar(id)` |

Retornos: `getById` / `getByEmail` / `getByDni` / `update` → el objeto o `null`. `delete` → `true` / `false`.

## Reglas
- **Todos los métodos son `async`**, aunque en memoria no hagan nada asíncrono: así la firma no cambia con la base.
- Devolver **objetos planos y copias** (`{ ...socio }`). Nunca el objeto guardado en el array (se podría mutar el
  estado interno) y nunca instancias de un ORM.
- El **id lo asigna el DAO**: `save` ignora un `id` que venga en los datos. `update` no puede cambiar el `id`.
- Los DAO **no aplican reglas de negocio** (no lanzan `AppError`). Solo guardan y consultan.
- Campos privados con `#` en los DAO en memoria. Se exporta la clase (para tests) y una instancia por defecto.
- **Cualquier método nuevo se agrega con la misma firma en todos los adaptadores.** Si un modo responde distinto
  del otro, es un bug del DAO, no del caso de uso.
- `inscribir` y `cancelar` modifican **dos cosas a la vez** (la inscripción y el cupo de la clase). En memoria, el
  chequeo y la resta de `ClasesMemoryDao.ajustarCupo` no tienen un `await` en el medio, y eso los hace atómicos.
  Con Sequelize esto va en una **transacción**.

## `daoFactory.js`
Es el único lugar que decide qué adaptador usar según `PERSISTENCE_TYPE` (`memory` | `sequelize`). El contenedor
llama a `init()` de los DAO que lo tengan (los de Sequelize: crea las tablas y carga los datos de ejemplo si están
vacías).

## DAO de Sequelize: cómo están hechos
- Modelos en `models/` y asociaciones **centralizadas** en `models/index.js` (`hasMany` / `belongsTo` para 1 a N,
  `belongsToMany` a través de `Inscripcion` para N a N).
- Devuelven siempre **objetos planos** con `aPlano(instancia)` (`get({ plain: true })`). Nunca una instancia del modelo.
- Misma forma de respuesta que memoria, incluida la de `inscripciones` (`{ ..., socio: {...}, clase: {...} }`,
  con `null` si el socio o la clase fueron borrados).
- Los listados filtran, ordenan y paginan **en la base** (`findAndCountAll` con `where`, `order`, `limit`, `offset`)
  y devuelven `{ items, total }`.
- **Transacciones:** `inscribir` y `cancelar` hacen las dos escrituras (la inscripción y el cupo de la clase)
  dentro de `sequelize.transaction(...)`. Si algo falla en el medio, rollback. Pasar siempre `{ transaction: t }` a
  **cada** operación de la transacción: una que lo olvide queda fuera y no se deshace.
- Después de la transacción se lee con `getById` para devolver la inscripción con su socio y su clase.
- `getClasesActivasBySocio` y `getSociosActivosByClase` usan la asociación N a N con `through: { where: { estado: "activa" } }`.

## Trampas de Sequelize
- **`through: { model, unique: false }`** en los dos `belongsToMany`: sin eso se crea `UNIQUE (socioId, claseId)` y
  no se puede re-inscribir a un socio tras cancelar. La opción va dentro de `through`.
- **`constraints: false`** en las asociaciones: una inscripción cancelada se conserva aunque se borre el socio o la
  clase (como en memoria).
- **`sync()` no modifica tablas existentes.** Si cambia un modelo, borrar el archivo de la base.
- Los DAO de Sequelize **no importan de `schemas/`**: la lista de días de `ClaseModel` está repetida a propósito.

## Al cambiar un DAO
- Cambiar la interfaz o la forma de respuesta en **los dos** adaptadores.
- Correr la verificación de paridad (`npm run paridad`, ver `connection/AGENTS.md`). Las diferencias se corrigen
  **en los DAO**, nunca en casos de uso, controladores o rutas.
- Si un caso nuevo no está en `scripts/paridad.js`, agregarlo.

## Errores comunes
- Devolver el objeto interno: otro código lo modifica y rompe el estado sin pasar por `update`.
- Poner una regla de negocio en el DAO (ej: "no inscribir si no hay cupo"): va en el caso de uso. El DAO solo
  informa que no pudo (`null`).
