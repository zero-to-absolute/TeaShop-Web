# Фаза 2: catalog.js — загрузка данных и рендер карточек

**Файл:** `02_catalog-js-data-render.md`
**Зависимости:** Фаза 1 (catalog.html + catalog.css)

---

## Что реализуется

Модуль `catalog.js`: параллельная загрузка категорий и чаёв из Supabase, рендер
кнопок фильтра и карточек чаёв. После этой фазы страница показывает реальные данные —
18 карточек (первые 9 на первой странице) и 8 кнопок категорий.

Пагинация и обработчики кликов — в фазе 3.

---

## Файлы

| Файл | Действие | Описание |
|---|---|---|
| `src/js/catalog/catalog.js` | **создать** | Главный модуль каталога |

---

## Константы модуля

```
PAGE_SIZE = 9       — количество карточек на странице
```

---

## Функции модуля

### `loadCategories()`
- Запрос: `supabase.from('categories').select('id, name, slug').order('id')`
- Возвращает массив категорий или пустой массив при ошибке
- `try/catch` — при ошибке `console.error`, возврат `[]`

### `loadTeas(page, categoryId)`
**Параметры:**
- `page` (number, 1-based) — номер страницы
- `categoryId` (number|null) — ID категории, `null` = все

**Запрос:**
```
supabase
  .from('teas')
  .select('*, categories(name, slug)', { count: 'exact' })
  .eq('in_stock', true)
  [.eq('category_id', categoryId)]   ← только если categoryId !== null
  .order('name', { ascending: true })
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
```
- Возвращает `{ data: [], count: 0 }` при ошибке
- `try/catch` — при ошибке логирует, возвращает дефолт

### `renderCategoryFilter(categories)`
**Параметры:** массив категорий из `loadCategories()`

**Алгоритм:**
1. Получить элемент `#category-filter`
2. Очистить `innerHTML`
3. Создать кнопку «Все» (`data-category-id="all"`, класс `active`)
4. Для каждой категории — кнопка `data-category-id="{id}"` с текстом `category.name`
5. Вставить все кнопки в DOM

Активная кнопка определяется глобальной переменной состояния `currentCategoryId`.

### `renderCards(teas)`
**Параметры:** массив чаёв из `loadTeas()`

**Алгоритм:**
1. Получить элемент `#tea-grid`
2. Очистить `innerHTML`
3. Скрыть `#loading`
4. Если `teas.length === 0`:
   - Скрыть `#tea-grid`
   - Показать `#empty-state` с текстом «В этой категории пока нет чаёв»
   - Вернуться
5. Показать `#tea-grid`, скрыть `#empty-state`
6. Для каждого чая создать `<article class="tea-card">`:

**Структура карточки (innerHTML строкой):**
- `.tea-card__image`:
  - Если `tea.image_url` — `<img src="..." alt="...">` внутри
  - Если `null` — блок остаётся пустым (CSS-placeholder через `::before`)
- `.tea-card__category` — `tea.categories.name`
- `.tea-card__name` — `tea.name`
- `.tea-card__description` — обрезка: если `tea.description.length > 80`, добавить `…`
- `.tea-card__price` — `formatPrice(calculatePrice(tea.price_per_gram, tea.weight_grams))`
- `.tea-card__price-per-gram` — `formatPricePerGram(tea.price_per_gram)`
- `.tea-card__weight` — `${tea.weight_grams} г`
- Если `!tea.in_stock` — добавить класс `tea-card--out-of-stock` на `<article>`

### `showError(message)`
- Скрыть `#loading`, `#tea-grid`
- Показать `#empty-state` с переданным сообщением

### `init()`
Точка входа, вызывается на `DOMContentLoaded`.

**Алгоритм:**
1. Показать `#loading`
2. Параллельно через `Promise.all`:
   - `loadCategories()`
   - `loadTeas(1, null)` — первая страница, все категории
3. Дождаться результатов
4. При ошибке верхнего уровня — вызвать `showError(getErrorMessage(err, 'init'))`
5. `renderCategoryFilter(categories)`
6. `renderCards(teas)`
7. (Рендер пагинации — в фазе 3)

### Состояние модуля (переменные уровня модуля)
```
let currentPage = 1;
let currentCategoryId = null;
let totalCount = 0;
```

Эти переменные используются в фазе 3 для пагинации и фильтрации.

---

## Импорты

```js
import { supabase } from '../shared/supabase.js';
import { formatPrice, formatPricePerGram, calculatePrice, getErrorMessage } from '../shared/utils.js';
```

---

## Критерии приёмки

- [ ] При открытии `catalog.html` в консоли нет ошибок (кроме возможных сетевых при отсутствии интернета)
- [ ] Отображаются 9 карточек чаёв (первые по алфавиту из 18)
- [ ] На каждой карточке: название, описание (≤ 80 символов + «…»), категория, цена, цена/г, вес
- [ ] Кнопки категорий отображаются: «Все» + 7 категорий
- [ ] Кнопка «Все» имеет класс `active`
- [ ] `#loading` исчезает после загрузки
- [ ] Если отключить интернет и обновить страницу — показывается сообщение об ошибке вместо пустого экрана

---

## Ручное тестирование

1. Открыть `catalog.html` — подождать загрузки (1-2 секунды)
2. Убедиться, что 9 карточек появились с реальными данными из Supabase
3. Открыть DevTools → Network — убедиться, что два запроса к Supabase выполнились параллельно
4. Проверить консоль — ошибок нет
5. Проверить карточку «Бай Му Дань» — цена: `price_per_gram * weight_grams` = 15.88 × 50 = 794 ₽
6. Временно отключить сеть — перезагрузить страницу — убедиться, что показан `#empty-state` с ошибкой
