/**
 * Главный модуль каталога чаёв.
 * Отвечает за загрузку данных из Supabase, рендер карточек, фильтров и пагинации.
 * Обрабатывает клики по категориям и страницам через делегирование событий.
 */

import { supabase } from '../shared/supabase.js';
import {
  formatPrice,
  formatPricePerGram,
  calculatePrice,
  getErrorMessage,
  escapeHtml,
} from '../shared/utils.js';

// ─── Константы ───────────────────────────────────────────────────────────────

/** Количество карточек на одной странице */
const PAGE_SIZE = 9;

// ─── Состояние модуля ────────────────────────────────────────────────────────

let currentPage = 1;
let totalCount = 0;
const selectedCategoryIds = new Set();
const selectedCharacteristicIds = new Set();

// ─── Загрузка данных ─────────────────────────────────────────────────────────

/**
 * Загружает список категорий из Supabase.
 * @returns {Promise<Array>} — массив объектов { id, name, slug } или [] при ошибке
 */
async function loadCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('id');

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('loadCategories:', err);
    return [];
  }
}

/**
 * Загружает все характеристики из Supabase.
 * @returns {Promise<Array>} — массив объектов { id, name, type } или [] при ошибке
 */
async function loadCharacteristics() {
  try {
    const { data, error } = await supabase
      .from('characteristics')
      .select('id, name, type')
      .order('type')
      .order('name');

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('loadCharacteristics:', err);
    return [];
  }
}

/**
 * Загружает чаи из Supabase с пагинацией и фильтрацией.
 * Поддерживает AND-режим характеристик и мульти-выбор категорий.
 *
 * @param {number} page — номер страницы (1-based)
 * @param {Set<number>} [categoryIds] — выбранные ID категорий
 * @param {Set<number>} [charIds] — выбранные ID характеристик
 * @returns {Promise<{data: Array, count: number}>}
 */
