# AGENTS.md — dao/

> Scope: acceso a datos. Antes de editar acá, leer también el `AGENTS.md` de la raíz.

## Responsabilidad
Leer y escribir datos. Cada entidad tiene **dos adaptadores con la misma interfaz**: en memoria (hoy) y Sequelize
(planificado). Los casos de uso no saben cuál les tocó.

## Qué hay acá
```
socios/          SociosMemoryDao.js
clases/          ClasesMemoryDao.js
inscripciones/   InscripcionesMemoryDao.js
daoFactory.js    getSociosDao / getClasesDao / getInscripcionesDao, según PERSISTENCE_TYPE
memoryUtils.js   ordenar y paginar un array (helpers de los DAO en memoria)
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
Es el único lugar que decide qué adaptador usar. `PERSISTENCE_TYPE=sequelize` hoy lanza un error explícito
(`TODO Sprint 3`). Al agregar Sequelize se reemplaza ese `throw` por el DAO real, sin tocar nada más.

## Al agregar Sequelize (Sprint 3)
- Modelos en `dao/models/` y asociaciones **centralizadas** en `dao/models/index.js`.
- Devolver siempre objetos planos (`get({ plain: true })` o `raw: true`).
- Misma forma de respuesta que memoria, incluida la de `inscripciones` (`{ ..., socio: {...}, clase: {...} }`).
- Verificar paridad entre los dos modos; las diferencias se corrigen **en los DAO**, nunca en casos de uso,
  controladores o rutas.

## Errores comunes
- Devolver el objeto interno: otro código lo modifica y rompe el estado sin pasar por `update`.
- Poner una regla de negocio en el DAO (ej: "no inscribir si no hay cupo"): va en el caso de uso. El DAO solo
  informa que no pudo (`null`).
