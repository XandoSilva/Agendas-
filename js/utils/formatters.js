/**
 * Módulo de formatadores de data, links de mapas e WhatsApp.
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

export function buildWhatsAppUrl(phone) {
  if (!phone || typeof phone !== 'string') return '#';
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return '#';
  const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}`;
}
