import { describe, it, expect, beforeEach, vi } from "vitest";
import { crearEntorno } from "../helpers/entorno.js";
import { esperarAppError } from "../helpers/errores.js";
import { socioValido, claseValida, SOCIO_LUCIA, SOCIO_MARTIN, SOCIO_INACTIVO, CLASE_FUNCIONAL, CLASE_SPINNING, CLASE_YOGA } from "../helpers/datos.js";

// Spec: docs/specs/casos-de-uso.spec.md, sección 3 (Inscripciones)
let env;
beforeEach(() => {
  env = crearEntorno();
});

const inscribir = (socioId, claseId) => env.inscripciones.inscribirSocio({ socioId, claseId });
const cupos = async (claseId) => (await env.clasesDao.getById(claseId)).cuposDisponibles;
// Un tercer socio activo (los de ejemplo son solo dos activos)
const crearSocioExtra = async () => (await env.sociosDao.save(socioValido())).id;

describe("inscribir un socio", () => {
  it("INS-01 inscribe: queda activa, con fecha, y el cupo baja 1", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    expect(inscripcion.estado).toBe("activa");
    expect(inscripcion.socioId).toBe(SOCIO_LUCIA);
    expect(inscripcion.claseId).toBe(CLASE_FUNCIONAL);
    expect(Number.isNaN(Date.parse(inscripcion.fechaInscripcion))).toBe(false);
    expect(inscripcion.socio.nombre).toBe("Lucía");
    expect(inscripcion.clase.nombre).toBe("Funcional");
    expect(await cupos(CLASE_FUNCIONAL)).toBe(9);
  });

  it("INS-02 socio inexistente -> 404 SOCIO_NOT_FOUND", async () => {
    await esperarAppError(inscribir(999, CLASE_FUNCIONAL), "SOCIO_NOT_FOUND", 404);
  });

  it("INS-03 clase inexistente -> 404 CLASE_NOT_FOUND", async () => {
    await esperarAppError(inscribir(SOCIO_LUCIA, 999), "CLASE_NOT_FOUND", 404);
  });

  it("INS-04 socio inactivo -> 409 SOCIO_INACTIVO", async () => {
    await esperarAppError(inscribir(SOCIO_INACTIVO, CLASE_FUNCIONAL), "SOCIO_INACTIVO", 409);
    expect(await cupos(CLASE_FUNCIONAL)).toBe(10);
  });

  it("INS-05 ya inscripto -> 409 YA_INSCRIPTO y no descuenta otro cupo", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    await esperarAppError(inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL), "YA_INSCRIPTO", 409);
    expect(await cupos(CLASE_FUNCIONAL)).toBe(9);
  });

  it("INS-06 clase sin cupo -> 409 CLASE_SIN_CUPO", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING);
    await inscribir(SOCIO_MARTIN, CLASE_SPINNING);
    const otro = await crearSocioExtra();
    await esperarAppError(inscribir(otro, CLASE_SPINNING), "CLASE_SIN_CUPO", 409);
    expect(await cupos(CLASE_SPINNING)).toBe(0);
  });

  it("INS-07 el último cupo se puede tomar", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING);
    await inscribir(SOCIO_MARTIN, CLASE_SPINNING);
    expect(await cupos(CLASE_SPINNING)).toBe(0);
  });

  it("INS-09 se puede reinscribir tras cancelar", async () => {
    const primera = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    await env.inscripciones.cancelarInscripcion(primera.id);
    const segunda = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    expect(segunda.id).not.toBe(primera.id);
    expect(segunda.estado).toBe("activa");
    expect(await cupos(CLASE_FUNCIONAL)).toBe(9);
  });
});

