/**
 * EditModal.js — Modal de edição mobile-first (bottom sheet)
 * Renderiza campos dinamicamente baseados no tipo do registro
 * Selects populados da aba "Apoio & Listas"
 */
import { escapeHTML } from '../services/sheets-api.js';
import { canEditField } from '../services/rbac.js';
import { enqueueWrite } from '../services/sheets-write-api.js';
import { createPhotoCaptureUI, getPhotosFromContainer } from './PhotoCapture.js';
import * as Toast from './Toast.js';

// ─── Sheet metadata (column positions are 0-indexed) ─────────────

const SHEET_META = {
  b2b: {
    sheetName: 'Chamados B2B',
    keyColumn: 'B', // Protocolo
    keyField: 'Protocolo',
    fields: [
      { name: 'Status / Andamento', col: 8, type: 'select', options: 'Status Chamados' },
      { name: 'Técnico / Responsável', col: 7, type: 'select', options: 'Técnicos' },
      { name: 'Observações Gerais', col: 10, type: 'textarea' },
      { name: 'Dt. Finalizado', col: 9, type: 'text', placeholder: 'dd/mm/yyyy HH:mm:ss' },
    ],
    headerOffset: 4, // header is on row 4
  },
  incidentes: {
    sheetName: 'Incidentes',
    keyColumn: 'B', // Task ID
    keyField: 'Task ID',
    fields: [
      { name: 'Status', col: 6, type: 'select', options: 'Status Chamados' },
      { name: 'Responsável Técnico', col: 5, type: 'select', options: 'Técnicos' },
      { name: 'Observações', col: 8, type: 'textarea' },
      { name: 'Data Finalizado', col: 7, type: 'text', placeholder: 'dd/mm/yyyy' },
    ],
    headerOffset: 4,
  },
  vistorias: {
    sheetName: 'Vistorias RJ',
    keyColumn: 'E', // Contrato / Protocolo
    keyField: 'Contrato / Protocolo',
    fields: [
      { name: 'Responsável pela vistoria (Manual)', col: 11, type: 'select', options: 'Técnicos' },
      { name: 'Status Execução (Manual)', col: 12, type: 'select', options: 'Status Execução' },
      { name: 'Observação geral (Manual)', col: 13, type: 'textarea' },
    ],
    headerOffset: 4,
    // Use Data Agendada (col A, index 0) + Contrato as composite key
    compositeKey: (item) => `${item['Data Agendada'] || ''}|${item['Contrato / Protocolo'] || ''}`,
  },
  infra: {
    sheetName: 'Infra RJ',
    keyColumn: 'E', // Contrato / Protocolo
    keyField: 'Contrato / Protocolo',
    fields: [
      { name: 'Responsável pela infra (Manual)', col: 13, type: 'select', options: 'Técnicos' },
      { name: 'Status Execução (Manual)', col: 14, type: 'select', options: 'Status Execução' },
      { name: 'Observação geral (Manual)', col: 15, type: 'textarea' },
    ],
    headerOffset: 5,
    compositeKey: (item) => `${item['Data Agendada'] || ''}|${item['Contrato / Protocolo'] || ''}`,
  },
};

// ─── State ───────────────────────────────────────────────────────

let _modal = null;
let _apoioListas = null;
let _currentCallback = null;

// ─── Public API ──────────────────────────────────────────────────

/**
 * Abre o modal de edição
 * @param {string} moduleKey - Chave do módulo (b2b, incidentes, vistorias, infra)
 * @param {Object} item - Dados do item a editar
 * @param {Object} apoioListas - Listas de validação da aba Apoio
 * @param {Function} onSaved - Callback após salvar com sucesso
 */
export function open(moduleKey, item, apoioListas, onSaved = null) {
  const meta = SHEET_META[moduleKey];
  if (!meta) {
    Toast.error('Módulo não suportado para edição');
    return;
  }

  _apoioListas = apoioListas || {};
  _currentCallback = onSaved;

  _createModal(moduleKey, meta, item);
}

/**
 * Fecha o modal
 */
export function close() {
  if (_modal) {
    _modal.classList.remove('edit-modal-show');
    setTimeout(() => {
      _modal.remove();
      _modal = null;
    }, 300);
  }
}

// ─── Private ─────────────────────────────────────────────────────

function _createModal(moduleKey, meta, item) {
  // Remove existing
  if (_modal) _modal.remove();

  _modal = document.createElement('div');
  _modal.className = 'edit-modal';
  _modal.id = 'edit-modal';

  const clientName = item['Razão Social / Cliente'] || item['Título do Chamado / Trecho'] || 'Registro';

  _modal.innerHTML = `
    <div class="edit-modal-backdrop"></div>
    <div class="edit-modal-sheet">
      <div class="edit-modal-drag-handle"></div>
      <div class="edit-modal-header">
        <div>
          <h3 class="edit-modal-title">Editar Registro</h3>
          <p class="edit-modal-subtitle">${escapeHTML(clientName)}</p>
        </div>
        <button class="edit-modal-close" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="edit-modal-body">
        <div class="edit-modal-fields" id="edit-fields"></div>
        <div class="edit-modal-photos" id="edit-photos"></div>
      </div>
      <div class="edit-modal-footer">
        <button class="edit-modal-cancel" type="button">Cancelar</button>
        <button class="edit-modal-save" type="button" id="edit-save-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Salvar Alterações
        </button>
      </div>
    </div>
  `;

  // Render fields
  const fieldsContainer = _modal.querySelector('#edit-fields');
  meta.fields.forEach(field => {
    const editable = canEditField(moduleKey, field.name);
    const currentValue = item[field.name] || '';
    fieldsContainer.appendChild(_renderField(field, currentValue, editable));
  });

  // Photo capture
  const photosContainer = _modal.querySelector('#edit-photos');
  const keyValue = item[meta.keyField] || 'unknown';
  const photoUI = createPhotoCaptureUI(`${moduleKey.toUpperCase()}_${keyValue}`);
  photosContainer.appendChild(photoUI);

  // Events
  _modal.querySelector('.edit-modal-backdrop').addEventListener('click', close);
  _modal.querySelector('.edit-modal-close').addEventListener('click', close);
  _modal.querySelector('.edit-modal-cancel').addEventListener('click', close);

  _modal.querySelector('#edit-save-btn').addEventListener('click', () => {
    _handleSave(moduleKey, meta, item, photosContainer);
  });

  // Drag handle for dismiss
  _setupDragDismiss(_modal.querySelector('.edit-modal-sheet'));

  document.body.appendChild(_modal);
  requestAnimationFrame(() => _modal.classList.add('edit-modal-show'));
}