async function loadTeas(page, categoryIds, charIds) {
  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;

  try {
    // Two-step запрос при фильтрации по характеристикам (AND-режим)
    let teaIdFilter = null;

    if (charIds && charIds.size > 0) {
      const { data: links, error: linksError } = await supabase
        .from('tea_characteristics')
        .select('tea_id')
        .in('characteristic_id', [...charIds]);

      if (linksError) throw linksError;

      // AND: чай должен иметь ВСЕ выбранные характеристики
      const countMap = new Map();
      (links ?? []).forEach(({ tea_id }) => {
        countMap.set(tea_id, (countMap.get(tea_id) ?? 0) + 1);
      });
      teaIdFilter = [...countMap.entries()]
        .filter(([, count]) => count === charIds.size)
        .map(([id]) => id);

      if (teaIdFilter.length === 0) {
        return { data: [], count: 0 };
      }
    }

    // Основной запрос
    let query = supabase
      .from('teas')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('in_stock', true)
      .order('name', { ascending: true })
      .range(from, to);

    // Фильтр по категориям (мульти-выбор)
    if (categoryIds && categoryIds.size > 0) {
      query = query.in('category_id', [...categoryIds]);
    }

    // Фильтр по найденным ID чаёв (из характеристик)
    if (teaIdFilter) {
      query = query.in('id', teaIdFilter);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return { data: data ?? [], count: count ?? 0 };
  } catch (err) {
    console.error('loadTeas:', err);
    return { data: [], count: 0 };
  }
}

// ─── Рендер фильтров ────────────────────────────────────────────────────────

/**
 * Рендерит все фильтры: категории и характеристики.
 * @param {Array} categories — массив категорий
 * @param {Array} characteristics — массив характеристик
 */
function renderFilters(categories, characteristics) {
  // Рендерим категории
  const categoryContainer = document.getElementById('category-filter');
  if (categoryContainer && categories.length > 0) {
    categoryContainer.innerHTML = '';
    renderFilterSection(categoryContainer, 'Категория', categories, 'category');
  }

  // Рендерим характеристики
  const charContainer = document.getElementById('characteristic-filter');
  if (!charContainer) return;

  charContainer.innerHTML = '';

  if (characteristics && characteristics.length > 0) {
    const typeLabels = { taste: 'Вкус', aroma: 'Аромат', effect: 'Эффект' };
    const groups = {};
    characteristics.forEach((char) => {
      if (!groups[char.type]) groups[char.type] = [];
      groups[char.type].push(char);
    });

    ['taste', 'aroma', 'effect'].forEach((type) => {
      const items = groups[type];
      if (items && items.length > 0) {
        renderFilterSection(charContainer, typeLabels[type] ?? type, items, 'characteristic');
      }
    });
  }

  // Кнопка сброса
  const resetBtn = document.createElement('button');
  resetBtn.id = 'char-reset-btn';
  resetBtn.className = 'text-[10px] uppercase tracking-widest font-bold text-red-400 hover:text-red-600 transition-colors mt-8 w-full text-left';
  resetBtn.hidden = true;
  resetBtn.textContent = 'Сбросить фильтры';
  charContainer.appendChild(resetBtn);
}

/**
 * Рендерит одну секцию фильтра (аккордеон с чекбоксами).
 * @param {HTMLElement} container — куда вставляем
 * @param {string} title — заголовок секции
 * @param {Array} items — элементы фильтра { id, name }
 * @param {string} type — 'category' или 'characteristic'
 */
function renderFilterSection(container, title, items, type) {
  const section = document.createElement('div');
  section.className = 'border-b border-bone pb-6';

  const header = document.createElement('button');
  header.className = 'accordion-header flex justify-between items-center w-full text-left group';
  header.innerHTML = `
    <span class="text-[10px] uppercase tracking-widest font-bold text-almond-silk group-hover:text-tea-dark transition-colors">${escapeHtml(title)}</span>
    <i data-lucide="chevron-down" size="14" class="text-bone group-hover:text-tea-dark"></i>
  `;

  const content = document.createElement('div');
  content.className = 'accordion-content';

  const list = document.createElement('div');
  list.className = 'space-y-3';

  items.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-3';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `${type}-${item.id}`;
    input.className = `custom-checkbox ${type}-check`;
    input.value = String(item.id);

    // Восстанавливаем состояние чекбоксов
    const itemId = Number(item.id);
    if (type === 'category' && selectedCategoryIds.has(itemId)) input.checked = true;
    if (type === 'characteristic' && selectedCharacteristicIds.has(itemId)) input.checked = true;

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `${type}-${item.id}`;
    labelEl.className = 'text-sm text-tea-dark/60 cursor-pointer hover:text-tea-dark transition-colors';
    labelEl.textContent = item.name;

    wrapper.appendChild(input);
    wrapper.appendChild(labelEl);
    list.appendChild(wrapper);
  });

  content.appendChild(list);
  section.appendChild(header);
  section.appendChild(content);
  container.appendChild(section);

  // Аккордеон
  header.addEventListener('click', () => {
    header.classList.toggle('open');
    content.classList.toggle('open');
  });

  // Открываем по умолчанию
  header.classList.add('open');
  content.classList.add('open');

  if (window.lucide) window.lucide.createIcons();
}

// ─── Рендер карточек ────────────────────────────────────────────────────────

/**
 * Рендерит карточки чаёв в стиле Tailwind.
 * @param {Array} teas — массив объектов чая
 */