describe("orden de los chequeos de inscribir", () => {
  it("INS-08 socio inexistente gana a clase inexistente", async () => {
    await esperarAppError(inscribir(999, 999), "SOCIO_NOT_FOUND", 404);
  });

  it("INS-08 clase inexistente gana a socio inactivo", async () => {
    await esperarAppError(inscribir(SOCIO_INACTIVO, 999), "CLASE_NOT_FOUND", 404);
  });

  it("INS-08 socio inactivo gana a clase sin cupo", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING);
    await inscribir(SOCIO_MARTIN, CLASE_SPINNING);
    await esperarAppError(inscribir(SOCIO_INACTIVO, CLASE_SPINNING), "SOCIO_INACTIVO", 409);
  });

  it("INS-08 ya inscripto gana a clase sin cupo", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING);
    await inscribir(SOCIO_MARTIN, CLASE_SPINNING);
    await esperarAppError(inscribir(SOCIO_LUCIA, CLASE_SPINNING), "YA_INSCRIPTO", 409);
  });
});

describe("eventos al inscribir", () => {
  it("INS-11 emite inscripcion.creada con el payload plano", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    const creada = env.eventos.filter((e) => e.nombre === "inscripcion.creada");
    expect(creada).toHaveLength(1);
    expect(creada[0].payload).toEqual({
      inscripcionId: inscripcion.id,
      socio: { id: SOCIO_LUCIA, nombre: "Lucía", email: "lucia.fernandez@mail.com" },
      clase: { id: CLASE_FUNCIONAL, nombre: "Funcional", dia: "lunes", horario: "08:00" },
    });
  });

  it("INS-12 emite clase.cupoBajo cuando quedan menos cupos que el umbral", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING); // cupo 2 -> queda 1
    const bajo = env.eventos.filter((e) => e.nombre === "clase.cupoBajo");
    expect(bajo).toHaveLength(1);
    expect(bajo[0].payload).toEqual({ claseId: CLASE_SPINNING, nombre: "Spinning", cuposDisponibles: 1 });
  });

  it("INS-12 caso margen: con exactamente el umbral (2) también emite", async () => {
    const clase = await env.clasesDao.save(claseValida({ cupoMaximo: 4, cuposDisponibles: 4 }));
    await inscribir(SOCIO_LUCIA, clase.id); // quedan 3: no emite
    expect(env.eventos.filter((e) => e.nombre === "clase.cupoBajo")).toHaveLength(0);
    await inscribir(SOCIO_MARTIN, clase.id); // quedan 2: emite
    const bajo = env.eventos.filter((e) => e.nombre === "clase.cupoBajo");
    expect(bajo).toHaveLength(1);
    expect(bajo[0].payload.cuposDisponibles).toBe(2);
  });

  it("INS-12 al tomar el último cupo emite con 0 cupos", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING);
    await inscribir(SOCIO_MARTIN, CLASE_SPINNING);
    const bajo = env.eventos.filter((e) => e.nombre === "clase.cupoBajo");
    expect(bajo.map((e) => e.payload.cuposDisponibles)).toEqual([1, 0]);
  });

  it("INS-13 con muchos cupos no emite clase.cupoBajo (pero sí inscripcion.creada)", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_YOGA);
    expect(env.eventos.map((e) => e.nombre)).toEqual(["inscripcion.creada"]);
  });

  it("INS-14 si falla una regla no se emite ningún evento", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING);
    env.eventos.length = 0;
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING).catch(() => {}); // YA_INSCRIPTO
    await inscribir(SOCIO_INACTIVO, CLASE_FUNCIONAL).catch(() => {}); // SOCIO_INACTIVO
    await inscribir(999, CLASE_FUNCIONAL).catch(() => {}); // SOCIO_NOT_FOUND
    expect(env.eventos).toEqual([]);
  });
});

describe("el DAO se queda sin cupo en el medio (concurrencia)", () => {
  it("INS-10 si el DAO devuelve null -> 409 CLASE_SIN_CUPO y sin eventos", async () => {
    vi.spyOn(env.inscripcionesDao, "inscribir").mockResolvedValue(null);
    await esperarAppError(inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL), "CLASE_SIN_CUPO", 409);
    expect(env.eventos).toEqual([]);
  });

  it("INS-10 dos pedidos simultáneos por el último cupo: gana uno solo", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_SPINNING); // queda 1 cupo
    const otro = await crearSocioExtra();
    const resultados = await Promise.allSettled([inscribir(SOCIO_MARTIN, CLASE_SPINNING), inscribir(otro, CLASE_SPINNING)]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const fallo = resultados.find((r) => r.status === "rejected").reason;
    expect(fallo.code).toBe("CLASE_SIN_CUPO");
    expect(await cupos(CLASE_SPINNING)).toBe(0);
  });
});

