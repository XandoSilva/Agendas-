import { extractData } from '../js/services/parser.js';
import fs from 'fs';

const raw = fs.readFileSync('tests/huge_log.txt', 'utf8');
const result = extractData(raw);

console.log(`Parsed ${result.length} items`);
result.forEach((r, i) => {
  console.log(`[${i}] Contrato: ${r.contrato} | Data: ${r.data} | Hora: ${r.hora} | Cliente: ${r.cliente}`);
});
