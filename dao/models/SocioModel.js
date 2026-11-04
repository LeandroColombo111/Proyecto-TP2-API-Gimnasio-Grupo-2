import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

class SocioModel extends Model {}

SocioModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // restricción a nivel base de datos
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { is: /^\d{7,8}$/ },
    },
    telefono: { type: DataTypes.STRING, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Socio",
    tableName: "socios",
    timestamps: false, // no se guardan createdAt / updatedAt
  },
);

export default SocioModel;
