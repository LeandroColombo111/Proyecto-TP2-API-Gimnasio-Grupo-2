# AGENTS.md — container/

> Scope: Composition Root. Antes de editar acá, leer también el `AGENTS.md` de la raíz.

## Responsabilidad
`container.js` es el **único lugar donde se ensamblan las dependencias**. Es la única capa que conoce a todas las
demás. `buildContainer()` devuelve el router principal que monta `index.js`.

## Orden de armado
```
1. DAOs                  getSociosDao() / getClasesDao() / getInscripcionesDao()   (la factory elige el adaptador)
2. Bus y notificadores   createEventBus(), getNotifier(NOTIFIER_TYPE, ...), getNotifier(ALERT_NOTIFIER_TYPE, ...)
                         + registrar los listeners (alerts/)
3. Casos de uso          makeSocioUseCases({ sociosDao, inscripcionesDao }), makeInscripcionUseCases({ ..., events })
4. Controladores         new SociosController(socioUseCases), ...
5. Routers               router.use("/socios", createSociosRouter(sociosController)), ...
```
También monta `GET /health` y `/api-docs`.

## Reglas
- Acá se hace `new` de controladores y se llama a las factories. En ninguna otra capa.
- Los notificadores se **crean acá** y se pasan a los listeners; el caso de uso nunca los conoce.
- Si un DAO tiene un método `init` (Sequelize lo va a tener), se llama acá antes de armar los casos de uso.
- No hay lógica de negocio ni de HTTP en este archivo: solo conexiones.

## Al agregar un recurso nuevo
1. Agregar `getXxxDao()` en `dao/daoFactory.js`.
2. Importar el DAO, `makeXxxUseCases`, el controlador y `createXxxRouter`.
3. Armarlos en el orden de arriba y montar el router (`router.use("/xxx", ...)`).
4. Si el recurso necesita datos de otro (ej: inscripciones necesita socios y clases), pasar esos DAO a
   `makeXxxUseCases`.

## Errores comunes
- Olvidar pasar `inscripcionesDao` a los casos de uso de socios o clases: las reglas de borrado y de cupo
  fallarían.
- Registrar un listener sin pasarle el notificador correcto (el principal vs. el de alertas).
