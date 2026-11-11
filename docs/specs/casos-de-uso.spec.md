# Spec: dominio y casos de uso

Esta spec se escribe **antes** que los tests (Spec Driven Development): describe qué tiene que hacer el sistema y
cada test se deriva de una línea de acá. Cada comportamiento tiene un **id**; el test lleva ese mismo id en su
nombre, así se ve rápido qué está cubierto.

Los tests no usan servidor ni base de datos: usan los **DAO en memoria** como dobles y los **helpers** de
`tests/helpers/`. Los datos de ejemplo son los del `CLAUDE.md` (socios 1 y 2 activos, socio 3 inactivo; Funcional
cupo 10, Spinning cupo 2, Yoga cupo 15).

Convención: **camino feliz** (ok), **error** (código y status del `AppError`) y **caso margen** (borde).

## 1. Socios

| Id | Comportamiento | Resultado esperado |
|---|---|---|
| SOC-01 | Crear con datos válidos | Devuelve el socio con `id` asignado por el DAO |
| SOC-02 | Crear sin teléfono | `telefono` queda `null` |
| SOC-03 | Crear con email ya registrado | 409 `EMAIL_DUPLICADO` |
| SOC-04 | Crear con DNI ya registrado | 409 `DNI_DUPLICADO` |
| SOC-05 | Crear con email y DNI duplicados | Falla primero el email (`EMAIL_DUPLICADO`) |
| SOC-06 | Modificar un campo cualquiera | Devuelve el socio actualizado y no toca los demás campos |
| SOC-07 | Modificar conservando su propio email y DNI | No es duplicado: se modifica |
| SOC-08 | Modificar con el email de otro socio | 409 `EMAIL_DUPLICADO` |
| SOC-09 | Modificar con el DNI de otro socio | 409 `DNI_DUPLICADO` |
| SOC-10 | Modificar un socio que no existe | Devuelve `null` |
| SOC-11 | Modificar `activo` a `false` | El socio queda inactivo |
| SOC-12 | Borrar un socio sin inscripciones | Devuelve `true` y ya no existe |
| SOC-13 | Borrar un socio con inscripción activa | 409 `SOCIO_CON_INSCRIPCIONES` y el socio sigue existiendo |
| SOC-14 | Borrar un socio con inscripción cancelada | Se borra (las canceladas son historial) |
| SOC-15 | Borrar un socio que no existe | Devuelve `false` |
| SOC-16 | Obtener por id existente / inexistente | El socio / `null` |
| SOC-17 | Listar sin filtros | `data` + `meta` (`page`, `limit`, `total`, `totalPages`) |
| SOC-18 | Listar filtrando `activo` y `q` | Solo los que coinciden (`q` sin distinguir mayúsculas) |
| SOC-19 | Listar con una página fuera de rango | `data` vacío y `total` correcto |
| SOC-20 | Clases de un socio | Solo las clases con inscripción **activa** |
| SOC-21 | Clases de un socio que no existe | 404 `SOCIO_NOT_FOUND` |

## 2. Clases

| Id | Comportamiento | Resultado esperado |
|---|---|---|
| CLA-01 | Crear una clase | `cuposDisponibles` es igual a `cupoMaximo` |
| CLA-02 | Crear ignorando un `cuposDisponibles` que viene en el dato | Manda `cupoMaximo` |
| CLA-03 | Modificar el nombre (sin tocar el cupo) | No cambia `cuposDisponibles` |
| CLA-04 | Subir `cupoMaximo` con inscriptos | `cuposDisponibles = cupoMaximo - inscriptos activos` |
| CLA-05 | Bajar `cupoMaximo` por debajo de los inscriptos activos | 409 `CUPO_INVALIDO` |
| CLA-06 | Bajar `cupoMaximo` exactamente igual a los inscriptos | Se permite: `cuposDisponibles = 0` |
| CLA-07 | Modificar una clase que no existe | Devuelve `null` |
| CLA-08 | Las inscripciones canceladas no cuentan al cambiar el cupo | Se permite bajar el cupo |
| CLA-09 | Borrar una clase sin inscripciones | Devuelve `true` |
| CLA-10 | Borrar una clase con inscripción activa | 409 `CLASE_CON_INSCRIPCIONES` |
| CLA-11 | Borrar una clase con inscripción cancelada | Se borra |
| CLA-12 | Borrar una clase que no existe | Devuelve `false` |
| CLA-13 | Obtener por id existente / inexistente | La clase / `null` |
| CLA-14 | Listar filtrando `dia`, `instructor` y `conCupo` | Solo las que coinciden |
| CLA-15 | Socios de una clase | Solo los socios con inscripción **activa** |
| CLA-16 | Socios de una clase que no existe | 404 `CLASE_NOT_FOUND` |

## 3. Inscripciones

