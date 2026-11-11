import { describe, it, expect, beforeEach } from "vitest";
import { crearEntorno } from "../helpers/entorno.js";
import { esperarAppError } from "../helpers/errores.js";
import { socioValido, SOCIO_LUCIA, SOCIO_MARTIN, SOCIO_INACTIVO, CLASE_FUNCIONAL, CLASE_YOGA } from "../helpers/datos.js";

// Spec: docs/specs/casos-de-uso.spec.md, sección 1 (Socios)
let env;
beforeEach(() => {
  env = crearEntorno();
});

describe("crear socio", () => {
  it("SOC-01 crea un socio con id asignado por el DAO", async () => {
    const socio = await env.socios.createSocio(socioValido());
    expect(socio.id).toBe(4); // los datos de ejemplo llegan hasta el 3
    expect(socio.nombre).toBe("Ana");
    expect(await env.socios.getSocioById(4)).toEqual(socio);
  });

  it("SOC-02 sin teléfono queda null", async () => {
    const socio = await env.socios.createSocio(socioValido());
    expect(socio.telefono).toBeNull();
  });

  it("SOC-03 email duplicado -> 409 EMAIL_DUPLICADO", async () => {
    await esperarAppError(
      env.socios.createSocio(socioValido({ email: "lucia.fernandez@mail.com" })),
      "EMAIL_DUPLICADO",
      409,
    );
  });

  it("SOC-04 DNI duplicado -> 409 DNI_DUPLICADO", async () => {
    await esperarAppError(env.socios.createSocio(socioValido({ dni: "30123456" })), "DNI_DUPLICADO", 409);
  });

  it("SOC-05 con email y DNI duplicados falla primero el email", async () => {
    await esperarAppError(
      env.socios.createSocio(socioValido({ email: "lucia.fernandez@mail.com", dni: "30123456" })),
      "EMAIL_DUPLICADO",
      409,
    );
  });

  it("SOC-03/04 un duplicado no guarda nada", async () => {
    await env.socios.createSocio(socioValido({ dni: "30123456" })).catch(() => {});
    const { meta } = await env.socios.getSocios({ page: 1, limit: 10 });
    expect(meta.total).toBe(3);
  });
});

describe("modificar socio", () => {
  it("SOC-06 modifica un campo y no toca los demás", async () => {
    const socio = await env.socios.updateSocio(SOCIO_LUCIA, { nombre: "Lucía María" });
    expect(socio.nombre).toBe("Lucía María");
    expect(socio.apellido).toBe("Fernández");
    expect(socio.email).toBe("lucia.fernandez@mail.com");
  });

  it("SOC-07 conservar su propio email y DNI no es duplicado", async () => {
    const socio = await env.socios.updateSocio(SOCIO_LUCIA, {
      email: "lucia.fernandez@mail.com",
      dni: "30123456",
      telefono: "1100000000",
    });
    expect(socio.telefono).toBe("1100000000");
  });

  it("SOC-08 email de otro socio -> 409 EMAIL_DUPLICADO", async () => {
    await esperarAppError(
      env.socios.updateSocio(SOCIO_LUCIA, { email: "martin.gomez@mail.com" }),
      "EMAIL_DUPLICADO",
      409,
    );
  });

  it("SOC-09 DNI de otro socio -> 409 DNI_DUPLICADO", async () => {
    await esperarAppError(env.socios.updateSocio(SOCIO_LUCIA, { dni: "32456789" }), "DNI_DUPLICADO", 409);
  });

  it("SOC-10 socio inexistente -> null", async () => {
    expect(await env.socios.updateSocio(999, { nombre: "X" })).toBeNull();
  });

  it("SOC-10 un socio inexistente no valida duplicados (devuelve null aunque el email exista)", async () => {
    expect(await env.socios.updateSocio(999, { email: "martin.gomez@mail.com" })).toBeNull();
  });

  it("SOC-11 se puede pasar a inactivo", async () => {
    const socio = await env.socios.updateSocio(SOCIO_LUCIA, { activo: false });
    expect(socio.activo).toBe(false);
  });
});

