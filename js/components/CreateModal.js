/**
 * CreateModal.js — Modal de criação de novos registros
 * Formulário completo por tipo (B2B, Vistoria, Infra, Incidente)
 */
import { escapeHTML } from '../services/sheets-api.js';
import { canCreate } from '../services/rbac.js';
import { enqueueWrite } from '../services/sheets-write-api.js';
import { createPhotoCaptureUI, getPhotosFromContainer } from './PhotoCapture.js';
import * as Toast from './Toast.js';

// ─── Form schemas ────────────────────────────────────────────────

const CREATE_SCHEMAS = {
  b2b: {
    sheetName: 'Chamados B2B',
    title: 'Novo Chamado B2B',
    icon: '📋',
    fields: [
      { name: 'Dt. Abertura', type: 'datetime-local', required: true, default: () => new Date().toISOString().slice(0, 16) },
      { name: 'Protocolo', type: 'text', required: true, placeholder: 'Nº do protocolo' },
      { name: 'Contrato', type: 'text', placeholder: 'Nº do contrato' },
      { name: 'Razão Social / Cliente', type: 'text', required: true, placeholder: 'Nome do cliente' },
      { name: 'Endereço', type: 'text', required: true, placeholder: 'Rua, número' },
      { name: 'Número / Complemento', type: 'text', placeholder: 'Complemento' },
      { name: 'Diagnóstico / Tipo de Falha', type: 'select', options: 'Diagnóstico / Falha', required: true },
      { name: 'Técnico / Responsável', type: 'select', options: 'Técnicos' },
      { name: 'Status / Andamento', type: 'select', options: 'Status Chamados', default: () => 'Pendente' },
      { name: 'Observações Gerais', type: 'textarea', placeholder: 'Detalhes do chamado' },
    ],
  },
  incidentes: {
    sheetName: 'Incidentes',
    title: 'Novo Incidente',
    icon: '⚡',
    fields: [
      { name: 'Origem / Categoria', type: 'select', options: 'Categoria Incidente', required: true },
      { name: 'Task ID', type: 'text', placeholder: 'TAS000000XXXXX' },
      { name: 'Incidente', type: 'text', placeholder: 'INC000000XXXXX' },
      { name: 'Título do Chamado / Trecho', type: 'text', required: true, placeholder: 'Descrição do incidente' },
      { name: 'Diagnóstico / Problema', type: 'text', placeholder: 'Diagnóstico' },
      { name: 'Responsável Técnico', type: 'select', options: 'Técnicos' },
      { name: 'Status', type: 'select', options: 'Status Chamados', default: () => 'Pendente' },
      { name: 'Observações', type: 'textarea' },
    ],
  },
  vistorias: {
    sheetName: 'Vistorias RJ',
    title: 'Nova Vistoria',
    icon: '🔍',
    fields: [
      { name: 'Data Agendada', type: 'date', required: true, default: () => new Date().toISOString().slice(0, 10) },
      { name: 'Aba Ref.', type: 'text', default: () => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}`; }},
      { name: 'Atendente', type: 'text', placeholder: 'Nome do atendente' },
      { name: 'Tipo de Vistoria', type: 'select', staticOptions: ['MONO', 'CONECTORIZADO', 'CONECTORIZADA'] },
      { name: 'Contrato / Protocolo', type: 'text', required: true, placeholder: 'Nº contrato' },
      { name: 'Razão Social / Cliente', type: 'text', required: true, placeholder: 'Nome do cliente' },
      { name: 'Período / Horário', type: 'text', placeholder: 'HC, 08:00, etc.', default: () => 'HC' },
      { name: 'Status da Vistoria', type: 'select', staticOptions: ['AGENDADO', 'AGUARDANDO CONFIRMAÇÃO'], default: () => 'AGENDADO' },
      { name: 'Localidade (Bairro/RJ)', type: 'text', placeholder: 'RJ - BAIRRO' },
      { name: 'ADM / Restrição', type: 'select', staticOptions: ['NÃO', 'TERJ', 'SIGMA'], default: () => 'NÃO' },
      { name: 'Observações / Contato de Acompanhamento', type: 'textarea', placeholder: 'Quem acompanhará, contatos, OS...' },
      { name: 'Responsável pela vistoria (Manual)', type: 'select', options: 'Técnicos' },
      { name: 'Status Execução (Manual)', type: 'select', options: 'Status Execução', default: () => 'Pendente' },
      { name: 'Observação geral (Manual)', type: 'textarea' },
    ],
  },
  infra: {
    sheetName: 'Infra RJ',
    title: 'Nova Atividade de Infra',
    icon: '🏗️',
    fields: [
      { name: 'Data Agendada', type: 'date', required: true, default: () => new Date().toISOString().slice(0, 10) },
      { name: 'Aba Ref.', type: 'text', default: () => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}`; }},
      { name: 'Atendente', type: 'text', placeholder: 'Nome do atendente' },
      { name: 'Tipo de Atividade', type: 'select', staticOptions: ['MONO', 'CONECTORIZADO'] },
      { name: 'Contrato / Protocolo', type: 'text', required: true },
      { name: 'Razão Social / Cliente', type: 'text', required: true },
      { name: 'Período / Horário', type: 'text', default: () => 'HC' },
      { name: 'Status da Atividade', type: 'select', staticOptions: ['AGENDADO', 'AGUARDANDO CONFIRMAÇÃO'], default: () => 'AGENDADO' },
      { name: 'Localidade (Bairro/RJ)', type: 'text', placeholder: 'RJ - BAIRRO' },
      { name: 'ADM / Restrição', type: 'select', staticOptions: ['NÃO', 'TERJ', 'SIGMA'], default: () => 'NÃO' },
      { name: 'Materiais Necessários', type: 'text', placeholder: 'NÃO, ALÇAPÃO, GESSO...' , default: () => 'NÃO' },
      { name: 'Detalhes Atendimento', type: 'select', staticOptions: ['COMPLETO', 'PARCIAL'], default: () => 'COMPLETO' },
      { name: 'Observações', type: 'textarea' },
      { name: 'Responsável pela infra (Manual)', type: 'select', options: 'Técnicos' },
      { name: 'Status Execução (Manual)', type: 'select', options: 'Status Execução', default: () => 'Pendente' },
      { name: 'Observação geral (Manual)', type: 'textarea' },
    ],
  },
};

