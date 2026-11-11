import bcrypt from "bcryptjs";

// Cantidad de rondas de bcrypt: más rondas = más lento de calcular (y de atacar)
const RONDAS = 10;

// Servicio de contraseñas. Los casos de uso lo reciben por parámetro y no importan bcrypt directamente.
// La contraseña se HASHEA (no se encripta): el hash es de una sola vía, no se puede volver a la contraseña original.
function createPasswordService() {
  return {
    // Devuelve el hash que se guarda en la base (incluye la "sal", por eso dos hashes de la misma contraseña difieren)
    hashear: (password) => bcrypt.hash(password, RONDAS),
    // Compara una contraseña con un hash guardado: devuelve true o false
    comparar: (password, hash) => bcrypt.compare(password, hash),
  };
}

export default createPasswordService;
