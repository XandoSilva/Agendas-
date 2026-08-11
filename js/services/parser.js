/**
 * Módulo Parser de mensagens do Teams (com suporte a HTML) e planilhas CSV.
 */

/**
 * Gera um ID único simples baseado no tempo atual e valores aleatórios.
 * @returns {string} ID único
 */
export function uid() {
  return 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
}

/**
 * Realiza o parse de uma string CSV para um array bidimensional.
 * @param {string} text - O conteúdo CSV bruto.
 * @returns {string[][]} Array contendo as linhas e colunas do CSV.
 */
export function parseCSV(text) {
  let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
  for (l of text) {
    if ('"' === l) {
      if (s && l === p) row[i] += l;
      s = !s;
    } else if (',' === l && s) l = row[++i] = '';
    else if ('\n' === l && s) {
      if ('\r' === p) row[i] = row[i].slice(0, -1);
      row = ret[++r] = [l = '']; i = 0;
    } else row[i] += l;
    p = l;
  }
  return ret;
}

function cleanHtmlText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.slice(0, 50000)
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Normaliza telefone brasileiro para formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return raw.trim(); // se não tem dígitos suficientes, retorna original
  
  // Pega os últimos 10 ou 11 dígitos (DDD + número)
  const phone = digits.length >= 11 ? digits.slice(-11) : digits.slice(-10);
  const ddd = phone.slice(0, 2);
  const number = phone.slice(2);
  
  if (number.length === 9) {
    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  } else if (number.length === 8) {
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }
  return raw.trim();
}

/**
 * Extrai dados massivamente (Print 1 - Tabela)
 */
function extractManutencaoBulk(text) {
  const lines = text.split('\n');
  const records = [];
  const failures = [];
  let totalLines = 0;
  
  const cleanNum = (str) => String(str).replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/[Ss]/g, '5').replace(/[Zz]/g, '2').replace(/[B]/g, '8');

  // Data e Hora + Protocolo marcam o início de uma linha válida. O .*? é não-guloso e lida com qualquer lixo entre as colunas
  const dateAnchor = /^\s*(\d{2}[\/\.]\d{2}[\/\.]\d{4})\s*.*?\s*(\d{2}[:;.]\d{2}[:;.]\d{2})\s*.*?\s*([A-Za-z0-9]{6,15})\s+(.*)$/i;
  
  const combinedLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.match(/^\s*\d{2}[\/\.]\d{2}[\/\.]\d{4}/) || combinedLines.length === 0) {
      combinedLines.push(trimmed);
    } else {
      combinedLines[combinedLines.length - 1] += ' ' + trimmed;
    }
  }

  for (let line of combinedLines) {
    totalLines++;
    const match = line.match(dateAnchor);
    if (!match) {
      if (line.length > 20 && !/Dt Abertura|Protocolo|Contrato/i.test(line)) {
        failures.push(line);
      }
      continue;
    }

    const dataOriginal = match[1];
    const horaOriginal = match[2];
    const protocolo = cleanNum(match[3]).replace(/\D/g, '');
    let resto = match[4].trim();

    if (protocolo.length < 6) {
      failures.push(line);
      continue;
    }

    const [d, m, y] = dataOriginal.replace(/\./g, '/').split('/');
    const dataIso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const horaLimpa = horaOriginal.replace(/[:;.]/g, ':');

    let contrato = '';
    const contratoMatch = resto.match(/^([0-9]{4,15})\s+(.*)$/);
    if (contratoMatch) {
      contrato = contratoMatch[1];
      resto = contratoMatch[2];
    }
    
    let cliente = resto;
    let endereco = '';
    const addressMatch = resto.match(/\s+(RUA|AVENIDA|AV\.|ESTRADA|RODOVIA|PRA[CÇ]A|ALAMEDA|ROD\.|R\.|AV|CONDOMINIO)\s+/i);
    if (addressMatch) {
      cliente = resto.substring(0, addressMatch.index).trim();
      endereco = resto.substring(addressMatch.index).trim();
    }

    records.push({
      protocolo,
      contrato,
      cliente,
      endereco,
      created_at: `${dataIso}T${horaLimpa}-03:00`,
      status: 'Pendente',
      descricao: "Importado via tabela OCR",
    });
  }

  return { type: 'BULK', records, stats: { totalLines, failures } };
}

/**
 * Extrai dados únicos e detalhados (Print 2 - Janela de Detalhes)
 */
