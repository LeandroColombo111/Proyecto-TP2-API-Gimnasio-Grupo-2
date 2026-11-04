// Compara los resultados de scripts/paridad.js de dos corridas (memory vs sequelize) y muestra las diferencias.
//
// Uso: node scripts/comparar.js <resultadoA.json> <resultadoB.json>
import { readFile } from "node:fs/promises";

const [archivoA, archivoB] = process.argv.slice(2);
if (!archivoA || !archivoB) {
  console.error("Uso: node scripts/comparar.js <resultadoA.json> <resultadoB.json>");
  process.exit(1);
}

const a = JSON.parse(await readFile(archivoA, "utf8"));
const b = JSON.parse(await readFile(archivoB, "utf8"));

// Convierte a texto con las claves ordenadas: el orden de las claves de un JSON no es una diferencia real
function canonico(valor) {
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.keys(valor).sort().map((clave) => [clave, canonico(valor[clave])]));
  }
  return valor;
}

let diferencias = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  const pasoA = a[i];
  const pasoB = b[i];

  if (JSON.stringify(canonico(pasoA)) !== JSON.stringify(canonico(pasoB))) {
    diferencias += 1;
    console.log(`\nDIFERENCIA en "${pasoA?.nombre ?? pasoB?.nombre}" (${pasoA?.pedido ?? pasoB?.pedido})`);
    console.log(`  ${archivoA}: ${pasoA?.status} ${JSON.stringify(pasoA?.body)}`);
    console.log(`  ${archivoB}: ${pasoB?.status} ${JSON.stringify(pasoB?.body)}`);
  }
}

if (diferencias === 0) {
  console.log(`Sin diferencias: ${a.length} pedidos con la misma respuesta en los dos modos.`);
} else {
  console.log(`\n${diferencias} diferencia(s) de ${Math.max(a.length, b.length)} pedidos.`);
  process.exit(1);
}
