import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection/index.js";

class UsuarioModel extends Model {}

UsuarioModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    // Se guarda el hash de la contraseña, nunca la contraseña
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    rol: { type: DataTypes.STRING, allowNull: false, defaultValue: "admin" },
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios",
    timestamps: false,
  },
);

export default UsuarioModel;
