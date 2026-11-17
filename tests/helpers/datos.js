// Datos de prueba válidos. Cada helper acepta "cambios" para pisar solo los campos que importan en el test.

function socioValido(cambios = {}) {
  return {
    nombre: "Ana",
    apellido: "López",
    email: "ana.lopez@mail.com",
    dni: "40111222",
    activo: true,
    ...cambios,
  };
}

function claseValida(cambios = {}) {
  return {
    nombre: "Pilates",
    instructor: "Marta Ruiz",
    dia: "martes",
    horario: "10:00",
    cupoMaximo: 5,
    ...cambios,
  };
}

// Ids de los datos de ejemplo de los DAO en memoria (ver CLAUDE.md)
const SOCIO_LUCIA = 1;
const SOCIO_MARTIN = 2;
const SOCIO_INACTIVO = 3;
const CLASE_FUNCIONAL = 1;
const CLASE_SPINNING = 2; // cupo 2 a propósito
const CLASE_YOGA = 3;

export { socioValido, claseValida, SOCIO_LUCIA, SOCIO_MARTIN, SOCIO_INACTIVO, CLASE_FUNCIONAL, CLASE_SPINNING, CLASE_YOGA };