// ─── State ───────────────────────────────────────────────────────

let _modal = null;
let _apoioListas = null;

// ─── Public API ──────────────────────────────────────────────────

/**
 * Abre o modal de criação
 * @param {string} moduleKey - Módulo alvo
 * @param {Object} apoioListas - Listas de validação
 * @param {Function} onCreated - Callback após criar
 */
export function open(moduleKey, apoioListas, onCreated = null) {
  if (!canCreate(moduleKey)) {
    Toast.warning('Você não tem permissão para criar registros neste módulo.');
    return;
  }

  const schema = CREATE_SCHEMAS[moduleKey];
  if (!schema) {
    Toast.error('Módulo não suportado para criação');
    return;
  }

  _apoioListas = apoioListas || {};
  _createModal(moduleKey, schema, onCreated);
}

export function close() {
  if (_modal) {
    _modal.classList.remove('edit-modal-show');
    setTimeout(() => { _modal.remove(); _modal = null; }, 300);
  }
}

// ─── Private ─────────────────────────────────────────────────────

function _createModal(moduleKey, schema, onCreated) {
  if (_modal) _modal.remove();

  _modal = document.createElement('div');
  _modal.className = 'edit-modal';

  _modal.innerHTML = `
    <div class="edit-modal-backdrop"></div>
    <div class="edit-modal-sheet edit-modal-sheet-tall">
      <div class="edit-modal-drag-handle"></div>
      <div class="edit-modal-header">
        <div>
          <h3 class="edit-modal-title">${schema.icon} ${escapeHTML(schema.title)}</h3>
          <p class="edit-modal-subtitle">Preencha os campos obrigatórios (*)</p>
        </div>
        <button class="edit-modal-close" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="edit-modal-body">
        <div class="edit-modal-fields" id="create-fields"></div>
        <div class="edit-modal-photos" id="create-photos"></div>
      </div>
      <div class="edit-modal-footer">
        <button class="edit-modal-cancel" type="button">Cancelar</button>
        <button class="edit-modal-save create-btn" type="button" id="create-save-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Registro
        </button>
      </div>
    </div>
  `;

  const fieldsContainer = _modal.querySelector('#create-fields');
  schema.fields.forEach(field => {
    fieldsContainer.appendChild(_renderCreateField(field));
  });

  // Photo capture
  const photosContainer = _modal.querySelector('#create-photos');
  const photoUI = createPhotoCaptureUI(`NOVO_${moduleKey.toUpperCase()}`);
  photosContainer.appendChild(photoUI);

  // Events
  _modal.querySelector('.edit-modal-backdrop').addEventListener('click', close);
  _modal.querySelector('.edit-modal-close').addEventListener('click', close);
  _modal.querySelector('.edit-modal-cancel').addEventListener('click', close);
  _modal.querySelector('#create-save-btn').addEventListener('click', () => {
    _handleCreate(moduleKey, schema, photosContainer, onCreated);
  });

  document.body.appendChild(_modal);
  requestAnimationFrame(() => _modal.classList.add('edit-modal-show'));
}

