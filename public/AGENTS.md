# AGENTS.md — public/ (página de demo)

> Scope: la página de prueba que se usa en la demo y en la defensa. Leer también el `AGENTS.md` de la raíz.

## Qué es
Una **única página** (`index.html`) con HTML, CSS y JavaScript puro, sin frameworks ni compilación. Llama a la API
con `fetch` y muestra lo que devuelve. No forma parte de la API ni de la consigna: es solo una ayuda para mostrar el
proyecto funcionando.

Se sirve con `express.static` desde `container/container.js`, así que se abre en http://localhost:8000.
(Abierta como archivo suelto, el navegador bloquearía los pedidos a la API por CORS.)

## Qué hace
| Sección | Qué muestra o permite |
|---|---|
| Sesión | Login con `POST /auth/login`. El token se guarda en **`localStorage`** (clave `token`): la sesión sigue al recargar y se ve en F12 > Application |
| Clases | Lista con los cupos libres (`GET /clases`) |
| Socios | Lista, alta y baja (`GET`, `POST` y `DELETE /socios`) |
| Inscripciones | Inscribir (`POST /inscripciones`) y cancelar (`PATCH /inscripciones/:id/cancelar`) |
| Mensaje de arriba | Verde si salió bien; rojo con el `status`, el `code` y el `message` si la API devolvió un error |

## Reglas
- Mantenerla **simple**: una sola página, sin librerías ni pasos de compilación. Tiene que poder explicarse en 30
  segundos ("es una página que llama a la API con `fetch`").
- **Toda la comunicación pasa por `llamar(metodo, ruta, body)`**: agrega el token si hay sesión y muestra el error
  de la API con su `code`. No hacer `fetch` suelto en otro lado.
- Los textos que vienen de la API se muestran con `esc(...)` para que un nombre con símbolos como `<` no rompa la
  página.
- El token se maneja **solo** con `guardarToken(...)`: actualiza la variable, `localStorage` y el texto de la sesión.
  Se borra al cerrar sesión y también cuando la API responde `TOKEN_INVALIDO` (token vencido o alterado).
- `localStorage` es cómodo para una demo, pero cualquier script de la página puede leerlo: en una aplicación real se
  prefiere una cookie `HttpOnly`. Por eso la página escapa los textos de la API con `esc(...)`.
- Las acciones que modifican datos **no se bloquean** si no hay sesión, a propósito: así se ve el `401` en la
  demo.
- Después de cada acción se llama a `cargarTodo()`, que vuelve a pedir los datos. Los desplegables se llenan con
  `llenarSelect(...)` para no perder lo que la persona había elegido.
- Si la API cambia (rutas, campos o errores), actualizar la página en el mismo cambio.
- No poner credenciales reales en la página: los valores precargados son los de ejemplo de `.env.example`.

## Cómo probarla
1. `npm run dev` y abrir http://localhost:8000.
2. Sin iniciar sesión, probar **Inscribir**: da `401 UNAUTHORIZED`.
3. **Iniciar sesión** (valores precargados: los de `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`) y repetir.
4. Inscribir a dos socios en Spinning (cupo 2) y a un tercero: `409 CLASE_SIN_CUPO`. Cancelar una inscripción y ver
   cómo el cupo vuelve a la clase.
5. Funciona igual con `PERSISTENCE_TYPE=memory` y con `sequelize`.
