import { describe, it, expect } from 'vitest';
import { parseManutencaoOCR } from '../js/services/parser.js';

describe('OCR Parser', () => {
  describe('parseManutencaoOCR', () => {
    it('deve extrair dados de Print 2 (Detalhes único)', () => {
      const rawText = `
        Protocolo: 12345678
        Nro. Contrato: 999888
        Nome Cliente: João da Silva
        End. do Serviço: Rua Teste, 123
        Motivo Abertura: Fibra Rompida
      `;

      const result = parseManutencaoOCR(rawText);
      expect(result.type).toBe('SINGLE');
      expect(result.records).toHaveLength(1);
      
      const record = result.records[0];
      expect(record.protocolo).toBe('12345678');
      expect(record.contrato).toBe('999888');
      expect(record.cliente).toBe('João da Silva');
      expect(record.endereco).toBe('Rua Teste, 123');
      expect(record.tipo_reclamacao).toBe('Fibra Rompida');
    });

    it('deve extrair dados de Print 1 (Tabela Bulk)', () => {
      const rawText = `
        Dt Abertura Protocolo Contrato Razão Social
        28/07/2026 21:24:42 260728205 59623 EMPRESA FAKE LTDA RUA A 123 CENTRO
        08/03/2026 08:33:30 260800492 431003 OUTRA EMPRESA ESTRADA B 456
      `;

      const result = parseManutencaoOCR(rawText);
      expect(result.type).toBe('BULK');
      expect(result.records).toHaveLength(2);
      expect(result.records[0].protocolo).toBe('260728205');
      expect(result.records[0].cliente).toBe('EMPRESA FAKE LTDA');
      expect(result.records[0].endereco).toBe('RUA A 123 CENTRO');
    });

    it('deve retornar ERROR se o texto for vazio ou inválido', () => {
      expect(parseManutencaoOCR('').type).toBe('ERROR');
      expect(parseManutencaoOCR('texto aleatorio sem sentido').type).toBe('ERROR');
    });
  });
});