function extractManutencaoSingle(text) {
  const cleanText = text.replace(/\s+/g, ' ');
  const extract = (regex) => {
    const match = cleanText.match(regex);
    return match ? match[1].trim() : '';
  };

  let protocolo = extract(/Protocolo[:\s]+([A-Z0-9]+)/i);
  if (protocolo) protocolo = protocolo.replace(/\D/g, '');
  if (!protocolo || protocolo.length < 6) return null;

  let contrato = extract(/(?:Nro\.?\s*Contrato|Contrato)[:\s]+(\d+)/i);
  let cliente = extract(/(?:Nome\s*Cliente|Raz[ãa]o\s*Social)[:\s]+(.*?)(?=\s+(?:Reincid[eê]ncia|Nro\.?\s*Contrato|Contato|Telefone|Tel\.|Status|Origem|End\.|Endere[cç]o|$))/i);
  let endereco = extract(/End(?:\.|ere[cç]o)?\s*(?:do\s*Servi[cç]o)?[:\s]+(.*?)(?=\s+(?:CEP|Área|Motivo|Sub|Atividade|Descri[cç]ão|Procedimentos|$))/i);
  let contato = extract(/Contato.*?(?:Nome)?[:\s]+(.*?)(?=\s+(?:Telefone|Tel\.|Status|Origem|End\.|Endere[cç]o|$))/i);
  
  let tel1 = extract(/(?:Telefone\s*1|Tel\.?\s*1)[:\s]+(.*?)(?=\s+(?:Tel\.\s*2|Status|Origem|End\.|Endere[cç]o|$))/i);
  let tel2 = extract(/(?:Telefone\s*2|Tel\.?\s*2)[:\s]+(.*?)(?=\s+(?:Status|Origem|End\.|Endere[cç]o|$))/i);
  let telefones = [tel1, tel2].filter(Boolean).map(t => normalizePhone(t)).join(' / ');

  let tipo_reclamacao = extract(/Motivo Abertura[:\s]+(.*?)(?=\s+Área|$)/i);
  let tipo_atendimento = extract(/Atividade[:\s]+(.*?)(?=\s+Descri[cç][ãa]o|Detalhes|Procedimentos|Última|$)/i);
  let descricao = extract(/Descri[cç][ãa]o[:\s]+(.*?)(?=\s+Última|\s+Procedimentos|\s+EMPREITEIRA|$)/i);
  let data_hora = extract(/Registrado Em[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
  let empreiteira = extract(/((?:VERO|SIMASTEL).*?)(?=\s+Atividade|\s+Agendamento|$)/i);

  if (cliente) {
    if (cliente.includes('-')) cliente = cliente.substring(cliente.indexOf('-') + 1).trim();
    cliente = cliente.replace(/lacre.*$/ig, '').trim();
  }
  if (contato) contato = contato.replace(/\(Nome\):?\s*\|?/ig, '').trim();
  if (endereco) endereco = endereco.replace(/\s*-?\s*CEP[:\s]*\d{5}-?\d{3}/ig, '').trim();

  let created_at = '';
  if (data_hora) {
    const [dt, hr] = data_hora.split(' ');
    const [d, m, y] = dt.split('/');
    created_at = `${y}-${m}-${d}T${hr}:00-03:00`;
  }

  return {
    type: 'SINGLE',
    records: [{
      protocolo,
      contrato,
      cliente,
      endereco,
      contato,
      telefones,
      tipo_reclamacao,
      tipo_atendimento,
      descricao,
      empreiteira,
      created_at
    }]
  };
}

/**
 * Função principal para identificar o tipo de print e extrair os dados.
 * @param {string} raw - O texto bruto do OCR.
 */
export function parseManutencaoOCR(raw) {
  if (!raw || !raw.trim()) return { type: 'ERROR', records: [], message: 'Texto vazio.' };
  const safeText = cleanHtmlText(raw);

  // Determina se é o Print 2 (detalhes) baseado em palavras chave
  if (/Nome Cliente:|Nro\.? Contrato:|Motivo Abertura:|Atividade:/i.test(safeText)) {
    const single = extractManutencaoSingle(safeText);
    if (single) return single;
  }
  
  // Fallback para Print 1 (Bulk)
  const bulk = extractManutencaoBulk(safeText);
  if (bulk.records.length > 0) return bulk;
  
  return { type: 'ERROR', records: [], message: 'Não foi possível reconhecer chamados válidos no formato esperado (Tabela ou Detalhes).' };
}

/**
 * Funções Legadas da Agenda (Mantidas para compatibilidade com o módulo de Agenda)
 */

export function extractDataSingle(raw){
  if(!raw || !raw.trim()) return null;
  const cleanRaw = raw.replace(/\*/g, '');
  const get = (regex) => { const m = cleanRaw.match(regex); return m ? m[1].trim() : ''; };

  let tipo = 'Outro';
  if(/VISTORIA/i.test(cleanRaw)) tipo = 'Vistoria';
  if(/PASSAGEM DE CABO/i.test(cleanRaw)) tipo = 'Passagem de Cabo';
  if(/ATIVA[ÇC][ÃA]O/i.test(cleanRaw)) tipo = 'Ativação';

  let status = 'Confirmada';
  if(/REAGENDAD/i.test(cleanRaw)) status = 'Reagendada';
  else if(/CANCELAD/i.test(cleanRaw)) status = 'Cancelada';
  else if(/N[ÃA]O FOI LIBERAD|SEM LIBERA[ÇC][ÃA]O|EM PROCESSO DE APROVA/i.test(cleanRaw)) status = 'Pendente';

  let contrato = get(/CONTRATO:?\s*([0-9]+)/i);
  let cliente = get(/CLIENTE:?\s*(.*?)(?=\n|ENDERE[ÇC]O|$)/i);
  let endereco = get(/ENDERE[ÇC]O:?\s*(.*?)(?=\n|QUEM ACOMPANHAR[ÁA]|CONTATO|DATA|T[ÉE]CNICO|$)/i) 
              || get(/EDNEREÇO:?\s*(.*?)(?=\n|QUEM ACOMPANHAR[ÁA]|CONTATO|DATA|T[ÉE]CNICO|$)/i);

  if (!contrato) {
    const altMatch = cleanRaw.match(/(?:PASSAGEM DE CABO|VISTORIA|ATIVAÇÃO).*?\s*-\s*([0-9]+)\s*-\s*(.*?)(?=\n|ENDERE[ÇC]O|$)/i);
    if (altMatch) {
      contrato = altMatch[1].trim();
      cliente = altMatch[2].trim();
    } else {
      const altMatch2 = cleanRaw.match(/(?:\s|^)([0-9]{6,10})[\s\t]+([a-zÀ-ÿ0-9\s]+?)\s*-\s*(.*?)(?=\n|DATA|HORA|QUEM ACOMPANHAR[ÁA]|$)/i);
      if (altMatch2) {
        contrato = altMatch2[1].trim();
        cliente = altMatch2[2].trim();
        if (!endereco) endereco = altMatch2[3].trim();
      }
    }
  }

  let acompanhante = get(/QUEM ACOMPANHAR[ÁA](?:\s+A\s+EQUIPE\s+SER[ÁA])?:?\s*(.*?)(?=\n|T[ÉE]CNICO|CONFORME|OBS|$)/i);
  
  let dataStr = get(/PARA\s+(\d{1,2}[\/\.]\d{1,2})/i)
    || get(/DATA(?: DE ACESSO)?:?\s*(\d{1,2}[\/\.]\d{1,2})/i)
    || get(/DIA\s+(\d{1,2}[\/\.]\d{1,2})/i);
  let f_data = '';
  if(dataStr){
    const [d,m] = dataStr.replace('.','/').split('/');
    const year = new Date().getFullYear();
    f_data = `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  let hora = get(/HORA?:?\s*(\d{1,2}[:hH]\d{0,2}(?:\s*(?:[aàAÀ]s|-|e)\s*\d{1,2}[:hH]\d{0,2})?)/i) 
          || get(/(?:^|\s)[aàAÀ]S\s*(\d{1,2}[:hH]\d{0,2}(?:\s*(?:[aàAÀ]s|-|e)\s*\d{1,2}[:hH]\d{0,2})?)/i) 
          || get(/HOR[ÁA]RIO:?\s*(\d{1,2}[:hH]?\d{0,2})/i);
  if(/EM HC|HOR[ÁA]RIO COMERCIAL/i.test(cleanRaw) && !hora) hora = 'Horário Comercial';
  
  if(hora) { hora = hora.replace(/H/gi,':').replace(/:(?!\d)/g,':00').toUpperCase(); }

  let contato = get(/CONTATO\s*:?\s*([^\n]+)/i);
  const contatoM = cleanRaw.match(/(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4})/);
  if (!contato && contatoM) { contato = contatoM[1]; }

  const obsBits = [];
  const osM = cleanRaw.match(/O\.?S\.?\s*(?:AUTORIZADA|APROVADA)?:?\s*([0-9]+)/i);
  if(osM) obsBits.push('OS: ' + osM[1]);
  else if(/SEM NECESSIDADE DE OS/i.test(cleanRaw)) obsBits.push('Sem necessidade de OS');
  
  const empM = cleanRaw.match(/EMPREITEIRA\s*(?:DIRECIONADA)?:?\s*([^\n]+)/i);
  if(empM) obsBits.push('Empreiteira: ' + empM[1].trim());
  
  const tecM = cleanRaw.match(/T[ÉE]CNICO(?:\s*DA\s*TERJ)?:?\s*([^\n,]+)/i);
  if(tecM) obsBits.push('Técnico: ' + tecM[1].trim());

  return { tipo, status, data: f_data, hora, contrato, cliente, endereco, acompanhante, contato, obs: obsBits.join('\n') };
}

export function extractData(raw) {
  if(!raw || !raw.trim()) return [];
  const entries = [];
  let current = null;
  let currentTipo = 'Outro';
  
  const lines = raw.split('\n');
  for(let line of lines) {
    const cleanLine = line.trim().replace(/\*/g, '');
    if(!cleanLine) continue;
    
    if (cleanLine.match(/PASSAGEM DE CABO/i)) currentTipo = 'Passagem de Cabo';
    if (cleanLine.match(/VISTORIAS?/i)) currentTipo = 'Vistoria';
    if (cleanLine.match(/ATIVA[ÇC][ÃA]O/i)) currentTipo = 'Ativação';
    
    const dataMatch = cleanLine.match(/📅\s*(\d{2})\/(\d{2})\/(\d{4})/);
    if (dataMatch) {
      if (current && (current.contrato || current.cliente)) entries.push(current);
      current = {
        tipo: currentTipo,
        data: `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`,
        hora: '', status: 'Confirmada', contrato: '', cliente: '', endereco: '', acompanhante: '', contato: '', obs: []
      };
      continue;
    }
    
    if (current) {
      if (cleanLine.match(/^Hora:\s*(.+)/i)) current.hora = cleanLine.match(/^Hora:\s*(.+)/i)[1];
      else if (cleanLine.match(/^Status:\s*(.+)/i)) {
        const st = cleanLine.match(/^Status:\s*(.+)/i)[1];
        if(st.match(/Reagendad/i)) current.status = 'Reagendada';
        else if(st.match(/Cancelad/i)) current.status = 'Cancelada';
        else if(st.match(/Confirmad/i)) current.status = 'Confirmada';
        else current.status = 'Pendente';
      }
      else if (cleanLine.match(/^Contrato:\s*(\d+)/i)) current.contrato = cleanLine.match(/^Contrato:\s*(\d+)/i)[1];
      else if (cleanLine.match(/^Cliente:\s*(.+)/i)) current.cliente = cleanLine.match(/^Cliente:\s*(.+)/i)[1];
      else if (cleanLine.match(/^Endere[çc]o:\s*(.+)/i)) current.endereco = cleanLine.match(/^Endere[çc]o:\s*(.+)/i)[1];
      else if (cleanLine.match(/^Acompanhamento.*?:\s*(.+)/i)) {
        const ac = cleanLine.match(/^Acompanhamento.*?:\s*(.+)/i)[1];
        const fone = ac.match(/(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4})/);
        if(fone) {
          current.contato = fone[1];
          current.acompanhante = ac.replace(fone[1], '').replace(/[\(\)\-]/g, '').trim().replace(/\|\s*$/, '').trim();
        } else {
          current.acompanhante = ac;
        }
      }
      else if (cleanLine.match(/^OS(?:\s.*?)?:\s*(.+)/i)) current.obs.push('OS: ' + cleanLine.match(/^OS(?:\s.*?)?:\s*(.+)/i)[1]);
      else if (cleanLine.match(/^Observ.*:\s*(.+)/i)) current.obs.push(cleanLine.match(/^Observ.*:\s*(.+)/i)[1]);
      else if (cleanLine.match(/^T[ée]cnico.*:\s*(.+)/i)) current.obs.push('Técnico: ' + cleanLine.match(/^T[ée]cnico.*:\s*(.+)/i)[1]);
      else if (cleanLine.match(/^Equipe.*:\s*(.+)/i)) current.obs.push('Equipe: ' + cleanLine.match(/^Equipe.*:\s*(.+)/i)[1]);
    }
  }
  if (current && (current.contrato || current.cliente)) entries.push(current);
  
  if (entries.length === 0) {
     const single = extractDataSingle(raw);
     if(single && (single.contrato || single.cliente)) entries.push(single);
  }
  return entries;
}
