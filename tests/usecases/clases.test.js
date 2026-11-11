import { describe, it, expect, beforeEach } from "vitest";
import { crearEntorno } from "../helpers/entorno.js";
import { esperarAppError } from "../helpers/errores.js";
import { claseValida, SOCIO_LUCIA, SOCIO_MARTIN, CLASE_FUNCIONAL, CLASE_SPINNING, CLASE_YOGA } from "../helpers/datos.js";

// Spec: docs/specs/casos-de-uso.spec.md, sección 2 (Clases)
let env;
beforeEach(() => {
  env = crearEntorno();
});

// Llena la clase de Spinning (cupo 2) con los dos socios activos
async function llenarSpinning() {
  const a = await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_SPINNING });
  const b = await env.inscripciones.inscribirSocio({ socioId: SOCIO_MARTIN, claseId: CLASE_SPINNING });
  return [a, b];
}

describe("crear clase", () => {
  it("CLA-01 cuposDisponibles es igual a cupoMaximo", async () => {
    const clase = await env.clases.createClase(claseValida({ cupoMaximo: 7 }));
    expect(clase.id).toBe(4);
    expect(clase.cupoMaximo).toBe(7);
    expect(clase.cuposDisponibles).toBe(7);
  });

  it("CLA-02 ignora un cuposDisponibles que venga en el dato", async () => {
    const clase = await env.clases.createClase(claseValida({ cupoMaximo: 7, cuposDisponibles: 1 }));
    expect(clase.cuposDisponibles).toBe(7);
  });

  it("CLA-01 cupo mínimo (1) es válido", async () => {
    const clase = await env.clases.createClase(claseValida({ cupoMaximo: 1 }));
    expect(clase.cuposDisponibles).toBe(1);
  });
});

describe("modificar clase", () => {
  it("CLA-03 cambiar el nombre no toca los cupos", async () => {
    await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_FUNCIONAL });
    const clase = await env.clases.updateClase(CLASE_FUNCIONAL, { nombre: "Funcional Pro" });
    expect(clase.nombre).toBe("Funcional Pro");
    expect(clase.cuposDisponibles).toBe(9);
  });

  it("CLA-04 subir el cupo recalcula los disponibles (cupoMaximo - activas)", async () => {
    await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_FUNCIONAL });
    await env.inscripciones.inscribirSocio({ socioId: SOCIO_MARTIN, claseId: CLASE_FUNCIONAL });
    const clase = await env.clases.updateClase(CLASE_FUNCIONAL, { cupoMaximo: 20 });
    expect(clase.cupoMaximo).toBe(20);
    expect(clase.cuposDisponibles).toBe(18);
  });

  it("CLA-05 bajar el cupo por debajo de los inscriptos -> 409 CUPO_INVALIDO", async () => {
    await llenarSpinning();
    await esperarAppError(env.clases.updateClase(CLASE_SPINNING, { cupoMaximo: 1 }), "CUPO_INVALIDO", 409);
    // no se modificó nada
    expect((await env.clases.getClaseById(CLASE_SPINNING)).cupoMaximo).toBe(2);
  });

  it("CLA-06 bajar el cupo justo a los inscriptos se permite y deja 0 disponibles", async () => {
    await llenarSpinning();
    const clase = await env.clases.updateClase(CLASE_SPINNING, { cupoMaximo: 2 });
    expect(clase.cuposDisponibles).toBe(0);
  });

  it("CLA-07 clase inexistente -> null", async () => {
    expect(await env.clases.updateClase(999, { nombre: "X" })).toBeNull();
  });

  it("CLA-08 las inscripciones canceladas no cuentan", async () => {
    const [primera] = await llenarSpinning();
    await env.inscripciones.cancelarInscripcion(primera.id);
    // queda 1 activa: el cupo puede bajar a 1 pero no a 0
    const clase = await env.clases.updateClase(CLASE_SPINNING, { cupoMaximo: 1 });
    expect(clase.cuposDisponibles).toBe(0);
    await esperarAppError(env.clases.updateClase(CLASE_SPINNING, { cupoMaximo: 0 }), "CUPO_INVALIDO", 409);
  });
});

