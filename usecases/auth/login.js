import AppError from "../../errors/AppError.js";

// Caso de uso: iniciar sesión. Devuelve un token si el email y la contraseña son correctos.
// Si falla el email o falla la contraseña, el error y el mensaje son EXACTAMENTE el mismo: así quien intenta
// entrar no puede descubrir qué emails existen en el sistema.
async function login({ email, password }, { usuariosDao, passwordService, tokenService }) {
  const usuario = await usuariosDao.getByEmailConHash(email);
  const coincide = usuario ? await passwordService.comparar(password, usuario.passwordHash) : false;

  if (!coincide) {
    throw new AppError("CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos", 401);
  }

  // En el token van solo los datos necesarios, nunca la contraseña ni el hash
  const token = tokenService.firmar({ sub: usuario.id, email: usuario.email, rol: usuario.rol });
  return { token, expiresIn: tokenService.expiresIn };
}

export default login;
