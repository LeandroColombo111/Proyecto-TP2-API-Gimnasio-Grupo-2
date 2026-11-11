# AGENTS.md — tests/

> Scope: tests automáticos de los casos de uso y del dominio, con **Vitest**. Leer también el `AGENTS.md` de la
> raíz y la spec `docs/specs/casos-de-uso.spec.md`.

## Cómo trabajamos: Spec Driven Development
1. **Primero la spec.** Cada comportamiento se escribe en `docs/specs/casos-de-uso.spec.md` con un **id**
   (`SOC-01`, `INS-05`, `UTL-09`...), el caso y el resultado esperado (código y status si es un error).
2. **Después el test.** El nombre del test empieza con el id de la spec: `it("INS-05 ya inscripto -> 409 ...")`.
3. **Por último el código.** Si el test falla, se arregla el código (o la spec, si estaba mal). Nunca se borra un
   test para que pase.

Si se agrega o cambia una regla de negocio: spec → test → código → `docs/`.

## Comandos
```bash
npm test               # corre todos los tests una vez
npm run test:watch     # vuelve a correr al guardar un archivo
npx vitest run tests/usecases/inscripciones.test.js   # un solo archivo
```

## Qué hay acá
```
tests/
  helpers/
    entorno.js     # crearEntorno(): DAO en memoria nuevos + bus de eventos + casos de uso armados
                   # crearEntornoAuth(): usuariosDao + servicios de contraseña y token FALSOS
    datos.js       # socioValido(), claseValida() y los ids de los datos de ejemplo
    errores.js     # esperarAppError(promesa, code, statusCode)
  usecases/        # socios, clases, inscripciones y auth (un archivo por recurso)
  domain/          # AppError, utilidades (ordenar, paginar, armarPagina) y reglas de los DAO en memoria
```

## Reglas
- **Sin servidor y sin base de datos.** Los DAO en memoria son los dobles. Los tests no usan HTTP, ni Zod, ni
  Sequelize (eso se verifica con `requests.http` y `npm run paridad`).
- **Cada test arranca de cero:** `beforeEach(() => { env = crearEntorno(); })`. Los tests no dependen del orden.
- **Usar los helpers**, no repetir el armado: `crearEntorno()`, `socioValido()`, `esperarAppError(...)`.
- **Los errores se verifican completos:** `code` **y** `statusCode` con `esperarAppError`, no solo "que falle".
- Cada test prueba **una cosa**. Probar el camino feliz, cada error y los **casos margen** (último cupo, cupo
  exactamente igual a los inscriptos, lista vacía, página fuera de rango, `id` inexistente).
- Para ver qué evento se emitió: `env.eventos` (lista de `{ nombre, payload }`).
- Los servicios de auth son falsos a propósito: el test del login prueba la **lógica del caso de uso**, no
  `bcryptjs` ni `jsonwebtoken`.
- El umbral de cupo bajo se fija en `vitest.config.js` (`CUPO_BAJO_THRESHOLD=2`) para no depender del `.env`.
- Nombres de tests y comentarios en español, como el resto del proyecto.

## Qué mirar si un test falla
- Los datos de ejemplo cambiaron (ver "Datos de ejemplo" en `CLAUDE.md`): los tests usan los ids de `helpers/datos.js`.
- Se cambió el orden de los chequeos de `inscribirSocio`: hay tests `INS-08` que lo fijan a propósito.
