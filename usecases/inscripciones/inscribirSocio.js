import AppError from "../../errors/AppError.js";
import { CUPO_BAJO_THRESHOLD } from "../../config/config.js";
import { EVENTS } from "../../events/eventNames.js";

// Caso de uso: inscribir un socio a una clase.
// Las reglas se chequean en este orden; la primera que falla corta con su error.
// Los eventos se emiten SOLO si la inscripción se concretó, y después de guardarla:
// el caso de uso no sabe qué hacen los listeners (bienvenida, alertas), solo avisa que pasó algo.
async function inscribirSocio({ socioId, claseId }, { inscripcionesDao, sociosDao, clasesDao, events }) {
  const socio = await sociosDao.getById(socioId);
  if (!socio) {
    throw new AppError("SOCIO_NOT_FOUND", "No existe un socio con ese id", 404);
  }

  const clase = await clasesDao.getById(claseId);
  if (!clase) {
    throw new AppError("CLASE_NOT_FOUND", "No existe una clase con ese id", 404);
  }

  if (!socio.activo) {
    throw new AppError("SOCIO_INACTIVO", "El socio está inactivo y no puede inscribirse", 409);
  }

  if (await inscripcionesDao.findActiva(socioId, claseId)) {
    throw new AppError("YA_INSCRIPTO", "El socio ya está inscripto en esa clase", 409);
  }

  if (clase.cuposDisponibles <= 0) {
    throw new AppError("CLASE_SIN_CUPO", "La clase no tiene cupos disponibles", 409);
  }

  // El DAO crea la inscripción y resta el cupo juntos; devuelve null si el cupo se agotó en el medio
  const inscripcion = await inscripcionesDao.inscribir({ socioId, claseId });
  if (!inscripcion) {
    throw new AppError("CLASE_SIN_CUPO", "La clase no tiene cupos disponibles", 409);
  }

  events.emit(EVENTS.INSCRIPCION_CREADA, {
    inscripcionId: inscripcion.id,
    socio: { id: socio.id, nombre: socio.nombre, email: socio.email },
    clase: { id: clase.id, nombre: clase.nombre, dia: clase.dia, horario: clase.horario },
  });

  // Se vuelve a leer la clase para conocer los cupos que quedaron después de inscribir
  const claseActual = await clasesDao.getById(claseId);
  if (claseActual.cuposDisponibles <= CUPO_BAJO_THRESHOLD) {
    events.emit(EVENTS.CLASE_CUPO_BAJO, {
      claseId: claseActual.id,
      nombre: claseActual.nombre,
      cuposDisponibles: claseActual.cuposDisponibles,
    });
  }

  return inscripcion;
}

export default inscribirSocio;