function renderCards(teas) {
  const grid = document.getElementById('tea-grid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');

  if (loading) loading.hidden = true;
  if (!grid) return;

  grid.innerHTML = '';

  if (teas.length === 0) {
    grid.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  grid.hidden = false;
  if (emptyState) emptyState.hidden = true;

  teas.forEach((tea) => {
    const totalPrice = formatPrice(calculatePrice(tea.price_per_gram, tea.weight_grams));
    const categoryName = tea.categories?.name ?? '';

    const card = document.createElement('div');
    card.className = 'bg-white p-8 border border-bone group cursor-pointer hover:-translate-y-2 transition-all duration-500 shadow-sm hover:shadow-xl relative';
    card.innerHTML = `
      <div class="aspect-[4/5] bg-parchment mb-8 overflow-hidden relative">
        <img
          src="${escapeHtml(tea.image_url)}"
          alt="${escapeHtml(tea.name)}"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          onerror="this.style.display='none'"
        />

        <!-- Hover Overlay -->
        <div class="absolute inset-0 bg-tea-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
          <button class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-tea-dark hover:bg-almond-silk hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 delay-[0ms]">
            <i data-lucide="heart" size="20"></i>
          </button>
          <button class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-tea-dark hover:bg-almond-silk hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 delay-[100ms]">
            <i data-lucide="eye" size="20"></i>
          </button>
        </div>

        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
          ${escapeHtml(String(tea.weight_grams ?? ''))} г
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[10px] uppercase tracking-widest font-bold text-almond-silk mb-2 block">${escapeHtml(categoryName)}</span>
            <h4 class="text-2xl font-serif text-tea-dark group-hover:text-almond-silk transition-colors">${escapeHtml(tea.name)}</h4>
          </div>
          <p class="text-lg font-serif text-tea-dark">${totalPrice}</p>
        </div>

        <p class="text-sm text-tea-dark/50 leading-relaxed line-clamp-2">
          ${escapeHtml(tea.description ?? '')}
        </p>

        <div class="pt-6 flex items-center justify-between border-t border-bone/50">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-tea-dark/80">${formatPricePerGram(tea.price_per_gram)}</span>
            <span class="text-[10px] uppercase tracking-widest text-tea-dark/40">за 1 грамм</span>
          </div>
          <button class="flex items-center gap-2 px-4 py-2 bg-tea-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-almond-silk transition-all transform group-hover:scale-105">
            <i data-lucide="shopping-bag" size="14"></i>
            В корзину
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Переинициализируем Lucide-иконки
  if (window.lucide) window.lucide.createIcons();
}

// ─── Пагинация ──────────────────────────────────────────────────────────────

/**
 * Рендерит блок пагинации в стиле Tailwind.
 * @param {number} total — общее количество чаёв
 * @param {number} page — текущая страница
 */
function renderPagination(total, page) {
  const container = document.getElementById('pagination');
  if (!container) return;

  container.innerHTML = '';
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;

  // Кнопка «назад»
  const prevBtn = document.createElement('button');
  prevBtn.className = 'w-10 h-10 flex items-center justify-center text-xs font-bold border border-bone hover:border-tea-dark text-tea-dark/40 hover:text-tea-dark transition-all';
  prevBtn.dataset.page = 'prev';
  prevBtn.textContent = '←';
  prevBtn.disabled = page === 1;
  if (page === 1) prevBtn.classList.add('opacity-30', 'cursor-not-allowed');
  container.appendChild(prevBtn);

  // Кнопки с номерами
  for (let n = 1; n <= totalPages; n++) {
    const pageBtn = document.createElement('button');
    const isActive = n === page;
    pageBtn.className = 'w-10 h-10 flex items-center justify-center text-xs font-bold border transition-all ' +
      (isActive ? 'bg-tea-dark text-white border-tea-dark' : 'border-bone hover:border-tea-dark text-tea-dark/40 hover:text-tea-dark');
    pageBtn.dataset.page = String(n);
    pageBtn.textContent = String(n);
    pageBtn.disabled = isActive;
    container.appendChild(pageBtn);
  }

  // Кнопка «вперёд»
  const nextBtn = document.createElement('button');
  nextBtn.className = 'w-10 h-10 flex items-center justify-center text-xs font-bold border border-bone hover:border-tea-dark text-tea-dark/40 hover:text-tea-dark transition-all';
  nextBtn.dataset.page = 'next';
  nextBtn.textContent = '→';
  nextBtn.disabled = page === totalPages;
  if (page === totalPages) nextBtn.classList.add('opacity-30', 'cursor-not-allowed');
  container.appendChild(nextBtn);
}

// ─── Вспомогательные ────────────────────────────────────────────────────────

function showError(message) {
  const loading = document.getElementById('loading');
  const grid = document.getElementById('tea-grid');
  const emptyState = document.getElementById('empty-state');

  if (loading) loading.hidden = true;
  if (grid) grid.hidden = true;
  if (emptyState) {
    emptyState.innerHTML = `<p class="text-red-400">${escapeHtml(message)}</p>`;
    emptyState.hidden = false;
  }
}

function updateResetBtn() {
  const btn = document.getElementById('char-reset-btn');
  if (!btn) return;
  btn.hidden = selectedCharacteristicIds.size === 0 && selectedCategoryIds.size === 0;
}

async function applyFilters() {
  currentPage = 1;
  const loading = document.getElementById('loading');
  if (loading) loading.hidden = false;

  try {
    const { data, count } = await loadTeas(currentPage, selectedCategoryIds, selectedCharacteristicIds);
    totalCount = count;
    renderCards(data);
    renderPagination(totalCount, currentPage);
  } catch (err) {
    showError(getErrorMessage(err, 'applyFilters'));
  }
}

// ─── Инициализация ──────────────────────────────────────────────────────────

async function init() {
  const loading = document.getElementById('loading');
  if (loading) loading.hidden = false;

  try {
    // Параллельная загрузка категорий, характеристик и первой страницы чаёв
    const [categories, characteristics, { data: teas, count }] = await Promise.all([
      loadCategories(),
      loadCharacteristics(),
      loadTeas(1, new Set(), new Set()),
    ]);

    totalCount = count;
    renderFilters(categories, characteristics);
    renderCards(teas);
    renderPagination(totalCount, currentPage);
  } catch (err) {
    showError(getErrorMessage(err, 'init'));
  }

  // Тогл сайдбара фильтров
  document.getElementById('toggle-filters')?.addEventListener('click', () => {
    const sidebar = document.getElementById('filter-sidebar');
    sidebar?.classList.toggle('hidden-sidebar');
  });

  // Обработчик чекбоксов (категории + характеристики)
  const filterHandler = (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox) return;

    const id = Number(checkbox.value);

    if (checkbox.classList.contains('category-check')) {
      if (checkbox.checked) selectedCategoryIds.add(id);
      else selectedCategoryIds.delete(id);
    } else if (checkbox.classList.contains('characteristic-check')) {
      if (checkbox.checked) selectedCharacteristicIds.add(id);
      else selectedCharacteristicIds.delete(id);
    }

    updateResetBtn();
    applyFilters();
  };

  document.getElementById('category-filter')?.addEventListener('change', filterHandler);
  document.getElementById('characteristic-filter')?.addEventListener('change', filterHandler);

  // Кнопка сброса фильтров
  document.getElementById('characteristic-filter')?.addEventListener('click', (event) => {
    const resetBtn = event.target.closest('#char-reset-btn');
    if (!resetBtn) return;

    document.querySelectorAll('.custom-checkbox').forEach((cb) => { cb.checked = false; });
    selectedCharacteristicIds.clear();
    selectedCategoryIds.clear();
    updateResetBtn();
    applyFilters();
  });

  // Пагинация
  document.getElementById('pagination')?.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;

    const raw = btn.dataset.page;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    let newPage;
    if (raw === 'prev') {
      newPage = currentPage - 1;
    } else if (raw === 'next') {
      newPage = currentPage + 1;
    } else {
      newPage = Number(raw);
    }

    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;

    currentPage = newPage;
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.hidden = false;

    try {
      const { data, count } = await loadTeas(currentPage, selectedCategoryIds, selectedCharacteristicIds);
      totalCount = count;
      renderCards(data);
      renderPagination(totalCount, currentPage);
      document.getElementById('tea-grid')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showError(getErrorMessage(err, 'pagination'));
    }
  });
}

// Запускаем инициализацию после загрузки DOM
document.addEventListener('DOMContentLoaded', init);
