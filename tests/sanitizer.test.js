import { describe, it, expect } from 'vitest';
import { sanitizeManutencoes, escapeHTML } from '../js/utils/sanitizer.js';

describe('Sanitizer Utilities', () => {
  it('deve escapar tags HTML para prevenir XSS', () => {
    const raw = '<script>alert("xss")</script>';
    const safe = escapeHTML(raw);
    expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  describe('sanitizeManutencoes', () => {
    it('deve remover protocolos inválidos (não-numéricos ou < 6 dígitos)', () => {
      const chamados = [
        { id: '1', protocolo: '12345' }, // 5 dígitos, inválido
        { id: '2', protocolo: '123456' }, // 6 dígitos, válido
        { id: '3', protocolo: 'TESTE' } // Letras, inválido
      ];
      
      const { validos, paraDeletar } = sanitizeManutencoes(chamados);
      expect(validos).toHaveLength(1);
      expect(validos[0].id).toBe('2');
      expect(paraDeletar).toEqual(['1', '3']);
    });

    it('deve remover duplicatas mantendo apenas o primeiro registro', () => {
      const chamados = [
        { id: '1', protocolo: '987654' },
        { id: '2', protocolo: '987654' }, // Duplicata
        { id: '3', protocolo: '111111' }
      ];
      
      const { validos, paraDeletar } = sanitizeManutencoes(chamados);
      expect(validos).toHaveLength(2);
      expect(validos[0].id).toBe('1');
      expect(validos[1].id).toBe('3');
      expect(paraDeletar).toEqual(['2']);
    });
  });
});
