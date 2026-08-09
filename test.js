
const text = `Simetra 2.0: Chamado
Nome Cliente: 24614296000107 - THINK DIGITAL LTDA Reincidência: 1 NOS ÚLTIMOS 30 DIAS Nro. Contrato: 1058366 ( ATIVO )
Atendente: WESLEY FREITAS MONTEIRO DA SILVA Registrado Em: 05/08/2026 07:22 Registrado Por: PORTAL DO CLIENTE Duração de: 4 DIA(S), 09 HORA(S) E 43 MINUTO(S)

Dados Principais do Atendimento
Protocolo: 260805782 Razão Social: THINK DIGITAL LTDA Contato (Nome): KAUA Telefone 1: (11) 97382-079 Tel. 2:
Status: EM ATENDIMENTO Origem Prot.: PORTAL Nro. Contrato: 1058366 End. do Serviço: RUA ASSUNCAO, 286 BOTAFOGO - RIO DE JANEIRO - RJ CEP: 22251030

Área Responsável de Atendimento do Chamado
Motivo Abertura: Selecione Área: OPERAÇÕES
Sub - Área: MANUTENÇÃO RJ-ES-BA-PR Atividade: 1 - DESPACHO PENDENTE

Detalhes do Chamado
Descrição: BOM DIA, TUDO BEM?
ESTAMOS COM O LINK OFFLINE NA LOCALIDADE REDE AMERICAS - SAMARITANO BOTAFOGO - AUDITORIO. PODERIAM VERIFICAR?
IP:187.108.46.55
ENDEREÇO: R. ASSUNCAO, 275-283 - BOTAFOGO, RIO DE JANEIRO - RJ, 22251-030

Última Interação: DATA / HORA: CHAMADO DELEGADO
08/08/2026 09:29 DE: CEC > CORPORATIVO > ATENDIMENTO
PARA: OPERAÇÕES > MANUTENÇÃO RJ-ES-BA-PR > 1 - DESPACHO PENDENTE
MOTIVO: PREZADOS

Procedimentos / checklist de atividades
EMPREITEIRA PARA OS: REPARO NO LOCAL
Atividade Realizada - Fila: SIMASTEL SERVICOS DE
AGENDAMENTO FEITO PARA
Atividade Pendente
MATERIAIS UTILIZADOS
Consulta produtos utilizado pelo técnico
CONSULTAR LOCALIZAÇÃO DE INSTALAÇÃO
Consulta e atualiza lat/long`;

const cleanText = text.replace(/\s+/g, " ");

const extract = (regex) => {
  const match = cleanText.match(regex);
  return match ? match[1].trim() : "";
};

const protocolo = extract(/Protocolo[:\s]+([A-Z0-9-]+)/i);
const contrato = extract(/Contrato[:\s]+(\d+)/i);
let cliente = extract(/(?:Razão Social|Nome Cliente)[:\s]+(.*?)(?=\s+Contato|\s+Telefone|\s+Nro|\s+End|\s+Status|$)/i);
if (cliente) {
    if (cliente.includes("-")) cliente = cliente.substring(cliente.indexOf("-") + 1).trim();
    cliente = cliente.replace(/lacre\]\s*\|\s*NOS ULTIMOS 30 DIAS/ig, "").trim();
}
let contato = extract(/Contato.*?(?:Nome)?[:\s]+(.*?)(?=\s+Telefone|\s+Nro|\s+End|$)/i);
if (contato) {
    contato = contato.replace(/\(Nome\):?\s*\|?/ig, "").replace(/^[\s\|\[\]]+/, "").trim();
}
let endereco = extract(/End(?:\.|ere[cç]o)?\s*(?:do\s*Servi[cç]o)?[:\s]+(.*?)(?=\s+Área|\s+Descri[cç]ão|\s+Procedimentos|$)/i);
if (endereco) {
    endereco = endereco.replace(/^[\s\|\[\]]+/, "").replace(/\s*-?\s*CEP[:\s]*\d{5}-?\d{3}/ig, "").trim();
}
let telefones = "";
const telMatch = cleanText.match(/(?:Telefones?|Tel\.?)\s*[12]?[:\s]+(.*?(?=Endere[cç]o|End\.|End |$))/i);
if (telMatch && telMatch[1]) {
    let rawTels = telMatch[1];
    rawTels = rawTels.split(/\b(?:Status|Origem|Nro\.|Nro|Contrato)\b/i)[0];
    rawTels = rawTels.replace(/Tel\.?\s*[123]?[:\s]+/ig, " / ");
    rawTels = rawTels.replace(/\s*\/\s*$/, "").trim();
    rawTels = rawTels.replace(/[\s\|\-\.,=]+$/, "").trim();
    if (rawTels) telefones = rawTels;
}
let empreiteira = extract(/FILA.*?((?:VERO|SIMASTEL).*?)(?=\s+Oo\s+|\s+AGENDAMENTO|\s+Atividade|\s+MATERIAIS|\s+Contato|$)/i);
if (empreiteira) {
    const empUpper = empreiteira.toUpperCase();
    if (empUpper.includes("SIMASTEL")) {
      empreiteira = "SIMASTEL SERVIÇOS";
    } else if (empUpper.includes("VERO")) {
      const veroMatch = empUpper.match(/VERO\s+[A-Z]+/);
      empreiteira = veroMatch ? veroMatch[0] : "VERO";
    }
}
const registradoEm = extract(/Registrado Em[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
const tipo = extract(/TIPO DE RECLAMA[CÇ][ÃA]O[:\s]+(.*?)(?=\s+OBSERVA[CÇ][ÃA]O|\s*$)/i);
const obs = extract(/OBSERVA[CÇ][ÃA]O(?: DO DESPACHO)?[:\s]+(.*?)(?=\s*$)/i);
const descricao = extract(/Descri[cç][ãa]o[:\s]+(.*?)(?=\s+Última|\s+Procedimentos|\s+EMPREITEIRA|$)/i);

console.log("Protocolo:", protocolo);
console.log("Contrato:", contrato);
console.log("Cliente:", cliente);
console.log("Contato:", contato);
console.log("Endereco:", endereco);
console.log("Telefones:", telefones);
console.log("Empreiteira:", empreiteira);
console.log("Registrado Em:", registradoEm);
console.log("Tipo:", tipo);
console.log("Obs:", obs);
console.log("Descricao:", descricao);
