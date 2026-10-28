import { z } from "zod";

export const createInscripcionSchema = z.object({
  socioId: z.number("El socioId debe ser un número").int().positive(),
  claseId: z.number("El claseId debe ser un número").int().positive(),
});

export const inscripcionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Filtros opcionales de GET /inscripciones. En la query todo llega como string, por eso coerce.
export const queryInscripcionesSchema = z.object({
  socioId: z.coerce.number().int().positive().optional(),
  claseId: z.coerce.number().int().positive().optional(),
  estado: z.enum(["activa", "cancelada"]).optional(),
});
