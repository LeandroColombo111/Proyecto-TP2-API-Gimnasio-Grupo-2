# AGENTS.md — auth/ (autenticación con JWT)

> Scope: servicios de autenticación. Leer también el `AGENTS.md` de la raíz. El flujo completo atraviesa varias
> carpetas: está resumido abajo.

## Idea
- **Login:** el usuario manda email y contraseña. Si coinciden, la API le devuelve un **token JWT** firmado.
- **Rutas protegidas:** el cliente manda el token en `Authorization: Bearer <token>`. Un middleware lo verifica
  antes de que el pedido llegue al controlador.
- **Contraseñas:** se guardan **hasheadas** (bcrypt), nunca en texto plano.

```
POST /auth/login → routes/authRoutes → controllers/authController → usecases/auth/login
                                                                      ├─ dao/usuarios  (busca al usuario y su hash)
                                                                      ├─ auth/passwordService.comparar
                                                                      └─ auth/tokenService.firmar  → { token, expiresIn }

POST /socios (protegido) → middlewares/requireAuth → auth/tokenService.verificar → controlador...
```

## Qué hay acá
| Archivo | Para qué |
|---|---|
| `tokenService.js` | `createTokenService({ secret, expiresIn })`: `firmar(payload)` y `verificar(token)` con `jsonwebtoken` |
| `passwordService.js` | `createPasswordService()`: `hashear(password)` y `comparar(password, hash)` con `bcryptjs` |

Otros archivos del flujo: `usecases/auth/` (login y admin inicial), `dao/usuarios/` (DAO en memoria y Sequelize),
`dao/models/UsuarioModel.js`, `schemas/authSchema.js`, `routes/authRoutes.js`, `controllers/authController.js` y
`middlewares/requireAuth.js`.

## Reglas
- **Solo `auth/` importa `jsonwebtoken` y `bcryptjs`.** Los casos de uso y el middleware reciben los servicios por
  parámetro (inyectados desde `container/container.js`), igual que los DAO.
- El **secreto, la duración y las credenciales del admin** se leen en `config/config.js` (`JWT_SECRET`,
  `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Nunca hardcodeadas. En `.env.example` van solo valores de
  ejemplo.
- **Login:** el error es siempre `401 CREDENCIALES_INVALIDAS` con el mismo mensaje, ya falle el email o la
  contraseña. Si fueran distintos, alguien podría descubrir qué emails existen.
- **El hash de la contraseña no sale del DAO** salvo por `getByEmailConHash`, que solo usa el login. `save`
  devuelve el usuario sin el hash. Ninguna respuesta de la API incluye el hash.
- **En el token van solo datos necesarios** (`sub`, `email`, `rol`). El payload de un JWT **no está encriptado**
  (cualquiera puede leerlo): nunca poner contraseñas ni secretos. Lo que protege al token es la **firma**: si se
  modifica, `verificar` falla.
- El middleware devuelve `401 UNAUTHORIZED` si falta el token y `401 TOKEN_INVALIDO` si es inválido o venció.
- `requireAuth` va **primero** en la cadena de la ruta, antes de validar el body.

## Rutas protegidas y públicas
| Pública | Protegida (requireAuth) |
|---|---|
| Todos los `GET`, `GET /health`, `/api-docs`, `POST /auth/login` | `POST`, `PUT`, `PATCH` y `DELETE` de socios, clases e inscripciones |

## Al proteger un endpoint nuevo
1. Recibir `requireAuth` en la factory del router y ponerlo primero en la ruta.
2. Agregar `security: - bearerAuth: []` y la respuesta `401` (`$ref: "#/components/responses/Unauthorized"`) en
   `docs/openapi.yaml`.
3. Agregar el encabezado `Authorization: Bearer {{token}}` y un caso sin token en `requests.http`.
4. Agregar el caso en `scripts/paridad.js` (los pedidos que no son `GET` ya llevan el token solos).

## Errores comunes
- Importar `jsonwebtoken` o `bcryptjs` en un caso de uso: se inyectan los servicios.
- Devolver `passwordHash` en una respuesta.
- Poner distinto mensaje para "email inexistente" y "contraseña incorrecta".
- Olvidar `requireAuth` en una ruta nueva que modifica datos.
