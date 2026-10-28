import { EventEmitter } from "node:events";

// Bus de eventos: los casos de uso emiten y los listeners reaccionan, sin conocerse entre sí
function createEventBus() {
  return new EventEmitter();
}

export { createEventBus };
