/**
 * sheets-write-api.js — Google Sheets Write Service (Webhook Version)
 * Escrita na planilha e upload de fotos via Google Apps Script (GAS)
 * Funciona offline e suporta filas de escrita (Queue).
 */
import { getUser } from './auth.js';

// URL do Webhook do Google Apps Script
export const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz-q0Ngl4KZAvnocvxcbRigshjGx5pYSSY6a9qMXscibifFnaxnmv8gSKcHTNaKsIvJ/exec';

let _pendingQueue = [];
let _isProcessingQueue = false;
let _listeners = [];

// ─── Helpers ─────────────────────────────────────────────────────

function _checkAuth() {
  const user = getUser();
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }
}

async function _webhookCall(payload) {
  _checkAuth();

  if (WEBHOOK_URL === 'COLE_A_URL_DO_SEU_WEBHOOK_AQUI') {
    throw new Error('WEBHOOK_URL não configurada. Configure o Apps Script primeiro.');
  }

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Erro HTTP no Webhook: ${res.status}`);
  }

  const result = await res.json();
  if (result.error) {
    throw new Error(`Erro do servidor: ${result.error}`);
  }

  return result.data;
}

// ─── Core Write Operations ───────────────────────────────────────

export async function updateCell(sheetName, row, col, value) {
  return _webhookCall({
    action: 'updateCell',
    sheetName, row, col, value
  });
}

export async function batchUpdate(updates) {
  return _webhookCall({
    action: 'batchUpdate',
    updates
  });
}

export async function appendRow(sheetName, rowData) {
  return _webhookCall({
    action: 'appendRow',
    sheetName, rowData
  });
}

// ─── Photo Upload ────────────────────────────────────────────────

function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toDataURL('image/jpeg', quality);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPhoto(file, prefix = 'evidencia') {
  // Compress to base64 Data URL
  const base64Data = await compressImage(file);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${prefix}_${timestamp}.jpg`;

  return _webhookCall({
    action: 'uploadPhoto',
    filename: fileName,
    mimeType: 'image/jpeg',
    base64Data: base64Data
  });
}

// ─── Offline Queue ───────────────────────────────────────────────

const QUEUE_KEY = 'vero_write_queue';

function _loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    _pendingQueue = raw ? JSON.parse(raw) : [];
  } catch {
    _pendingQueue = [];
  }
}

function _saveQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(_pendingQueue));
  _notifyListeners();
}

export function enqueueWrite(type, payload) {
  _loadQueue();
  _pendingQueue.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
  _saveQueue();
  processQueue();
}

export async function processQueue() {
  if (_isProcessingQueue || _pendingQueue.length === 0) return;
  if (!navigator.onLine) return;

  _isProcessingQueue = true;
  _loadQueue();

  while (_pendingQueue.length > 0) {
    const op = _pendingQueue[0];
    try {
      if (op.type === 'update') {
        await updateCell(op.payload.sheetName, op.payload.row, op.payload.col, op.payload.value);
      } else if (op.type === 'batch') {
        await batchUpdate(op.payload.updates);
      } else if (op.type === 'append') {
        await appendRow(op.payload.sheetName, op.payload.rowData);
      }
      _pendingQueue.shift(); // Remove from queue on success
      _saveQueue();
    } catch (e) {
      console.error('[Write Queue] Failed:', e);
      op.retries++;
      if (op.retries >= 5 || e.message === 'AUTH_REQUIRED') {
        console.error('[Write Queue] Error blocking queue, discarding or waiting:', op);
        if (e.message !== 'AUTH_REQUIRED') {
          _pendingQueue.shift(); // discard if too many retries
          _saveQueue();
        }
      }
      break; // Stop processing, retry later
    }
  }

  _isProcessingQueue = false;
  _notifyListeners();
}

export function getPendingCount() {
  _loadQueue();
  return _pendingQueue.length;
}

// ─── Listeners ───────────────────────────────────────────────────

export function onQueueChange(cb) {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter(l => l !== cb); };
}

function _notifyListeners() {
  _listeners.forEach(cb => cb(_pendingQueue.length));
}

// ─── Init ────────────────────────────────────────────────────────

window.addEventListener('online', () => {
  console.log('[Write Queue] Back online, processing queue...');
  processQueue();
});

_loadQueue();
