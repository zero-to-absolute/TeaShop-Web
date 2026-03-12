# Фаза 3: catalog.js — фильтрация по категории и пагинация

**Файл:** `03_catalog-js-filter-pagination.md`
**Зависимости:** Фаза 2 (catalog.js с loadTeas, renderCards, состояние модуля)

---

## Что реализуется

Интерактивность каталога: обработчики кликов по кнопкам категорий и страницам пагинации,
функция `renderPagination()`. После этой фазы каталог полностью работает — пользователь
может фильтровать чаи по категории и переходить между страницами.

---

## Файлы

| Файл | Действие | Описание |
|---|---|---|
| `src/js/catalog/catalog.js` | **изменить** | Добавить `renderPagination` и обработчики событий |

---

## Функции, добавляемые в `catalog.js`

### `renderPagination(total, currentPage)`
**Параметры:**
- `total` (number) — общее количество чаёв (с учётом фильтра)
- `currentPage` (number, 1-based) — текущая страница

**Алгоритм:**
1. Получить элемент `#pagination`
2. Вычислить `totalPages = Math.ceil(total / PAGE_SIZE)`
3. Если `totalPages <= 1` — очистить `#pagination` и вернуться (пагинация не нужна)
4. Создать кнопку «←» (`data-page="prev"`, disabled если `currentPage === 1`)
5. Для каждой страницы от 1 до `totalPages`:
   - `<button class="pagination__btn" data-page="{n}">{n}</button>`
   - Если `n === currentPage` — добавить класс `pagination__btn--active`, disabled
6. Создать кнопку «→» (`data-page="next"`, disabled если `currentPage === totalPages`)
7. Вставить всё в `#pagination`

### `setActiveCategory(categoryId)`
**Параметры:** `categoryId` (number|null)

**Алгоритм:**
1. Убрать класс `active` со всех `.category-btn`
2. Найти кнопку с `data-category-id === String(categoryId ?? 'all')`
3. Добавить ей класс `active`

---

## Обработчики событий, добавляемые в `init()`

### Клик по фильтру категорий (делегирование)
```
document.getElementById('category-filter').addEventListener('click', handler)
```
**Обработчик:**
1. Найти ближайший `button[data-category-id]` к `event.target`
2. Если не найден — выйти
3. Прочитать `data-category-id`:
   - `"all"` → `newCategoryId = null`
   - иначе → `newCategoryId = Number(data-category-id)`
4. Если `newCategoryId === currentCategoryId` — выйти (уже активна)
5. Обновить состояние: `currentCategoryId = newCategoryId`, `currentPage = 1`
6. Показать `#loading`
7. `setActiveCategory(currentCategoryId)`
8. `const { data, count } = await loadTeas(currentPage, currentCategoryId)`
9. `totalCount = count`
10. `renderCards(data)`
11. `renderPagination(totalCount, currentPage)`

### Клик по пагинации (делегирование)
```
document.getElementById('pagination').addEventListener('click', handler)
```
**Обработчик:**
1. Найти ближайший `button[data-page]` к `event.target`
2. Если не найден или кнопка disabled — выйти
3. Прочитать `data-page`:
   - `"prev"` → `newPage = currentPage - 1`
   - `"next"` → `newPage = currentPage + 1`
   - иначе → `newPage = Number(data-page)`
4. Если `newPage === currentPage` или выходит за границы — выйти
5. Обновить состояние: `currentPage = newPage`
6. Показать `#loading`
7. `const { data, count } = await loadTeas(currentPage, currentCategoryId)`
8. `totalCount = count`
9. `renderCards(data)`
10. `renderPagination(totalCount, currentPage)`
11. Прокрутить страницу к `#tea-grid`: `document.getElementById('tea-grid').scrollIntoView({ behavior: 'smooth' })`

---

## Доработка `init()` из фазы 2

В `init()` после `renderCards(teas)` добавить:
```
totalCount = count;
renderPagination(totalCount, currentPage);
```

Подключить оба обработчика событий (можно вызовом отдельных функций `bindCategoryFilter()` и `bindPagination()`).

---

## Критерии приёмки

- [ ] Клик по «Зелёный чай» — отображаются только 4 зелёных чая, кнопка становится активной
- [ ] Клик по «Все» — отображаются снова 9 карточек (все категории, первая страница)
- [ ] При 18 чаях и PAGE_SIZE=9 — отображаются 2 кнопки страниц + «←» + «→»
- [ ] Клик «→» или «2» — загружаются следующие 9 чаёв, `#tea-grid` обновляется
- [ ] Кнопка «←» на первой странице — disabled
- [ ] Кнопка «→» на последней странице — disabled
- [ ] При переходе на страницу 2 — скролл к `#tea-grid`
- [ ] Фильтр по категории с 1-4 чаями — пагинация не отображается (один `totalPages`)
- [ ] При переключении категории страница сбрасывается на 1
- [ ] Повторный клик по уже активной категории — запрос не отправляется

---

## Ручное тестирование

1. **Базовый сценарий:**
   - Открыть каталог → 9 карточек, страницы «1 / 2»
   - Клик «2» → 9 следующих карточек, автоскролл
   - Клик «←» → возврат на страницу 1

2. **Фильтр + пагинация:**
   - Выбрать «Чёрный чай» (6 чаёв) → пагинация не отображается (≤ 9)
   - Выбрать «Все» → пагинация появляется снова

3. **Пустая категория:**
   - (Если все чаи есть в наличии — этот сценарий не применим. Для теста временно изменить запрос на несуществующую category_id — `#empty-state` должен появиться)

4. **DevTools → Network:**
   - Каждый клик по категории/странице — ровно один новый запрос к `teas`
   - Категории загружаются один раз при `init()`