| Id | Comportamiento | Resultado esperado |
|---|---|---|
| INS-01 | Inscribir con todo correcto | Inscripción `activa` con `fechaInscripcion`, el cupo baja 1 |
| INS-02 | Socio inexistente | 404 `SOCIO_NOT_FOUND` |
| INS-03 | Clase inexistente | 404 `CLASE_NOT_FOUND` |
| INS-04 | Socio inactivo | 409 `SOCIO_INACTIVO` |
| INS-05 | Socio ya inscripto (activa) en la clase | 409 `YA_INSCRIPTO` |
| INS-06 | Clase sin cupo | 409 `CLASE_SIN_CUPO` |
| INS-07 | Se inscribe el último cupo | Se permite y `cuposDisponibles = 0` |
| INS-08 | Orden de los chequeos | Socio inexistente gana a clase inexistente; clase inexistente gana a socio inactivo; socio inactivo gana a cupo |
| INS-09 | Reinscribirse tras cancelar | Se permite (la cancelada no cuenta como ya inscripto) |
| INS-10 | El DAO devuelve `null` (se agotó el cupo en el medio) | 409 `CLASE_SIN_CUPO` y no se emite ningún evento |
| INS-11 | Inscripción exitosa | Emite `inscripcion.creada` con el payload plano |
| INS-12 | Quedan `<= CUPO_BAJO_THRESHOLD` cupos | Emite `clase.cupoBajo` con los cupos que quedaron |
| INS-13 | Quedan más cupos que el umbral | No emite `clase.cupoBajo` |
| INS-14 | Cualquier error de regla | No se emite ningún evento |
| INS-15 | Cancelar una inscripción activa | Queda `cancelada` y el cupo vuelve a la clase |
| INS-16 | Cancelar una inscripción inexistente | 404 `INSCRIPCION_NOT_FOUND` |
| INS-17 | Cancelar una inscripción ya cancelada | 409 `INSCRIPCION_YA_CANCELADA` y el cupo no se suma dos veces |
| INS-18 | Listar con filtros `socioId`, `claseId`, `estado` | Solo las que coinciden, con `socio` y `clase` |
| INS-19 | Obtener por id existente / inexistente | La inscripción / `null` |
| INS-20 | Inscripción de un socio o clase borrados después | `socio` o `clase` vienen en `null` (historial) |

## 4. Autenticación

| Id | Comportamiento | Resultado esperado |
|---|---|---|
| AUT-01 | Login con email y contraseña correctos | Devuelve `{ token, expiresIn }` |
| AUT-02 | Login con email inexistente | 401 `CREDENCIALES_INVALIDAS` |
| AUT-03 | Login con contraseña incorrecta | 401 `CREDENCIALES_INVALIDAS` |
| AUT-04 | Los errores de AUT-02 y AUT-03 | Tienen el **mismo** `code`, `message` y `statusCode` |
| AUT-05 | El payload del token | Tiene `sub`, `email` y `rol`; nunca la contraseña ni el hash |
| AUT-06 | Crear admin inicial | Guarda el usuario con el email en minúsculas y la contraseña **hasheada** |
| AUT-07 | Crear admin inicial si ya existe | No crea un segundo usuario |
| AUT-08 | Crear admin inicial sin contraseña | No crea ningún usuario |
| AUT-09 | `UsuariosDao.save` | Devuelve el usuario sin `passwordHash` |

## 5. Dominio: utilidades y errores

| Id | Comportamiento | Resultado esperado |
|---|---|---|
| UTL-01 | `AppError` | Guarda `code`, `message`, `statusCode` (400 por defecto) y `details`; es un `Error` |
| UTL-02 | `ordenar` sin `sort` | Deja el orden original |
| UTL-03 | `ordenar` ascendente (`campo`) y descendente (`-campo`) | Ordena en cada sentido |
| UTL-04 | `ordenar` | No modifica el array original y usa el orden del español (una tilde no manda la palabra al final) |
| UTL-05 | `paginar` | Devuelve la porción de la página; la última puede tener menos elementos |
| UTL-06 | `paginar` con página fuera de rango | Devuelve `[]` |
| UTL-07 | `armarPagina` | Calcula `totalPages` redondeando hacia arriba |
| UTL-08 | `armarPagina` sin resultados | `totalPages` es `0` |
| UTL-09 | `ClasesMemoryDao.ajustarCupo` | Suma o resta; devuelve `null` si pasa de 0 o de `cupoMaximo` o si no existe |
| UTL-10 | Los DAO en memoria devuelven copias | Modificar lo devuelto no cambia el estado interno |
| UTL-11 | El DAO asigna el `id` | Ignora un `id` que venga en el dato y los ids no se repiten tras borrar |

## Fuera del alcance de esta spec
Rutas, controladores, validación Zod y DAO de Sequelize: se verifican con `requests.http` y con
`npm run paridad` (que compara memoria contra Sequelize).
