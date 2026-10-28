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

    if (target === "query") {
      // En Express 5 req.query es un getter que se recalcula en cada acceso: asignarle claves
      // se pierde y reasignarlo directamente no se puede. Se lo redefine como propiedad propia
      // para que el resto de la cadena reciba los valores ya convertidos (números, booleanos, defaults).
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true });
    } else if (target === "params") {
      Object.assign(req.params, result.data);
    } else {
      req.body = result.data;
    }
    next();
  };
}

export const validateQuery = (schema) => validate(schema, "query");
export const validateParams = (schema) => validate(schema, "params");
export default validate;
