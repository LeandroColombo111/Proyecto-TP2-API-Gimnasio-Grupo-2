# AGENTS.md — usecases/

> Scope: casos de uso (reglas de negocio). Antes de editar acá, leer también el `AGENTS.md` de la raíz y
> la sección "Modelo de dominio" de `CLAUDE.md`.

## Responsabilidad
Acá viven **todas las reglas de negocio**. Un caso de uso recibe datos ya validados, consulta y escribe a través
del DAO que le **inyectan**, aplica las reglas y, si corresponde, **emite eventos**.

## Qué hay acá
```
socios/          getSocios, getSocioById, createSocio, updateSocio, deleteSocio, getClasesDeSocio, makeSocioUseCases
clases/          getClases, getClaseById, createClase, updateClase, deleteClase, getSociosDeClase, makeClaseUseCases
inscripciones/   getInscripciones, getInscripcionById, inscribirSocio, cancelarInscripcion, makeInscripcionUseCases
paginar.js       armarPagina: arma { data, meta } desde { items, total }
```

## Reglas
- **Un archivo por caso de uso**, y una **factory** `makeXxxUseCases({ ...dependencias })` que los junta y les
  inyecta el DAO. El controlador solo ve la factory.
- **Nunca importar un DAO concreto** (`SociosMemoryDao`, etc.). Las dependencias llegan por parámetro.
- Las reglas lanzan `AppError(code, message, statusCode)`: `409` si choca con el estado de los datos, `404` si algo
  no existe. Nunca `throw new Error()`.
- No usar `req` ni `res`: un caso de uso no sabe que existe HTTP.
- Lo que necesita **consultar datos** (duplicados, cupos, inscripciones activas) va acá, no en los schemas Zod.
- Los eventos se emiten **después** de que la operación se concretó, con un **payload plano** (sin instancias de
  clases). Nunca crear un notificador acá: se reacciona desde `alerts/`.
- Leer configuración de negocio desde `config/config.js` (ej: `CUPO_BAJO_THRESHOLD`) es aceptable. Instanciar un
  notificador o leer `process.env` no.

## Patrón
```js
// Un caso de uso: (datos, dependencias) -> resultado
async function createSocio(data, dao) {
  if (await dao.getByEmail(data.email)) {
    throw new AppError("EMAIL_DUPLICADO", "Ya existe un socio con ese email", 409);
  }
  return dao.save(data);
}

// La factory inyecta el DAO
function makeSocioUseCases({ sociosDao, inscripcionesDao }) {
  return {
    createSocio: (data) => createSocio(data, sociosDao),
    deleteSocio: (id) => deleteSocio(id, sociosDao, inscripcionesDao),
  };
}
```

## Orden de las reglas de `inscribirSocio`
socio existe → clase existe → socio activo → no está ya inscripto → hay cupo. La primera que falla corta. Si se
cambia el orden, cambia el error que ve el cliente y hay que actualizar `docs/`.

## Al agregar una regla
1. Escribirla acá, con un `code` en MAYÚSCULAS.
2. Documentar el `code` en `docs/openapi.yaml` y `docs/API_RESPONSE_STRUCTURE.md`.
3. Agregar un caso en `requests.http`.
4. Si necesita un dato nuevo (ej: contar inscripciones), agregar el método al DAO **con la misma interfaz en
   todos los DAO**.

## Errores comunes
- Chequear el cupo solo con `clase.cuposDisponibles`: el DAO también puede devolver `null` si el cupo se agotó
  entre el chequeo y la escritura. Se contemplan ambos casos.
- Emitir un evento antes de guardar: si el guardado falla, el evento ya salió.
