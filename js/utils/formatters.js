/**
 * Módulo de formatadores de data, links de mapas e WhatsApp com copywriting e máscaras.
 */

export function fmtDate(iso) {
  if (!iso) return { label: 'Sem data', dow: '' };
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return { label: iso, dow: '' };
  const dow = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { label, dow };
}

export function buildMapsUrl(address) {
  if (!address || typeof address !== 'string' || !address.trim()) return '#';
  const cleanAddress = address.trim();
  if (/^javascript:/i.test(cleanAddress)) return '#';
  const query = encodeURIComponent(cleanAddress);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildWhatsAppUrl(phone, entry = null) {
  if (!phone || typeof phone !== 'string') return '#';
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return '#';
  const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  
  if (entry) {
    const cliente = entry.cliente || 'Cliente';
    const tipo = entry.tipo || 'atendimento';
    const contrato = entry.contrato ? `Contrato ${entry.contrato}` : '';
    const { label: dataFmt } = fmtDate(entry.data);
    const hora = entry.hora || 'Horário Comercial';
    
    const textMsg = `Olá ${cliente}! Sou o técnico responsável pela sua ${tipo} ${contrato}. Nosso atendimento está agendado para ${dataFmt} às ${hora}. Confirma a presença no local?`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(textMsg)}`;
  }
  
  return `https://wa.me/${fullPhone}`;
}

export function formatPhoneMask(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
