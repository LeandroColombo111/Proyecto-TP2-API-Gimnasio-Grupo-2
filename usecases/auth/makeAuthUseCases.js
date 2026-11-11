import login from "./login.js";
import crearAdminInicial from "./crearAdminInicial.js";

// Factory de casos de uso de autenticación: recibe las dependencias y se las inyecta a cada caso de uso.
function makeAuthUseCases({ usuariosDao, passwordService, tokenService }) {
  return {
    login: (credenciales) => login(credenciales, { usuariosDao, passwordService, tokenService }),
    crearAdminInicial: (datos) => crearAdminInicial(datos, { usuariosDao, passwordService }),
  };
}

export default makeAuthUseCases;
