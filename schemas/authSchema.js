import { z } from "zod";

// Login: el email se pasa a minúsculas, igual que al crear el usuario
export const loginSchema = z.object({
  email: z.email("El email no es válido").toLowerCase(),
  password: z.string("La contraseña es obligatoria").min(1, "La contraseña es obligatoria"),
});
