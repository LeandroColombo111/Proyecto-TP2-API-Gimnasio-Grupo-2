import AppError from "../errors/AppError.js";

// Middleware que exige un token JWT válido. Se aplica a las rutas que modifican datos.
// El cliente lo manda en el encabezado:  Authorization: Bearer <token>
// Recibe el servicio de tokens por parámetro, así no importa jsonwebtoken directamente.
function createRequireAuth(tokenService) {
  return (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || "").split(" ");

    // Sin encabezado, o con otro formato: el cliente no se identificó
    if (tipo !== "Bearer" || !token) {
      return next(new AppError("UNAUTHORIZED", "Falta el token. Enviá el encabezado Authorization: Bearer <token>", 401));
    }

    try {
      // Si la firma es válida y no venció, se guardan los datos del usuario para quien los necesite
      req.usuario = tokenService.verificar(token);
      next();
    } catch {
      next(new AppError("TOKEN_INVALIDO", "El token es inválido o expiró", 401));
    }
  };
}

export default createRequireAuth;
