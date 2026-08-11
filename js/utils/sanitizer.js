/**
 * Utilitário de sanitização para evitar ataques de XSS no DOM.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Filtra manutenções, separando os registros válidos dos que devem ser deletados 
 * (protocolos inválidos ou duplicados).
 * @param {Array<Object>} manutencoes - Array original de manutenções.
 * @returns {{validos: Array<Object>, paraDeletar: Array<string>}}
 */
export function sanitizeManutencoes(manutencoes) {
  const vistos = new Set();
  const paraDeletar = [];
  const validos = [];

  manutencoes.forEach(m => {
    if (m.protocolo) {
      const p = String(m.protocolo).trim();
      
      // Regra de Negócio: Protocolos válidos devem ter no mínimo 6 dígitos numéricos ou ser um Incidente (TAS / INC)
      if (!/^\d{6,}$/.test(p) && !/^TAS[A-Za-z0-9]+\s*\/\s*INC[A-Za-z0-9]+/i.test(p)) {
        paraDeletar.push(m.id);
        return;
      }
      
      // Regra de Negócio: Impede duplicidade de protocolo na base local
      if (vistos.has(p)) {
        paraDeletar.push(m.id);
        return;
      } else {
        vistos.add(p);
      }
    }
    validos.push(m);
  });

  return { validos, paraDeletar };
}
