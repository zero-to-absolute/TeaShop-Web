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
} from '../shared/utils.js';

// ─── Константы ───────────────────────────────────────────────────────────────

/** Количество карточек на одной странице */
const PAGE_SIZE = 9;

// ─── Состояние модуля ────────────────────────────────────────────────────────

let currentPage = 1;
let currentCategoryId = null; // null = все категории
let totalCount = 0;
const selectedCharacteristicIds = new Set(); // выбранные ID характеристик

// ─── Безопасность ────────────────────────────────────────────────────────────

/**
 * Экранирует HTML-спецсимволы в строке, чтобы предотвратить XSS.
 * Применяется ко всем данным из БД при вставке через innerHTML.
 *
 * @param {string|null|undefined} str — входная строка
 * @returns {string} — безопасная строка без HTML-спецсимволов
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Загрузка данных ─────────────────────────────────────────────────────────

/**
 * Загружает список категорий из Supabase.
 *
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
 *
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
 * Загружает чаи из Supabase с поддержкой пагинации, фильтрации по категории
 * и двухшагового фильтра по характеристикам (AND-режим: чай должен содержать все выбранные).
 *
 * Если charIds не пуст — выполняет два запроса:
 *   Шаг 1: находит tea_id по выбранным characteristic_id (таблица tea_characteristics).
 *   Шаг 2: загружает чаи с ограничением по найденным ID.
 * Если charIds пуст — прямой запрос без фильтра по характеристикам.
 *
 * @param {number} page — номер страницы (1-based)
 * @param {number|null} categoryId — ID категории или null (все категории)
 * @param {Set<number>} [charIds] — выбранные ID характеристик
 * @returns {Promise<{data: Array, count: number}>}
 */
