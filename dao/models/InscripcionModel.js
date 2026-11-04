import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

class InscripcionModel extends Model {}

InscripcionModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // socioId y claseId son las claves foráneas; las asociaciones están en dao/models/index.js
    socioId: { type: DataTypes.INTEGER, allowNull: false },
    claseId: { type: DataTypes.INTEGER, allowNull: false },
    fechaInscripcion: { type: DataTypes.DATE, allowNull: false },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "activa",
      validate: { isIn: [["activa", "cancelada"]] },
    },
  },
  {
    sequelize,
    modelName: "Inscripcion",
    tableName: "inscripciones",
    timestamps: false,
  },
);

export default InscripcionModel;
