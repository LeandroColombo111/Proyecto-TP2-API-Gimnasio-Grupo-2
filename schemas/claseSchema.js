import { z } from "zod";

export const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Campos comunes de Clase. cuposDisponibles NO está: lo calcula el sistema.
const camposClase = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  instructor: z.string().trim().min(1, "El instructor es obligatorio"),
  dia: z.enum(DIAS, { error: `El día debe ser uno de: ${DIAS.join(", ")}` }),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "El horario debe tener formato HH:MM (00:00 a 23:59)"),
  cupoMaximo: z.number("El cupo máximo debe ser un número").int("El cupo máximo debe ser entero").positive("El cupo máximo debe ser mayor a 0"),
};

export const createClaseSchema = z.object(camposClase);

// Todos opcionales pero al menos uno; .strict() rechaza claves desconocidas (ej: cuposDisponibles)
export const updateClaseSchema = z
  .object(camposClase)
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debe enviar al menos un campo para modificar",
  });

export const claseIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