async function loadTeas(page, categoryId, charIds) {
  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;

  try {
    // ── Two-step запрос: сначала ищем tea_id по характеристикам ──────────────
    if (charIds && charIds.size > 0) {

      // Шаг 1: получаем связанные tea_id из таблицы tea_characteristics
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
      const teaIds = [...countMap.entries()]
        .filter(([, count]) => count === charIds.size)
        .map(([id]) => id);

      // Нет чаёв с такими характеристиками — возвращаем пустой результат
      if (teaIds.length === 0) {
        return { data: [], count: 0 };
      }

      // Шаг 2: загружаем чаи по найденным ID с пагинацией
      let query = supabase
        .from('teas')
        .select('*, categories(name, slug)', { count: 'exact' })
        .eq('in_stock', true)
        .in('id', teaIds)
        .order('name', { ascending: true })
        .range(from, to);

      // Дополнительный фильтр по категории — только если задан
      if (categoryId !== null) {
        query = query.eq('category_id', categoryId);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      return { data: data ?? [], count: count ?? 0 };
    }

    // ── Прямой запрос: характеристики не выбраны ─────────────────────────────
    let query = supabase
      .from('teas')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('in_stock', true)
      .order('name', { ascending: true })
      .range(from, to);

    // Фильтр по категории — только если задан
    if (categoryId !== null) {
      query = query.eq('category_id', categoryId);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return { data: data ?? [], count: count ?? 0 };
  } catch (err) {
    console.error('loadTeas:', err);
    return { data: [], count: 0 };
  }
}

// ─── Рендер ──────────────────────────────────────────────────────────────────

/**
 * Рендерит панель фильтрации по категориям.
 * Активная кнопка определяется переменной состояния currentCategoryId.
 *
 * @param {Array} categories — массив категорий { id, name, slug }
 */
function renderCategoryFilter(categories) {
  const container = document.getElementById('category-filter');
  if (!container) return;

  // Очищаем предыдущее содержимое
  container.innerHTML = '';

  // Кнопка «Все» — активна, если категория не выбрана
  const allBtn = document.createElement('button');
  allBtn.className = 'category-btn' + (currentCategoryId === null ? ' active' : '');
  allBtn.dataset.categoryId = 'all';
  allBtn.textContent = 'Все';
  container.appendChild(allBtn);

  // Кнопки для каждой категории
  categories.forEach((category) => {
    const btn = document.createElement('button');
    btn.className =
      'category-btn' + (currentCategoryId === category.id ? ' active' : '');
    btn.dataset.categoryId = String(category.id);
    btn.textContent = category.name;
    container.appendChild(btn);
  });
}

/**
 * Рендерит секции чекбоксов фильтрации по характеристикам в блок #characteristic-filter.
 * Группирует характеристики по типу: taste, aroma, effect.
 *
 * @param {Array} characteristics — массив объектов { id, name, type }
 */
function renderCharacteristicFilter(characteristics) {
  const container = document.getElementById('characteristic-filter');
  if (!container) return;

  // Нет характеристик — скрываем блок фильтра
  if (!characteristics || characteristics.length === 0) {
    container.hidden = true;
    return;
  }

  // Очищаем предыдущее содержимое
  container.innerHTML = '';

  // Маппинг типов на читаемые метки
  const typeLabels = {
    taste: 'Вкус',
    aroma: 'Аромат',
    effect: 'Эффект',
  };

  // Группируем характеристики по типу
  const groups = {};
  characteristics.forEach((char) => {
    if (!groups[char.type]) {
      groups[char.type] = [];
    }
    groups[char.type].push(char);
  });

  // Порядок отображения групп
  const typeOrder = ['taste', 'aroma', 'effect'];

  typeOrder.forEach((type) => {
    const items = groups[type];
    if (!items || items.length === 0) return;

    // Контейнер группы
    const groupEl = document.createElement('div');
    groupEl.className = 'char-group';
    groupEl.dataset.type = type;

    // Метка группы
    const label = document.createElement('span');
    label.className = 'char-group__label';
    label.textContent = typeLabels[type] ?? type;
    groupEl.appendChild(label);

    // Контейнер чекбоксов
    const checkboxesEl = document.createElement('div');
    checkboxesEl.className = 'char-group__checkboxes';

    items.forEach((char) => {
      // Чекбокс
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `char-${char.id}`;
      input.className = 'char-check';
      input.value = String(char.id);

      // Подпись к чекбоксу
      const labelEl = document.createElement('label');
      labelEl.htmlFor = `char-${char.id}`;
      labelEl.className = 'char-label';
      labelEl.textContent = char.name;

      checkboxesEl.appendChild(input);
      checkboxesEl.appendChild(labelEl);
    });

    groupEl.appendChild(checkboxesEl);
    container.appendChild(groupEl);
  });

  // Блок управления: кнопка сброса (скрыта по умолчанию)
  const controls = document.createElement('div');
  controls.className = 'char-controls';

  const resetBtn = document.createElement('button');
  resetBtn.id = 'char-reset-btn';
  resetBtn.hidden = true;
  resetBtn.textContent = 'Сбросить фильтры';

  controls.appendChild(resetBtn);
  container.appendChild(controls);
}

/**
 * Рендерит карточки чаёв в сетку.
 * Если чаёв нет — показывает сообщение о пустой категории.
 *
 * @param {Array} teas — массив объектов чая из loadTeas()
 */
function renderCards(teas) {
  const grid = document.getElementById('tea-grid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');

  // Убираем экран загрузки
  if (loading) loading.hidden = true;

  if (!grid) return;

  // Очищаем предыдущие карточки
  grid.innerHTML = '';

  // Нет чаёв — показываем заглушку
  if (teas.length === 0) {
    grid.hidden = true;
    if (emptyState) {
      emptyState.textContent = 'В этой категории пока нет чаёв';
      emptyState.hidden = false;
    }
    return;
  }

  // Есть чаи — показываем сетку, скрываем заглушку
  grid.hidden = false;
  if (emptyState) emptyState.hidden = true;

  // Создаём карточку для каждого чая
  teas.forEach((tea) => {
    const article = document.createElement('article');
    article.className = 'tea-card' + (!tea.in_stock ? ' tea-card--out-of-stock' : '');

    // Блок изображения: если есть URL — показываем img, иначе CSS-placeholder через ::before
    const imageHtml = tea.image_url
      ? `<img src="${escapeHtml(tea.image_url)}" alt="${escapeHtml(tea.name)}">`
      : '';

    // Обрезаем описание до 80 символов
    const rawDescription = tea.description ?? '';
    const description =
      rawDescription.length > 80
        ? rawDescription.slice(0, 80) + '…'
        : rawDescription;

    // Форматируем цену и вес
    const totalPrice = formatPrice(calculatePrice(tea.price_per_gram, tea.weight_grams));
    const pricePerGram = formatPricePerGram(tea.price_per_gram);

    // Имя категории (может отсутствовать при ошибке JOIN)
    const categoryName = tea.categories?.name ?? '';

    article.innerHTML = `
      <div class="tea-card__image">${imageHtml}</div>
      <div class="tea-card__body">
        <span class="tea-card__category">${escapeHtml(categoryName)}</span>
        <h2 class="tea-card__name">${escapeHtml(tea.name)}</h2>
        <p class="tea-card__description">${escapeHtml(description)}</p>
      </div>
      <div class="tea-card__footer">
        <div class="tea-card__pricing">
          <span class="tea-card__price">${totalPrice}</span>
          <span class="tea-card__price-per-gram">${pricePerGram}</span>
        </div>
        <span class="tea-card__weight">${escapeHtml(String(tea.weight_grams))} г</span>
      </div>
    `;

    grid.appendChild(article);
  });
}

/**
 * Рендерит блок пагинации: кнопки «←», номера страниц, «→».
 * Если страниц не больше одной — очищает блок и ничего не показывает.
 *
 * @param {number} total — общее количество чаёв (с учётом фильтра)
 * @param {number} currentPage — номер текущей страницы (1-based)
 */
function renderPagination(total, currentPage) {
  const container = document.getElementById('pagination');
  if (!container) return;

  // Очищаем предыдущую пагинацию
  container.innerHTML = '';

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Пагинация не нужна — одна страница или нет данных
  if (totalPages <= 1) return;

  const fragment = document.createDocumentFragment();

  // Кнопка «назад»
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination__btn';
  prevBtn.dataset.page = 'prev';
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 1;
  fragment.appendChild(prevBtn);

  // Кнопки с номерами страниц
  for (let n = 1; n <= totalPages; n++) {
    const pageBtn = document.createElement('button');
    pageBtn.className =
      'pagination__btn' + (n === currentPage ? ' pagination__btn--active' : '');
    pageBtn.dataset.page = String(n);
    pageBtn.textContent = String(n);
    pageBtn.disabled = n === currentPage;
    fragment.appendChild(pageBtn);
  }

  // Кнопка «вперёд»
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination__btn';
  nextBtn.dataset.page = 'next';
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage === totalPages;
  fragment.appendChild(nextBtn);

  container.appendChild(fragment);
}

/**
 * Устанавливает активную кнопку в фильтре категорий.
 * Убирает класс active у всех кнопок, затем добавляет нужной.
 *
 * @param {number|null} categoryId — ID активной категории или null (кнопка «Все»)
 */
function setActiveCategory(categoryId) {
  // Снимаем active со всех кнопок
  document.querySelectorAll('.category-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  // Определяем значение data-атрибута для поиска
  const targetValue = categoryId === null ? 'all' : String(categoryId);

  // Находим нужную кнопку и делаем её активной
  const activeBtn = document.querySelector(
    `.category-btn[data-category-id="${targetValue}"]`
  );
  if (activeBtn) activeBtn.classList.add('active');
}

/**
 * Показывает сообщение об ошибке в блоке empty-state.
 * Скрывает индикатор загрузки и сетку карточек.
 *
 * @param {string} message — текст ошибки для пользователя
 */
function showError(message) {
  const loading = document.getElementById('loading');
  const grid = document.getElementById('tea-grid');
  const emptyState = document.getElementById('empty-state');

  if (loading) loading.hidden = true;
  if (grid) grid.hidden = true;

  if (emptyState) {
    emptyState.textContent = message;
    emptyState.hidden = false;
  }
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────

/**
 * Обновляет видимость кнопки «Сбросить фильтры» в зависимости от состояния
 * выбранных характеристик: кнопка скрыта, если ни одна не выбрана.
 */
function updateResetBtn() {
  const btn = document.getElementById('char-reset-btn');
  if (!btn) return;
  btn.hidden = selectedCharacteristicIds.size === 0;
}

/**
 * Применяет текущее состояние фильтров и перезагружает список чаёв с первой страницы.
 * Читает currentCategoryId и selectedCharacteristicIds из состояния модуля.
 * Обновляет totalCount, рендерит карточки и пагинацию.
 */
async function applyFilters() {
  currentPage = 1;

  // Показываем индикатор загрузки
  const loading = document.getElementById('loading');
  if (loading) loading.hidden = false;

  try {
    const { data, count } = await loadTeas(
      currentPage,
      currentCategoryId,
      selectedCharacteristicIds
    );
    totalCount = count;
    renderCards(data);
    renderPagination(totalCount, currentPage);
  } catch (err) {
    showError(getErrorMessage(err, 'applyFilters'));
  }
}

/**
 * Точка входа модуля каталога.
 * Параллельно загружает категории и первую страницу чаёв,
 * затем рендерит фильтр, карточки и пагинацию.
 * Подключает обработчики кликов по категориям и страницам.
 */
async function init() {
  // Показываем индикатор загрузки
  const loading = document.getElementById('loading');
  if (loading) loading.hidden = false;

  try {
    // Параллельная загрузка категорий, характеристик и первой страницы чаёв
    const [categories, characteristics, { data: teas, count }] = await Promise.all([
      loadCategories(),
      loadCharacteristics(),
      loadTeas(1, null),
    ]);

    // Обновляем состояние модуля
    totalCount = count;

    // Рендерим UI
    renderCategoryFilter(categories);
    renderCharacteristicFilter(characteristics);
    renderCards(teas);
    renderPagination(totalCount, currentPage);
  } catch (err) {
    showError(getErrorMessage(err, 'init'));
  }

  // ── Обработчик фильтра категорий (делегирование) ──────────────────────────
  document.getElementById('category-filter').addEventListener('click', async (event) => {
    // Ищем ближайшую кнопку категории к цели клика
    const btn = event.target.closest('button[data-category-id]');
    if (!btn) return;

    const raw = btn.dataset.categoryId;
    const newCategoryId = raw === 'all' ? null : Number(raw);

    // Категория уже активна — ничего не делаем
    if (newCategoryId === currentCategoryId) return;

    // Обновляем состояние и переключаем активную кнопку
    currentCategoryId = newCategoryId;
    setActiveCategory(currentCategoryId);

    await applyFilters();
  });

  // ── Обработчик чекбоксов характеристик (change) ──────────────────────────
  document.getElementById('characteristic-filter').addEventListener('change', (event) => {
    // Реагируем только на чекбоксы с классом char-check
    const checkbox = event.target.closest('input.char-check');
    if (!checkbox) return;

    const id = Number(checkbox.value);

    // Добавляем или удаляем ID характеристики из выбранных
    if (checkbox.checked) {
      selectedCharacteristicIds.add(id);
    } else {
      selectedCharacteristicIds.delete(id);
    }

    updateResetBtn();
    applyFilters();
  });

  // ── Обработчик кнопки «Сбросить» (click через делегирование) ─────────────
  document.getElementById('characteristic-filter').addEventListener('click', (event) => {
    const resetBtn = event.target.closest('#char-reset-btn');
    if (!resetBtn) return;

    // Снимаем все чекбоксы
    document.querySelectorAll('.char-check').forEach((cb) => { cb.checked = false; });

    // Очищаем состояние и обновляем список
    selectedCharacteristicIds.clear();
    updateResetBtn();
    applyFilters();
  });

  // ── Обработчик пагинации (делегирование) ─────────────────────────────────
  document.getElementById('pagination').addEventListener('click', async (event) => {
    // Ищем ближайшую кнопку страницы к цели клика
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

    // Страница уже активна или выходит за границы — ничего не делаем
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;

    // Обновляем состояние и показываем индикатор загрузки
    currentPage = newPage;
    const loading = document.getElementById('loading');
    if (loading) loading.hidden = false;

    try {
      const { data, count } = await loadTeas(
        currentPage,
        currentCategoryId,
        selectedCharacteristicIds
      );
      totalCount = count;
      renderCards(data);
      renderPagination(totalCount, currentPage);

      // Прокручиваем к началу сетки после успешной загрузки
      document.getElementById('tea-grid').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showError(getErrorMessage(err, 'pagination click'));
    }
  });
}

// Запускаем инициализацию после загрузки DOM
document.addEventListener('DOMContentLoaded', init);