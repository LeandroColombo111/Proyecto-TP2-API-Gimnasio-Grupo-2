import { z } from "zod";

// Campos comunes de Socio. Se definen una vez y se reutilizan en alta y modificación.
const camposSocio = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellido: z.string().trim().min(1, "El apellido es obligatorio"),
  email: z.email("El email no es válido").toLowerCase(),
  dni: z.string().regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos"),
  telefono: z.string().trim().min(1, "El teléfono no puede estar vacío"),
  activo: z.boolean(),
};

// Alta: telefono es opcional y activo vale true si no se envía
export const createSocioSchema = z.object({
  ...camposSocio,
  telefono: camposSocio.telefono.optional(),
  activo: camposSocio.activo.default(true),
});

// Modificación: todos los campos son opcionales, pero tiene que venir al menos uno.
// - .strict() rechaza claves desconocidas (ej: "edad") en lugar de ignorarlas en silencio.
// - .refine() es una regla propia sobre el objeto completo: acá, que no esté vacío.
// activo no lleva default acá: si no viene, no se toca el valor guardado.
export const updateSocioSchema = z
  .object(camposSocio)
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debe enviar al menos un campo para modificar",
  });

export const socioIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
