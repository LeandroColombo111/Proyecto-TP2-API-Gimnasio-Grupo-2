import { expect } from "vitest";
import AppError from "../../errors/AppError.js";

// Verifica que la promesa falle con un AppError con ese code y ese statusCode.
// Si no falla, o falla con otro error, el test falla.
async function esperarAppError(promesa, code, statusCode) {
  const error = await promesa.then(
    () => null,
    (e) => e,
  );
  expect(error, `se esperaba un AppError ${code}, pero no hubo error`).not.toBeNull();
  expect(error).toBeInstanceOf(AppError);
  expect(error.code).toBe(code);
  expect(error.statusCode).toBe(statusCode);
  return error;
}

export { esperarAppError };