function _renderCreateField(field) {
  const wrapper = document.createElement('div');
  wrapper.className = 'edit-field';

  const label = document.createElement('label');
  label.className = 'edit-field-label';
  label.textContent = field.name + (field.required ? ' *' : '');
  wrapper.appendChild(label);

  let input;
  const defaultVal = field.default ? field.default() : '';

  if (field.type === 'select') {
    input = document.createElement('select');
    input.className = 'edit-field-input';

    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '— Selecionar —';
    input.appendChild(emptyOpt);

    let options = [];
    if (field.staticOptions) {
      options = field.staticOptions;
    } else if (field.options && _apoioListas[field.options]) {
      options = _apoioListas[field.options];
    }

    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (opt === defaultVal) o.selected = true;
      input.appendChild(o);
    });
  } else if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'edit-field-input edit-field-textarea';
    input.rows = 3;
    input.value = defaultVal;
    if (field.placeholder) input.placeholder = field.placeholder;
  } else {
    input = document.createElement('input');
    input.type = field.type || 'text';
    input.className = 'edit-field-input';
    input.value = defaultVal;
    if (field.placeholder) input.placeholder = field.placeholder;
  }

  input.dataset.fieldName = field.name;
  input.dataset.required = field.required ? 'true' : 'false';

  wrapper.appendChild(input);
  return wrapper;
}

function _handleCreate(moduleKey, schema, photosContainer, onCreated) {
  const saveBtn = _modal.querySelector('#create-save-btn');
  const inputs = _modal.querySelectorAll('#create-fields .edit-field-input');

  // Validate required fields
  let hasErrors = false;
  inputs.forEach(input => {
    input.classList.remove('edit-field-error');
    if (input.dataset.required === 'true' && !input.value.trim()) {
      input.classList.add('edit-field-error');
      hasErrors = true;
    }
  });

  if (hasErrors) {
    Toast.warning('Preencha todos os campos obrigatórios (*)');
    return;
  }

  // Build row data
  const rowData = schema.fields.map(field => {
    const input = _modal.querySelector(`[data-field-name="${field.name}"]`);
    let value = input ? input.value : '';

    // Format date for Sheets
    if (field.type === 'date' && value) {
      const parts = value.split('-');
      value = `${parts[2]}/${parts[1]}/${parts[0]}`; // yyyy-mm-dd → dd/mm/yyyy
    }
    if (field.type === 'datetime-local' && value) {
      const d = new Date(value);
      value = d.toLocaleString('pt-BR');
    }

    return value;
  });

  // Append photo URLs
  const photos = getPhotosFromContainer(photosContainer);
  if (photos.length > 0) {
    const lastIdx = rowData.length - 1;
    const photoUrls = photos.map(p => p.viewUrl || p.url).join(' | ');
    rowData[lastIdx] = rowData[lastIdx] ? `${rowData[lastIdx]} | 📷 ${photoUrls}` : `📷 ${photoUrls}`;
  }

  // Enqueue append
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="btn-spinner"></div> Criando...`;

  enqueueWrite('append', { sheetName: schema.sheetName, rowData });

  Toast.success('Registro criado com sucesso!');
  if (onCreated) onCreated(rowData);
  close();
}
