import { sequelize } from "../../connection/index.js";
import SocioModel from "./SocioModel.js";
import ClaseModel from "./ClaseModel.js";
import InscripcionModel from "./InscripcionModel.js";
import UsuarioModel from "./UsuarioModel.js"; // sin asociaciones: solo se usa para el login

// -----------------------------------------------------------------------------
// ASOCIACIONES (se definen todas acá, en un solo lugar)
// -----------------------------------------------------------------------------
// constraints: false -> no se crean claves foráneas en la base. Así se puede borrar un socio o una clase que
// solo tiene inscripciones canceladas y la inscripción queda como historial (igual que en el DAO en memoria).

// Socio 1 a N Inscripción
// hasMany: un socio tiene muchas inscripciones (se usa con el alias "inscripciones").
SocioModel.hasMany(InscripcionModel, { foreignKey: "socioId", as: "inscripciones", constraints: false });
// belongsTo: cada inscripción pertenece a un socio. Agrega la columna socioId y permite include con el alias "socio".
InscripcionModel.belongsTo(SocioModel, { foreignKey: "socioId", as: "socio", constraints: false });

// Clase 1 a N Inscripción
ClaseModel.hasMany(InscripcionModel, { foreignKey: "claseId", as: "inscripciones", constraints: false });
InscripcionModel.belongsTo(ClaseModel, { foreignKey: "claseId", as: "clase", constraints: false });

// Socio N a N Clase, a través de la tabla intermedia Inscripción.
// belongsToMany no crea una tabla nueva: usa "inscripciones" como tabla intermedia y permite pedir
// directamente las clases de un socio (alias "clases") o los socios de una clase (alias "socios").
// through.unique: false -> sin esto Sequelize crea una restricción única (socioId, claseId) en la tabla
// intermedia y un socio no podría volver a inscribirse en una clase después de cancelar.
SocioModel.belongsToMany(ClaseModel, {
  through: { model: InscripcionModel, unique: false },
  foreignKey: "socioId",
  otherKey: "claseId",
  as: "clases",
  constraints: false,
});
ClaseModel.belongsToMany(SocioModel, {
  through: { model: InscripcionModel, unique: false },
  foreignKey: "claseId",
  otherKey: "socioId",
  as: "socios",
  constraints: false,
});

// Crea las tablas si no existen. Hay tres DAO y cada uno llama a init(), pero la sincronización tiene que
// hacerse una sola vez: se guarda la promesa y todos los llamados reutilizan la misma.
let sincronizacion = null;
function sincronizar() {
  if (!sincronizacion) {
    sincronizacion = sequelize.sync();
  }
  return sincronizacion;
}

export { sequelize, sincronizar, SocioModel, ClaseModel, InscripcionModel, UsuarioModel };