describe("borrar clase", () => {
  it("CLA-09 sin inscripciones se borra", async () => {
    expect(await env.clases.deleteClase(CLASE_YOGA)).toBe(true);
    expect(await env.clases.getClaseById(CLASE_YOGA)).toBeNull();
  });

  it("CLA-10 con inscripción activa -> 409 CLASE_CON_INSCRIPCIONES", async () => {
    await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_YOGA });
    await esperarAppError(env.clases.deleteClase(CLASE_YOGA), "CLASE_CON_INSCRIPCIONES", 409);
    expect(await env.clases.getClaseById(CLASE_YOGA)).not.toBeNull();
  });

  it("CLA-11 con inscripción cancelada se borra", async () => {
    const inscripcion = await env.inscripciones.inscribirSocio({ socioId: SOCIO_LUCIA, claseId: CLASE_YOGA });
    await env.inscripciones.cancelarInscripcion(inscripcion.id);
    expect(await env.clases.deleteClase(CLASE_YOGA)).toBe(true);
  });

  it("CLA-12 clase inexistente -> false", async () => {
    expect(await env.clases.deleteClase(999)).toBe(false);
  });
});

describe("consultar clases", () => {
  it("CLA-13 por id: existente y inexistente", async () => {
    expect((await env.clases.getClaseById(CLASE_YOGA)).nombre).toBe("Yoga");
    expect(await env.clases.getClaseById(999)).toBeNull();
  });

  it("CLA-14 filtra por día", async () => {
    const resultado = await env.clases.getClases({ dia: "lunes", page: 1, limit: 10 });
    expect(resultado.data.map((c) => c.id)).toEqual([CLASE_FUNCIONAL]);
  });

  it("CLA-14 filtra por instructor sin distinguir mayúsculas", async () => {
    const resultado = await env.clases.getClases({ instructor: "ANA", page: 1, limit: 10 });
    expect(resultado.data.map((c) => c.id)).toEqual([CLASE_SPINNING]);
  });

  it("CLA-14 conCupo=true oculta las llenas y conCupo=false muestra solo las llenas", async () => {
    await llenarSpinning();
    const conCupo = await env.clases.getClases({ conCupo: true, page: 1, limit: 10 });
    expect(conCupo.data.map((c) => c.id)).toEqual([CLASE_FUNCIONAL, CLASE_YOGA]);
    const llenas = await env.clases.getClases({ conCupo: false, page: 1, limit: 10 });
    expect(llenas.data.map((c) => c.id)).toEqual([CLASE_SPINNING]);
  });

  it("CLA-14 sin coincidencias -> lista vacía", async () => {
    const resultado = await env.clases.getClases({ dia: "sabado", page: 1, limit: 10 });
    expect(resultado.data).toEqual([]);
    expect(resultado.meta.total).toBe(0);
  });
});

describe("socios de una clase", () => {
  it("CLA-15 solo trae los socios con inscripción activa", async () => {
    const [primera] = await llenarSpinning();
    await env.inscripciones.cancelarInscripcion(primera.id);
    const socios = await env.clases.getSociosDeClase(CLASE_SPINNING);
    expect(socios.map((s) => s.id)).toEqual([SOCIO_MARTIN]);
  });

  it("CLA-15 una clase sin inscriptos devuelve una lista vacía", async () => {
    expect(await env.clases.getSociosDeClase(CLASE_YOGA)).toEqual([]);
  });

  it("CLA-16 clase inexistente -> 404 CLASE_NOT_FOUND", async () => {
    await esperarAppError(env.clases.getSociosDeClase(999), "CLASE_NOT_FOUND", 404);
  });
});
