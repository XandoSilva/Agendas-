/**
 * Componente Calendário visual para filtro por data.
 * Design inspirado em calendário de parede com header colorido e grid de dias.
 */

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null; // 'YYYY-MM-DD' ou null (tudo)

/**
 * Renderiza o calendário no container e configura event delegation.
 * @param {HTMLElement} containerEl - Elemento onde o calendário será renderizado
 * @param {string[]} activeDates - Lista de datas (YYYY-MM-DD) que possuem atividades
 * @param {function} onDateSelect - Callback(dateStr|null) chamado ao clicar numa data
 */
export function renderCalendar(containerEl, activeDates, onDateSelect) {
  const activeDateSet = new Set(activeDates);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Primeiro dia do mês e quantidade de dias
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Células do grid
  let cellsHTML = '';

  // Células vazias antes do dia 1
  for (let i = 0; i < firstDay; i++) {
    cellsHTML += '<div class="cal-cell cal-empty"></div>';
  }

  // Dias do mês
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const hasActivity = activeDateSet.has(dateStr);

    const classes = ['cal-cell', 'cal-day'];
    if (isToday) classes.push('cal-today');
    if (isSelected) classes.push('cal-selected');
    if (hasActivity) classes.push('cal-has-activity');

    cellsHTML += `<div class="${classes.join(' ')}" data-date="${dateStr}">
      <span>${d}</span>
      ${hasActivity ? '<i class="cal-dot"></i>' : ''}
    </div>`;
  }

  containerEl.innerHTML = `
    <div class="cal-widget">
      <div class="cal-header">
        <button class="cal-nav" data-cal-nav="prev">◀</button>
        <div class="cal-month-year">
          <span class="cal-month-name">${MONTH_NAMES[currentMonth]}</span>
          <span class="cal-year">${currentYear}</span>
        </div>
        <button class="cal-nav" data-cal-nav="next">▶</button>
      </div>
      <div class="cal-dow-row">
        ${DAY_LABELS.map(d => `<div class="cal-dow">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${cellsHTML}
      </div>
      ${selectedDate ? `<button class="cal-clear-filter">✕ Limpar filtro de data</button>` : ''}
    </div>
  `;

  // Event delegation (sem re-registrar — atach uma vez por container)
  containerEl.onclick = (ev) => {
    // Navegação de mês
    const navBtn = ev.target.closest('[data-cal-nav]');
    if (navBtn) {
      const dir = navBtn.getAttribute('data-cal-nav');
      if (dir === 'prev') {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      } else {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      }
      renderCalendar(containerEl, activeDates, onDateSelect);
      return;
    }

    // Limpar filtro
    if (ev.target.closest('.cal-clear-filter')) {
      selectedDate = null;
      onDateSelect(null);
      renderCalendar(containerEl, activeDates, onDateSelect);
      return;
    }

    // Seleção de dia
    const dayCell = ev.target.closest('.cal-day');
    if (dayCell) {
      const clickedDate = dayCell.getAttribute('data-date');
      if (selectedDate === clickedDate) {
        // Desselecionar = mostrar tudo
        selectedDate = null;
        onDateSelect(null);
      } else {
        selectedDate = clickedDate;
        onDateSelect(selectedDate);
      }
      renderCalendar(containerEl, activeDates, onDateSelect);
    }
  };
}

/**
 * Retorna a data selecionada atualmente (ou null).
 */
export function getSelectedDate() {
  return selectedDate;
}

/**
 * Navega o calendário para o mês/ano de uma data ISO.
 */
export function navigateToDate(isoDate) {
  if (!isoDate) return;
  const [y, m] = isoDate.split('-');
  currentYear = parseInt(y, 10);
  currentMonth = parseInt(m, 10) - 1;
}
