# AGENTS.md — connection/ y scripts/

> Scope: conexión a la base de datos y scripts de verificación. Leer también el `AGENTS.md` de la raíz y el de
> `dao/`.

## connection/

| Archivo | Para qué |
|---|---|
| `sequelize.js` | Crea la instancia de Sequelize (SQLite). El archivo sale de `DB_STORAGE` (`config/config.js`) |
| `index.js` | Punto único de acceso: `export { sequelize }` |

Reglas:
- La ruta de la base **no se escribe acá**: viene de `config/config.js` (`DB_STORAGE`).
- Solo `dao/models/` importa la conexión. Casos de uso, controladores y rutas no la conocen.
- `logging: false` por defecto; para ver el SQL que genera Sequelize, cambiarlo temporalmente a `console.log`.
- El archivo `*.sqlite` **no se versiona** (está en `.gitignore`).

## scripts/

Verifican que los dos modos de persistencia respondan igual (consigna: "ambos modos deben responder igual").

| Archivo | Uso |
|---|---|
| `paridad.js` | `node scripts/paridad.js <urlBase> <archivoSalida>`: ejecuta 65 pedidos fijos y guarda status + body de cada uno |
| `comparar.js` | `node scripts/comparar.js <a.json> <b.json>`: muestra las diferencias; termina con código 1 si hay alguna |

El script **hace login** con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (por eso `npm run paridad` carga el `.env`) y manda el
token en los pedidos que modifican datos. También verifica los casos sin token y con token falso (401).

Cómo correrlos (desde la raíz):
1. Levantar el servidor con `PERSISTENCE_TYPE=memory` y correr `npm run paridad -- http://localhost:8000 memory.json`.
2. Apagarlo. Con `PERSISTENCE_TYPE=sequelize` y **una base vacía** (otro `DB_STORAGE` o borrar el archivo), levantarlo y
   correr `npm run paridad -- http://localhost:8000 sequelize.json`.
3. `npm run paridad:comparar -- memory.json sequelize.json`: la salida esperada es "Sin diferencias".

Reglas:
- La secuencia es **fija y depende del orden** (los ids se asignan en orden): siempre arrancar con datos de ejemplo
  limpios en ambos modos.
- `fechaInscripcion` se reemplaza por `<fecha>` y el orden de las claves del JSON se ignora.
- Si aparece una diferencia, se corrige **en el DAO** que se comporta distinto, nunca en casos de uso,
  controladores ni rutas.
- Si se agrega un endpoint o una regla, agregar sus pedidos a `paridad.js`.
