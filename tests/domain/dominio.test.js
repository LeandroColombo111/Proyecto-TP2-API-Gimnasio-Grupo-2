import { describe, it, expect } from "vitest";
import AppError from "../../errors/AppError.js";
import { ordenar, paginar } from "../../dao/memoryUtils.js";
import armarPagina from "../../usecases/paginar.js";
import { SociosMemoryDao } from "../../dao/socios/SociosMemoryDao.js";
import { ClasesMemoryDao } from "../../dao/clases/ClasesMemoryDao.js";
import { socioValido } from "../helpers/datos.js";

// Spec: docs/specs/casos-de-uso.spec.md, sección 5 (Dominio: utilidades y errores)

describe("AppError", () => {
  it("UTL-01 guarda code, message, statusCode y details, y es un Error", () => {
    const error = new AppError("MI_CODIGO", "Mensaje", 409, [{ field: "x" }]);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.code).toBe("MI_CODIGO");
    expect(error.message).toBe("Mensaje");
    expect(error.statusCode).toBe(409);
    expect(error.details).toEqual([{ field: "x" }]);
  });

  it("UTL-01 caso margen: el status por defecto es 400 y details es undefined", () => {
    const error = new AppError("X", "y");
    expect(error.statusCode).toBe(400);
    expect(error.details).toBeUndefined();
  });
});

describe("ordenar", () => {
  const items = [{ n: "Beto" }, { n: "Ana" }, { n: "Carla" }];

  it("UTL-02 sin sort deja el orden original", () => {
    expect(ordenar(items, undefined)).toEqual(items);
  });

  it("UTL-03 ascendente (campo) y descendente (-campo)", () => {
    expect(ordenar(items, "n").map((i) => i.n)).toEqual(["Ana", "Beto", "Carla"]);
    expect(ordenar(items, "-n").map((i) => i.n)).toEqual(["Carla", "Beto", "Ana"]);
  });

  it("UTL-04 no modifica el array original", () => {
    ordenar(items, "n");
    expect(items.map((i) => i.n)).toEqual(["Beto", "Ana", "Carla"]);
  });

  it("UTL-04 usa el orden del español: una tilde no manda la palabra al final", () => {
    const apellidos = [{ n: "Zeta" }, { n: "Álvarez" }, { n: "Bruno" }];
    expect(ordenar(apellidos, "n").map((i) => i.n)).toEqual(["Álvarez", "Bruno", "Zeta"]);
  });

  it("UTL-03 caso margen: lista vacía", () => {
    expect(ordenar([], "n")).toEqual([]);
  });
});

describe("paginar", () => {
  const numeros = [1, 2, 3, 4, 5];

  it("UTL-05 devuelve la porción de la página", () => {
    expect(paginar(numeros, 1, 2)).toEqual([1, 2]);
    expect(paginar(numeros, 2, 2)).toEqual([3, 4]);
  });

  it("UTL-05 la última página puede tener menos elementos", () => {
    expect(paginar(numeros, 3, 2)).toEqual([5]);
  });

  it("UTL-06 una página fuera de rango devuelve []", () => {
    expect(paginar(numeros, 4, 2)).toEqual([]);
  });

  it("UTL-05 un límite mayor a la cantidad devuelve todo", () => {
    expect(paginar(numeros, 1, 100)).toEqual(numeros);
  });
});

describe("armarPagina", () => {
  it("UTL-07 calcula totalPages redondeando hacia arriba", () => {
    const pagina = armarPagina({ items: ["a"], total: 5 }, 3, 2);
    expect(pagina).toEqual({ data: ["a"], meta: { page: 3, limit: 2, total: 5, totalPages: 3 } });
  });

  it("UTL-07 caso margen: total exacto múltiplo del límite", () => {
    expect(armarPagina({ items: [], total: 4 }, 1, 2).meta.totalPages).toBe(2);
  });

  it("UTL-08 sin resultados totalPages es 0", () => {
    expect(armarPagina({ items: [], total: 0 }, 1, 10).meta.totalPages).toBe(0);
  });
});

describe("ClasesMemoryDao.ajustarCupo", () => {
  it("UTL-09 resta y suma un cupo", async () => {
    const dao = new ClasesMemoryDao();
    expect((await dao.ajustarCupo(2, -1)).cuposDisponibles).toBe(1);
    expect((await dao.ajustarCupo(2, 1)).cuposDisponibles).toBe(2);
  });

  it("UTL-09 devuelve null si el cupo quedaría negativo", async () => {
    const dao = new ClasesMemoryDao();
    await dao.ajustarCupo(2, -1);
    await dao.ajustarCupo(2, -1); // 0 cupos
    expect(await dao.ajustarCupo(2, -1)).toBeNull();
    expect((await dao.getById(2)).cuposDisponibles).toBe(0);
  });

  it("UTL-09 devuelve null si pasaría de cupoMaximo", async () => {
    const dao = new ClasesMemoryDao();
    expect(await dao.ajustarCupo(2, 1)).toBeNull();
    expect((await dao.getById(2)).cuposDisponibles).toBe(2);
  });

  it("UTL-09 devuelve null si la clase no existe", async () => {
    expect(await new ClasesMemoryDao().ajustarCupo(999, -1)).toBeNull();
  });
});

describe("DAO en memoria", () => {
  it("UTL-10 devuelve copias: modificar lo devuelto no cambia el estado interno", async () => {
    const dao = new SociosMemoryDao();
    const socio = await dao.getById(1);
    socio.nombre = "CAMBIADO";
    expect((await dao.getById(1)).nombre).toBe("Lucía");

    const { items } = await dao.getAll({});
    items[0].nombre = "CAMBIADO";
    expect((await dao.getById(1)).nombre).toBe("Lucía");
  });

  it("UTL-10 los datos iniciales que se pasan al constructor también se copian", async () => {
    const inicial = [{ id: 1, nombre: "Original" }];
    const dao = new SociosMemoryDao(inicial);
    inicial[0].nombre = "CAMBIADO";
    expect((await dao.getById(1)).nombre).toBe("Original");
  });

  it("UTL-11 el DAO asigna el id e ignora el que venga en el dato", async () => {
    const dao = new SociosMemoryDao();
    const socio = await dao.save({ id: 500, ...socioValido() });
    expect(socio.id).toBe(4);
  });

  it("UTL-11 los ids no se repiten después de borrar", async () => {
    const dao = new SociosMemoryDao();
    await dao.delete(3); // borra el último
    const socio = await dao.save(socioValido());
    expect(socio.id).toBe(4);
  });

  it("UTL-11 update no permite cambiar el id", async () => {
    const dao = new SociosMemoryDao();
    const socio = await dao.update(1, { id: 99, nombre: "X" });
    expect(socio.id).toBe(1);
    expect(await dao.getById(99)).toBeNull();
  });

  it("UTL-11 caso margen: un DAO vacío empieza en el id 1", async () => {
    const dao = new SociosMemoryDao([]);
    expect((await dao.save(socioValido())).id).toBe(1);
  });
});
