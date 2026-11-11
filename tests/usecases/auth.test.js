import { describe, it, expect, beforeEach, vi } from "vitest";
import { crearEntornoAuth } from "../helpers/entorno.js";
import { esperarAppError } from "../helpers/errores.js";

// Spec: docs/specs/casos-de-uso.spec.md, sección 4 (Autenticación)
let env;
beforeEach(async () => {
  env = crearEntornoAuth();
  // No ensuciar la salida del test con los console.log del caso de uso
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  await env.auth.crearAdminInicial({ email: "Admin@Gimnasio.com", password: "clave123" });
});

describe("login", () => {
  it("AUT-01 con credenciales correctas devuelve token y expiresIn", async () => {
    const resultado = await env.auth.login({ email: "admin@gimnasio.com", password: "clave123" });
    expect(resultado).toEqual({ token: "token-falso", expiresIn: "1h" });
  });

  it("AUT-02 email inexistente -> 401 CREDENCIALES_INVALIDAS", async () => {
    await esperarAppError(env.auth.login({ email: "otro@mail.com", password: "clave123" }), "CREDENCIALES_INVALIDAS", 401);
  });

  it("AUT-03 contraseña incorrecta -> 401 CREDENCIALES_INVALIDAS", async () => {
    await esperarAppError(env.auth.login({ email: "admin@gimnasio.com", password: "mala" }), "CREDENCIALES_INVALIDAS", 401);
  });

  it("AUT-04 email inexistente y contraseña incorrecta dan exactamente el mismo error", async () => {
    const sinEmail = await env.auth.login({ email: "otro@mail.com", password: "clave123" }).catch((e) => e);
    const sinPassword = await env.auth.login({ email: "admin@gimnasio.com", password: "mala" }).catch((e) => e);
    expect(sinEmail.code).toBe(sinPassword.code);
    expect(sinEmail.message).toBe(sinPassword.message);
    expect(sinEmail.statusCode).toBe(sinPassword.statusCode);
  });

  it("AUT-03 caso margen: contraseña vacía no entra", async () => {
    await esperarAppError(env.auth.login({ email: "admin@gimnasio.com", password: "" }), "CREDENCIALES_INVALIDAS", 401);
  });

  it("AUT-05 el token lleva sub, email y rol, y nunca la contraseña ni el hash", async () => {
    await env.auth.login({ email: "admin@gimnasio.com", password: "clave123" });
    const payload = env.tokensEmitidos[0];
    expect(payload).toEqual({ sub: 1, email: "admin@gimnasio.com", rol: "admin" });
    expect(JSON.stringify(payload)).not.toContain("clave123");
    expect(payload.passwordHash).toBeUndefined();
  });
});

describe("crear admin inicial", () => {
  it("AUT-06 guarda el email en minúsculas y la contraseña hasheada", async () => {
    const guardado = await env.usuariosDao.getByEmailConHash("admin@gimnasio.com");
    expect(guardado.rol).toBe("admin");
    expect(guardado.passwordHash).toBe("hash(clave123)");
    expect(guardado.passwordHash).not.toBe("clave123");
  });

  it("AUT-07 si ya existe no crea un segundo usuario", async () => {
    await env.auth.crearAdminInicial({ email: "ADMIN@gimnasio.com", password: "otra-clave" });
    const guardado = await env.usuariosDao.getByEmailConHash("admin@gimnasio.com");
    expect(guardado.id).toBe(1);
    expect(guardado.passwordHash).toBe("hash(clave123)"); // no se pisó
    expect(await env.usuariosDao.getByEmailConHash("admin@gimnasio.com")).not.toBeNull();
  });

  it("AUT-08 sin contraseña no crea ningún usuario", async () => {
    const otro = crearEntornoAuth();
    await otro.auth.crearAdminInicial({ email: "admin@gimnasio.com", password: undefined });
    expect(await otro.usuariosDao.getByEmailConHash("admin@gimnasio.com")).toBeNull();
    await otro.auth.crearAdminInicial({ email: "admin@gimnasio.com", password: "" });
    expect(await otro.usuariosDao.getByEmailConHash("admin@gimnasio.com")).toBeNull();
  });
});

describe("DAO de usuarios", () => {
  it("AUT-09 save devuelve el usuario sin passwordHash", async () => {
    const usuario = await env.usuariosDao.save({ email: "x@mail.com", passwordHash: "hash(x)" });
    expect(usuario).toEqual({ id: 2, email: "x@mail.com", rol: "admin" });
    expect(usuario.passwordHash).toBeUndefined();
  });
});