describe("borrar socio", () => {
  it("SOC-12 sin inscripciones se borra", async () => {
    expect(await env.socios.deleteSocio(SOCIO_LUCIA)).toBe(true);
    expect(await env.socios.getSocioById(SOCIO_LUCIA)).toBeNull();
  });

  it("SOC-13 con inscripción activa -> 409 SOCIO_CON_INSCRIPCIONES", async () => {
    await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_FUNCIONAL });
    await esperarAppError(env.socios.deleteSocio(SOCIO_LUCIA), "SOCIO_CON_INSCRIPCIONES", 409);
    expect(await env.socios.getSocioById(SOCIO_LUCIA)).not.toBeNull();
  });

  it("SOC-14 con inscripción cancelada se borra", async () => {
    const inscripcion = await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_FUNCIONAL });
    await env.inscripciones.cancelarInscripcion(inscripcion.id);
    expect(await env.socios.deleteSocio(SOCIO_LUCIA)).toBe(true);
  });

  it("SOC-15 socio inexistente -> false", async () => {
    expect(await env.socios.deleteSocio(999)).toBe(false);
  });
});

describe("consultar socios", () => {
  it("SOC-16 por id: existente y inexistente", async () => {
    expect((await env.socios.getSocioById(SOCIO_MARTIN)).nombre).toBe("Martín");
    expect(await env.socios.getSocioById(999)).toBeNull();
  });

  it("SOC-17 listar devuelve data y meta", async () => {
    const resultado = await env.socios.getSocios({ page: 1, limit: 2 });
    expect(resultado.data).toHaveLength(2);
    expect(resultado.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it("SOC-17 la última página tiene menos elementos", async () => {
    const resultado = await env.socios.getSocios({ page: 2, limit: 2 });
    expect(resultado.data).toHaveLength(1);
  });

  it("SOC-18 filtra por activo", async () => {
    const inactivos = await env.socios.getSocios({ activo: false, page: 1, limit: 10 });
    expect(inactivos.data.map((s) => s.id)).toEqual([SOCIO_INACTIVO]);
    const activos = await env.socios.getSocios({ activo: true, page: 1, limit: 10 });
    expect(activos.meta.total).toBe(2);
  });

  it("SOC-18 q busca en nombre, apellido y email sin distinguir mayúsculas", async () => {
    const resultado = await env.socios.getSocios({ q: "GÓMEZ", page: 1, limit: 10 });
    expect(resultado.data.map((s) => s.id)).toEqual([SOCIO_MARTIN]);
  });

  it("SOC-18 q sin coincidencias devuelve una lista vacía", async () => {
    const resultado = await env.socios.getSocios({ q: "zzz", page: 1, limit: 10 });
    expect(resultado.data).toEqual([]);
    expect(resultado.meta.total).toBe(0);
    expect(resultado.meta.totalPages).toBe(0);
  });

  it("SOC-18 ordena descendente con sort=-apellido", async () => {
    const resultado = await env.socios.getSocios({ sort: "-apellido", page: 1, limit: 10 });
    expect(resultado.data.map((s) => s.apellido)).toEqual(["Ramírez", "Gómez", "Fernández"]);
  });

  it("SOC-19 página fuera de rango -> data vacío y total correcto", async () => {
    const resultado = await env.socios.getSocios({ page: 99, limit: 10 });
    expect(resultado.data).toEqual([]);
    expect(resultado.meta.total).toBe(3);
  });
});

describe("clases de un socio", () => {
  it("SOC-20 solo trae las clases con inscripción activa", async () => {
    await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_FUNCIONAL });
    const yoga = await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_YOGA });
    await env.inscripciones.cancelarInscripcion(yoga.id);

    const clases = await env.socios.getClasesDeSocio(SOCIO_LUCIA);
    expect(clases.map((c) => c.id)).toEqual([CLASE_FUNCIONAL]);
  });

  it("SOC-20 un socio sin inscripciones devuelve una lista vacía", async () => {
    expect(await env.socios.getClasesDeSocio(SOCIO_LUCIA)).toEqual([]);
  });

  it("SOC-21 socio inexistente -> 404 SOCIO_NOT_FOUND", async () => {
    await esperarAppError(env.socios.getClasesDeSocio(999), "SOCIO_NOT_FOUND", 404);
  });
});
