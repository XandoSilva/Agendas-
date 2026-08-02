/**
 * Test Runner leve em Node.js para validação da suíte de testes unitários.
 */
import { escapeHTML } from '../js/utils/sanitizer.js';
import { buildMapsUrl, buildWhatsAppUrl, fmtDate } from '../js/utils/formatters.js';
import { extractData, parseCSV } from '../js/services/parser.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('🧪 Executando Suíte de Testes Unitários (ALE_TESTES)...\n');

// 1. Testes de Sanitização (XSS)
console.log('--- Testes de Sanitização (sanitizer.js) ---');
assert(escapeHTML('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'Codifica tags de script');
assert(escapeHTML('João & Maria') === 'João &amp; Maria', 'Codifica e-comercial');
assert(escapeHTML(null) === '', 'Trata valores nulos com segurança');
assert(escapeHTML(undefined) === '', 'Trata valores indefinidos com segurança');

// 2. Testes de Formatadores (formatters.js)
console.log('\n--- Testes de Formatadores (formatters.js) ---');
assert(buildMapsUrl('Rua Exemplo, 123').includes('google.com/maps/search'), 'Gera URL de mapas válida');
assert(buildMapsUrl('javascript:alert(1)') === '#', 'Bloqueia pseudo-protocolo javascript: em mapas');
assert(buildWhatsAppUrl('11999998888') === 'https://wa.me/5511999998888', 'Formata telefone BR para WhatsApp');
assert(fmtDate('2026-08-02').label === '02/08/2026', 'Formata data ISO para pt-BR');

// 3. Testes do Parser de Mensagens (parser.js)
console.log('\n--- Testes do Parser (parser.js) ---');
const sampleMsg = `
VISTORIA - CONTRATO: 123456
CLIENTE: Empresa Teste LTDA
ENDEREÇO: Av. Paulista, 1000
DATA: 15/08
HORA: 14:00
QUEM ACOMPANHARÁ: Carlos (11 98888-7777)
`;
const parsed = extractData(sampleMsg);
assert(parsed.length === 1, 'Extrai 1 agendamento da mensagem');
assert(parsed[0].tipo === 'Vistoria', 'Identifica tipo Vistoria');
assert(parsed[0].contrato === '123456', 'Extrai número do contrato');
assert(parsed[0].cliente === 'Empresa Teste LTDA', 'Extrai nome do cliente');
assert(Boolean(parsed[0].contato), 'Extrai telefone de contato');

const csvData = 'id,texto\n1,"CONTRATO: 999\nCLIENTE: Teste CSV"';
const csvRows = parseCSV(csvData);
assert(csvRows.length === 2, 'Parseia CSV com quebra de linha corretamente');

console.log(`\n========================================`);
console.log(`Resultados dos Testes: ${passed} passaram, ${failed} falharam.`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
