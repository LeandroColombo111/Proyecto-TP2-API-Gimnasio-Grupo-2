import AppError from "../errors/AppError.js";

// Valida req.body, req.query o req.params con un schema de Zod.
// Si falla, corta con VALIDATION_ERROR (400); si pasa, deja los datos ya parseados (coerce, defaults).
function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      }));
      return next(new AppError("VALIDATION_ERROR", `Datos de ${target} inválidos`, 400, details));
    }

    if (target === "body") {
      req.body = result.data;
    } else {
      // En Express 5 req.query es solo lectura (getter): no se puede reasignar, se mutan sus claves
      Object.assign(req[target], result.data);
    }
    next();
  };
}

export const validateQuery = (schema) => validate(schema, "query");
export const validateParams = (schema) => validate(schema, "params");
export default validate;
