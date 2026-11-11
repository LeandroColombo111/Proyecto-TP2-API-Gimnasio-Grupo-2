import jwt from "jsonwebtoken";

// Servicio de tokens JWT. Los casos de uso y el middleware lo reciben por parámetro: nadie más importa jsonwebtoken.
// Un JWT tiene tres partes: encabezado, datos (payload) y firma. Los datos NO están encriptados (se pueden leer),
// pero la firma impide modificarlos: si alguien cambia el token, la verificación falla.
function createTokenService({ secret, expiresIn }) {
  return {
    expiresIn,
    // Crea un token con los datos del usuario, firmado con el secreto y con fecha de vencimiento
    firmar: (payload) => jwt.sign(payload, secret, { expiresIn }),
    // Devuelve los datos del token, o lanza un error si la firma no coincide o el token venció
    verificar: (token) => jwt.verify(token, secret),
  };
}

export default createTokenService;
