/**
 * Componente SettingsModal (Configurações do Banco Supabase Online)
 */

export function renderSettingsModal(containerEl, onSave) {
  containerEl.innerHTML = `
    <div id="settingsModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center; padding:16px;">
      <div style="background:var(--panel); padding:24px; border-radius:12px; border:1px solid var(--line); width:420px; max-width:100%; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
        <h3 style="margin-top:0; font-family:var(--font-display); font-size:18px;">Modo Multi-Usuário Online (Supabase)</h3>
        <p style="font-size:12.5px; color:var(--muted); line-height:1.5;">Para sincronização em tempo real entre computadores e celulares da equipe, insira a <code>URL</code> e a <code>anon key</code> do seu projeto Supabase. Deixe em branco para usar o modo local offline.</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
          <div class="field">
            <label>URL do Supabase</label>
            <input type="text" id="sbUrl" style="width:100%; background:#0D1524; border:1px solid var(--line); color:var(--text); font-family:var(--font-mono); font-size:11.5px; padding:10px; border-radius:6px;" placeholder="https://xxx.supabase.co">
          </div>
          <div class="field">
            <label>Chave Anon (JWT Public Key)</label>
            <textarea id="sbKey" rows="3" style="width:100%; background:#0D1524; border:1px solid var(--line); color:var(--text); font-family:var(--font-mono); font-size:11.5px; padding:10px; border-radius:6px;" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."></textarea>
          </div>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px; justify-content:flex-end;">
          <button class="btn btn-ghost" id="btnCancelSettings">Cancelar</button>
          <button class="btn btn-primary" id="btnSaveSettings">Salvar & Reiniciar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnCancelSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
  });

  document.getElementById('btnSaveSettings').addEventListener('click', () => {
    const url = document.getElementById('sbUrl').value.trim();
    const key = document.getElementById('sbKey').value.trim();
    onSave(url, key);
  });
}

const DEFAULT_SB_URL = 'https://cccyycqxasypvzwhcsok.supabase.co';
const DEFAULT_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw';

export function openSettingsModal() {
  document.getElementById('sbUrl').value = localStorage.getItem('sb_url') || DEFAULT_SB_URL;
  document.getElementById('sbKey').value = localStorage.getItem('sb_key') || DEFAULT_SB_KEY;
  document.getElementById('settingsModal').style.display = 'flex';
}
