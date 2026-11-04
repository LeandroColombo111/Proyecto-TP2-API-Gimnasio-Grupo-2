import sequelize from "./sequelize.js";

// Punto único de acceso a las conexiones. Si algún día hubiera otra (ej: mongoose), se exporta acá.
export { sequelize };
