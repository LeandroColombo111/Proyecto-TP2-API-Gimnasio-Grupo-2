import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

// Días válidos (la misma lista que valida schemas/claseSchema.js; la capa dao no importa de schemas)
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

class ClaseModel extends Model {}

ClaseModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    instructor: { type: DataTypes.STRING, allowNull: false },
    dia: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [DIAS] },
    },
    horario: { type: DataTypes.STRING, allowNull: false }, // "HH:MM"
    cupoMaximo: { type: DataTypes.INTEGER, allowNull: false },
    cuposDisponibles: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: "Clase",
    tableName: "clases",
    timestamps: false,
  },
);

export default ClaseModel;
