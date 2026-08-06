/**
 * Módulo Parser de mensagens do Teams (com suporte a HTML) e planilhas CSV.
 */

export function uid() {
  return 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
}

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

export function extractDataSingle(raw) {
  if (!raw || !raw.trim()) return null;
  const safeText = cleanHtmlText(raw);
  const cleanRaw = safeText.replace(/\*/g, '');
  const get = (regex) => { const m = cleanRaw.match(regex); return m ? m[1].trim() : ''; };

  let tipo = 'Outro';
  if (/VISTORIA/i.test(cleanRaw)) tipo = 'Vistoria';
  if (/PASSAGEM DE CABO/i.test(cleanRaw)) tipo = 'Passagem de Cabo';
  if (/ATIVA[ÇC][ÃA]O/i.test(cleanRaw)) tipo = 'Ativação';

  let status = 'Confirmada';
  if (/REAGENDAD/i.test(cleanRaw)) status = 'Reagendada';
  else if (/CANCELAD/i.test(cleanRaw)) status = 'Cancelada';
  else if (/N[ÃA]O FOI LIBERAD|SEM LIBERA[ÇC][ÃA]O|EM PROCESSO DE APROVA/i.test(cleanRaw)) status = 'Pendente';

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
  
  // --- Extração de datas (suporte a múltiplas: "13/08 E/OU 14/08") ---
  const dataLineMatch = cleanRaw.match(/(?:PARA|DATA(?: DE ACESSO)?|DIA)\s*:?\s*([\d\/\.\s,EeOoUu]+?\d{1,2}[\/\.]\d{1,2})/i);
  const allDates = [];

  if (dataLineMatch) {
    const segment = dataLineMatch[1];
    const dateTokens = segment.match(/\d{1,2}[\/\.]\d{1,2}/g);
    if (dateTokens) {
      const year = new Date().getFullYear();
      for (const tok of dateTokens) {
        const [d, m] = tok.replace('.', '/').split('/');
        allDates.push(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      }
    }
  }

  let f_data = allDates.length > 0 ? allDates[0] : '';

  let hora = get(/HORA?:?\s*(\d{1,2}[:hH]\d{0,2}(?:\s*(?:[aàAÀ]s|-|e)\s*\d{1,2}[:hH]\d{0,2})?)/i) 
          || get(/(?:^|\s)[aàAÀ]S\s*(\d{1,2}[:hH]\d{0,2}(?:\s*(?:[aàAÀ]s|-|e)\s*\d{1,2}[:hH]\d{0,2})?)/i) 
          || get(/HOR[ÁA]RIO:?\s*(\d{1,2}[:hH]?\d{0,2})/i);
  if (/EM HC|HOR[ÁA]RIO COMERCIAL/i.test(cleanRaw) && !hora) hora = 'Horário Comercial';
  
  if (hora) { hora = hora.replace(/H/gi, ':').replace(/:(?!\d)/g, ':00').toUpperCase(); }

  let contato = get(/CONTATO\s*:?\s*([^\n]+)/i);
  if (!contato) {
    // Busca qualquer telefone no texto: (XX) XXXXX-XXXX, XX XXXXX-XXXX, etc.
    const contatoM = cleanRaw.match(/(\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/);
    if (contatoM) contato = contatoM[1];
  }
  contato = normalizePhone(contato);

  const obsBits = [];
  const osM = cleanRaw.match(/O\.?S\.?\s*(?:AUTORIZADA|APROVADA)?:?\s*([0-9]+)/i);
  if (osM) obsBits.push('OS: ' + osM[1]);
  else if (/SEM NECESSIDADE DE OS/i.test(cleanRaw)) obsBits.push('Sem necessidade de OS');
  
  const empM = cleanRaw.match(/EMPREITEIRA\s*(?:DIRECIONADA)?:?\s*([^\n]+)/i);
  if (empM) obsBits.push('Empreiteira: ' + empM[1].trim());
  
  const tecM = cleanRaw.match(/T[ÉE]CNICO(?:\s*DA\s*TERJ)?:?\s*([^\n,]+)/i);
  if (tecM) obsBits.push('Técnico: ' + tecM[1].trim());

  return { tipo, status, data: f_data, allDates, hora, contrato, cliente, endereco, acompanhante, contato, obs: obsBits.join('\n') };
}

export function extractData(raw) {
  if (!raw || !raw.trim()) return [];
  const safeRawText = cleanHtmlText(raw);
  const entries = [];
  let current = null;
  let currentTipo = 'Outro';
  
  const lines = safeRawText.split('\n');
  for (let line of lines) {
    const cleanLine = line.trim().replace(/\*/g, '');
    if (!cleanLine) continue;
    
    if (cleanLine.match(/PASSAGEM DE CABO/i)) currentTipo = 'Passagem de Cabo';
    if (cleanLine.match(/VISTORIAS?/i)) currentTipo = 'Vistoria';
    if (cleanLine.match(/ATIVA[ÇC][ÃA]O/i)) currentTipo = 'Ativação';
    
    const dataMatch = cleanLine.match(/📅\s*(\d{2})\/(\d{2})\/(\d{4})/)
                   || cleanLine.match(/(\d{2})\/(\d{2})\/(\d{4})/);
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
        if (st.match(/Reagendad/i)) current.status = 'Reagendada';
        else if (st.match(/Cancelad/i)) current.status = 'Cancelada';
        else if (st.match(/Confirmad/i)) current.status = 'Confirmada';
        else current.status = 'Pendente';
      }
      else if (cleanLine.match(/^Contrato:\s*(\d+)/i)) current.contrato = cleanLine.match(/^Contrato:\s*(\d+)/i)[1];
      else if (cleanLine.match(/^Cliente:\s*(.+)/i)) current.cliente = cleanLine.match(/^Cliente:\s*(.+)/i)[1];
      else if (cleanLine.match(/^Endere[çc]o:\s*(.+)/i)) current.endereco = cleanLine.match(/^Endere[çc]o:\s*(.+)/i)[1];
      else if (cleanLine.match(/^Acompanhamento.*?:\s*(.+)/i)) {
        const ac = cleanLine.match(/^Acompanhamento.*?:\s*(.+)/i)[1];
        const fone = ac.match(/(\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/);
        if (fone) {
          current.contato = normalizePhone(fone[1]);
          current.acompanhante = ac.replace(fone[0], '').replace(/[\(\)\-|]/g, '').trim();
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
     if (single && (single.contrato || single.cliente)) {
       // Se há múltiplas datas (ex: "13/08 E/OU 14/08"), cria uma entrada por data
       if (single.allDates && single.allDates.length > 1) {
         for (const dt of single.allDates) {
           entries.push({ ...single, data: dt });
         }
       } else {
         entries.push(single);
       }
     }
  }
  
  entries.forEach(e => {
    if (Array.isArray(e.obs)) e.obs = e.obs.join('\n');
    delete e.allDates; // propriedade interna, não precisa ir para o card
  });
  
  return entries;
}
