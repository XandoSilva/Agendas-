// Teste rápido do parser com a mensagem do usuário
import { extractData } from '../js/services/parser.js';

const testMsg = `ATIVIDADE CONFIRMADA - TÉRMINO DE ATIVIDADE (FUSÃO)✅
DATA DE ACESSO: 13/08  E/OU  14/08  AS DAS 10:00HRs ÁS 16:00
CONTRATO:   2908218
CLIENTE:   SABORES LUDICOS FUSION FOOD LTDA
ENDEREÇO:  AVENIDA DAS AMERICAS, 15500 LOJ 0154 0155 / AMERICAS SHOPPING RECREIO DOS BAND RECREIO DOS BANDEIRANTES - RIO DE JANEIRO - RJ CEP: 22790702
QUEM ACOMPANHARÁ A EQUIPE SERÁ:  EDUARDO TEL : 21 99561-6118 E REPRESENTANTE DO  SHOPPING ALCIR TEL: (21) 2442-9950 | Cel. (21) 98114-3279`;

const result = extractData(testMsg);
console.log('Total de entradas:', result.length);
result.forEach((e, i) => {
  console.log(`\nEntry ${i + 1}:`);
  console.log('  Data:', e.data);
  console.log('  Contrato:', e.contrato);
  console.log('  Cliente:', e.cliente);
});

// Teste da regex isolada
const cleanRaw = testMsg.replace(/\*/g, '');
const regexOld = /(?:PARA|DATA(?: DE ACESSO)?|DIA)\s*:?\s*([\d\/\.\s,EeOoUu]+?\d{1,2}[\/\.]\d{1,2})/i;
const regexNew = /(?:PARA|DATA(?: DE ACESSO)?|DIA)\s*:?\s*([^\n]*\d{1,2}[\/\.]\d{1,2})/i;

const matchOld = cleanRaw.match(regexOld);
const matchNew = cleanRaw.match(regexNew);

console.log('\n--- Regex Test ---');
console.log('Old regex capture:', matchOld ? matchOld[1] : 'NO MATCH');
console.log('New regex capture:', matchNew ? matchNew[1] : 'NO MATCH');

if (matchNew) {
  const dateTokens = matchNew[1].match(/\d{1,2}[\/\.]\d{1,2}/g);
  console.log('Date tokens found:', dateTokens);
}
