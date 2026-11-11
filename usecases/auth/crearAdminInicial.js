// Caso de uso: crea el usuario administrador al arrancar, si todavía no existe.
// La contraseña se guarda hasheada. Sin contraseña configurada no se crea ningún usuario.
async function crearAdminInicial({ email, password }, { usuariosDao, passwordService }) {
  if (!password) {
    console.warn("[Auth] ADMIN_PASSWORD no está configurada: no se creó el usuario administrador");
    return;
  }

  const emailNormalizado = email.toLowerCase();
  if (await usuariosDao.getByEmailConHash(emailNormalizado)) return;

  const passwordHash = await passwordService.hashear(password);
  await usuariosDao.save({ email: emailNormalizado, passwordHash, rol: "admin" });
  console.log(`[Auth] Usuario administrador creado: ${emailNormalizado}`);
}

export default crearAdminInicial;