describe("cancelar una inscripción", () => {
  it("INS-15 queda cancelada y el cupo vuelve a la clase", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    const cancelada = await env.inscripciones.cancelarInscripcion(inscripcion.id);
    expect(cancelada.estado).toBe("cancelada");
    expect(await cupos(CLASE_FUNCIONAL)).toBe(10);
  });

  it("INS-16 inexistente -> 404 INSCRIPCION_NOT_FOUND", async () => {
    await esperarAppError(env.inscripciones.cancelarInscripcion(999), "INSCRIPCION_NOT_FOUND", 404);
  });

  it("INS-17 ya cancelada -> 409 INSCRIPCION_YA_CANCELADA y el cupo no se suma dos veces", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    await env.inscripciones.cancelarInscripcion(inscripcion.id);
    await esperarAppError(env.inscripciones.cancelarInscripcion(inscripcion.id), "INSCRIPCION_YA_CANCELADA", 409);
    expect(await cupos(CLASE_FUNCIONAL)).toBe(10);
  });
});

describe("consultar inscripciones", () => {
  it("INS-18 lista todas con socio y clase", async () => {
    await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    const lista = await env.inscripciones.getInscripciones({});
    expect(lista).toHaveLength(1);
    expect(lista[0].socio.apellido).toBe("Fernández");
  });

  it("INS-18 filtra por socioId, claseId y estado", async () => {
    const a = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    await inscribir(SOCIO_MARTIN, CLASE_FUNCIONAL);
    await inscribir(SOCIO_LUCIA, CLASE_YOGA);
    await env.inscripciones.cancelarInscripcion(a.id);

    expect(await env.inscripciones.getInscripciones({ socioId: SOCIO_LUCIA })).toHaveLength(2);
    expect(await env.inscripciones.getInscripciones({ claseId: CLASE_FUNCIONAL })).toHaveLength(2);
    const canceladas = await env.inscripciones.getInscripciones({ estado: "cancelada" });
    expect(canceladas.map((i) => i.id)).toEqual([a.id]);
    expect(await env.inscripciones.getInscripciones({ socioId: SOCIO_LUCIA, estado: "activa" })).toHaveLength(1);
  });

  it("INS-18 sin coincidencias -> lista vacía", async () => {
    expect(await env.inscripciones.getInscripciones({ socioId: 999 })).toEqual([]);
  });

  it("INS-19 por id: existente y inexistente", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    expect((await env.inscripciones.getInscripcionById(inscripcion.id)).id).toBe(inscripcion.id);
    expect(await env.inscripciones.getInscripcionById(999)).toBeNull();
  });

  it("INS-20 si se borra el socio, la inscripción cancelada queda con socio null", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    await env.inscripciones.cancelarInscripcion(inscripcion.id);
    await env.socios.deleteSocio(SOCIO_LUCIA);
    const historial = await env.inscripciones.getInscripcionById(inscripcion.id);
    expect(historial.socio).toBeNull();
    expect(historial.clase.nombre).toBe("Funcional");
  });

  it("INS-20 si se borra la clase, la inscripción cancelada queda con clase null", async () => {
    const inscripcion = await inscribir(SOCIO_LUCIA, CLASE_FUNCIONAL);
    await env.inscripciones.cancelarInscripcion(inscripcion.id);
    await env.clases.deleteClase(CLASE_FUNCIONAL);
    const historial = await env.inscripciones.getInscripcionById(inscripcion.id);
    expect(historial.clase).toBeNull();
    expect(historial.socio.nombre).toBe("Lucía");
  });
});
