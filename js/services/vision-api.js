export class VisionAPI {
  static getApiKey() {
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
    return localStorage.getItem('VERO_GEMINI_KEY') || envKey || '';
  }

  static setApiKey(key) {
    localStorage.setItem('VERO_GEMINI_KEY', key.trim());
  }

  static hasApiKey() {
    return !!this.getApiKey();
  }

  /**
   * Envia uma imagem em Base64 para a API do Gemini e retorna o resultado extraído.
   * @param {string} base64Image A imagem em base64 (sem o prefixo data:image/...)
   * @param {string} mimeType O tipo mime da imagem (ex: image/jpeg)
   * @param {string} prompt O prompt instruindo a IA sobre o que extrair
   * @returns {Promise<Object|string>} O objeto JSON extraído ou texto
   */
  static async analyzeImage(base64Image, mimeType, prompt) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("Chave de API do Gemini não configurada.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error("A IA não retornou nenhum texto útil.");

      try {
        const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanedText);
      } catch (e) {
        console.warn("Retorno da IA não é um JSON válido:", rawText);
        return rawText;
      }
    } catch (error) {
      console.error("[VisionAPI] Error:", error);
      throw error;
    }
  }

  /**
   * Utilitário para converter um File em Base64
   * @param {File} file 
   * @returns {Promise<{base64: string, mimeType: string}>}
   */
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result; // "data:image/jpeg;base64,....."
        const commaIdx = result.indexOf(',');
        if (commaIdx === -1) {
          reject(new Error("Erro ao ler o arquivo."));
          return;
        }
        resolve({
          base64: result.substring(commaIdx + 1),
          mimeType: file.type
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