function _renderField(field, currentValue, editable) {
  const wrapper = document.createElement('div');
  wrapper.className = 'edit-field';

  const label = document.createElement('label');
  label.className = 'edit-field-label';
  label.textContent = field.name;
  wrapper.appendChild(label);

  let input;
  if (field.type === 'select') {
    input = document.createElement('select');
    input.className = 'edit-field-input';
    input.disabled = !editable;

    // Get options from apoio listas
    const optionKey = field.options;
    const options = (_apoioListas && _apoioListas[optionKey]) || [];

    // Add empty option
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '— Selecionar —';
    input.appendChild(emptyOpt);

    // Add options
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (opt.trim().toUpperCase() === currentValue.trim().toUpperCase()) o.selected = true;
      input.appendChild(o);
    });

    // If current value not in options, add it
    if (currentValue && !options.some(o => o.trim().toUpperCase() === currentValue.trim().toUpperCase())) {
      const custom = document.createElement('option');
      custom.value = currentValue;
      custom.textContent = currentValue;
      custom.selected = true;
      input.appendChild(custom);
    }
  } else if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'edit-field-input edit-field-textarea';
    input.rows = 3;
    input.value = currentValue;
    input.disabled = !editable;
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-field-input';
    input.value = currentValue;
    input.placeholder = field.placeholder || '';
    input.disabled = !editable;
  }

  input.dataset.fieldName = field.name;
  input.dataset.col = field.col;

  if (!editable) {
    wrapper.classList.add('edit-field-readonly');
  }

  wrapper.appendChild(input);
  return wrapper;
}

async function _handleSave(moduleKey, meta, item, photosContainer) {
  const saveBtn = _modal.querySelector('#edit-save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="btn-spinner"></div> Salvando...`;

  try {
    const fields = _modal.querySelectorAll('.edit-field-input:not(:disabled)');
    const updates = [];

    // Use pre-calculated row index
    let rowIndex = item._rowIndex;

    if (!rowIndex) {
      Toast.error('Registro não encontrado na planilha. O dado pode ter sido movido.');
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Salvar Alterações`;
      return;
    }

    // Collect changed values
    fields.forEach(input => {
      const col = parseInt(input.dataset.col);
      const fieldName = input.dataset.fieldName;
      const newValue = input.value;
      const oldValue = item[fieldName] || '';

      if (newValue !== oldValue) {
        updates.push({
          sheetName: meta.sheetName,
          row: rowIndex,
          col,
          value: newValue,
        });
      }
    });

    // Append photo URLs to observations if any
    const photos = getPhotosFromContainer(photosContainer);
    if (photos.length > 0) {
      const photoUrls = photos.map(p => p.viewUrl || p.url).join('\n');
      const obsField = fields[fields.length - 1]; // Last field is usually Obs
      if (obsField) {
        const currentObs = obsField.value;
        const newObs = currentObs ? `${currentObs}\n📷 Fotos: ${photoUrls}` : `📷 Fotos: ${photoUrls}`;
        obsField.value = newObs;
        
        const col = parseInt(obsField.dataset.col);
        // Remove previous obs update if exists
        const existingIdx = updates.findIndex(u => u.col === col);
        if (existingIdx >= 0) updates[existingIdx].value = newObs;
        else updates.push({ sheetName: meta.sheetName, row: rowIndex, col, value: newObs });
      }
    }

    if (updates.length === 0) {
      Toast.info('Nenhuma alteração detectada');
      close();
      return;
    }

    // Enqueue the batch update (works offline too)
    enqueueWrite('batch', { updates });

    Toast.success(`${updates.length} campo${updates.length > 1 ? 's' : ''} atualizado${updates.length > 1 ? 's' : ''}`);

    // Update local data immediately for responsive UI
    updates.forEach(u => {
      const fieldName = Array.from(fields).find(f => parseInt(f.dataset.col) === u.col)?.dataset.fieldName;
      if (fieldName) item[fieldName] = u.value;
    });

    if (_currentCallback) _currentCallback(item);
    close();

  } catch (err) {
    console.error('[EditModal] Save failed:', err);
    if (err.message === 'AUTH_REQUIRED') {
      Toast.error('Sessão expirada. Faça login novamente.');
    } else {
      Toast.error('Erro ao salvar. A alteração foi enfileirada para retry.');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg> Salvar Alterações`;
  }
}

function _setupDragDismiss(sheet) {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  const handle = sheet.querySelector('.edit-modal-drag-handle');
  if (!handle) return;

  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
    sheet.style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - startY);
    sheet.style.transform = `translateY(${delta}px)`;
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    sheet.style.transition = '';
    const delta = currentY - startY;
    if (delta > 120) {
      close();
    } else {
      sheet.style.transform = '';
    }
  });
}
