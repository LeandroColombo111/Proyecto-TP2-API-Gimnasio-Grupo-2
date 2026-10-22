// Registra método, url, status y duración de cada request.
// Se escribe en "finish" porque recién ahí se conoce el status de la respuesta.
function logger(req, res, next) {
  const inicio = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - inicio}ms`);
  });
  next();
}

export default logger;
