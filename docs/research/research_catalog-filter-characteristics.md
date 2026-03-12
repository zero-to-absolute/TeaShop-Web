# RESEARCH: фильтрация каталога по категории и вкусовому профилю через characteristics

## Затронутые файлы

| Файл | Роль |
|---|---|
| `src/js/catalog/catalog.js` | Главный модуль каталога — весь JS каталога |
| `src/pages/catalog.html` | HTML-страница каталога |
| `src/css/catalog.css` | Стили каталога |
| `supabase/migrations/001_initial_schema.sql` | Схема БД: таблицы, RLS |
| `supabase/migrations/002_seed_data.sql` | Данные: все чаи, характеристики, связи |

---

## Таблицы БД, связанные с задачей

### `characteristics`
```
id   int PK
type characteristic_type ENUM('taste', 'aroma', 'effect')
name text
UNIQUE(type, name)
```
Индекс: `idx_characteristics_type ON characteristics (type)`

**Данные (22 записи):**
- `taste` (id 1–10): ягодный, фруктовый, цитрусовый, сливочный, шоколадный, ореховый, медовый, карамельный, терпкий, сладкий
- `aroma` (id 11–17): цветочный, пряный, травяной, дымный, свежий, ванильный, хвойный
- `effect` (id 18–22): бодрящий, расслабляющий, согревающий, освежающий, тонизирующий

### `tea_characteristics` (M:N)
```
tea_id            int FK → teas(id) ON DELETE CASCADE
characteristic_id int FK → characteristics(id) ON DELETE CASCADE
PRIMARY KEY (tea_id, characteristic_id)
```
Каждый чай имеет 3–5 характеристик разных типов.

### `teas`
```
id, name, slug, description, category_id, price_per_gram, weight_grams, image_url, in_stock
```
18 записей, 7 категорий.

### `categories`
```
id, name, slug, description
```
7 записей: Чёрный, Зелёный, Улун, Пуэр, Белый, Травяной, Ройбос.

---

## RLS-политики (все публичные — анонимный доступ разрешён)

| Таблица | Политика |
|---|---|
| `characteristics` | "Характеристики: публичное чтение" — `FOR SELECT USING (true)` |
| `tea_characteristics` | "Характеристики чаёв: публичное чтение" — `FOR SELECT USING (true)` |
| `teas` | "Чаи: публичное чтение" — `FOR SELECT USING (true)` |
| `categories` | "Каталог: публичное чтение" — `FOR SELECT USING (true)` |

Новых RLS-политик для задачи не требуется.

---

## Текущее состояние JS-модуля (`catalog.js`)

### Состояние модуля (module-level переменные)
```js
let currentPage = 1;
let currentCategoryId = null; // null = все категории
let totalCount = 0;
```
Фильтр по характеристикам отсутствует.

### Существующие функции

| Функция | Что делает |
|---|---|
| `loadCategories()` | SELECT из `categories`, возвращает `[{id, name, slug}]` |
| `loadTeas(page, categoryId)` | SELECT из `teas` с JOIN `categories`, фильтр `.eq('category_id', ...)`, пагинация через `.range()`, count `exact` |
| `renderCategoryFilter(categories)` | Рендерит кнопки-табы по массиву категорий; кнопка «Все» + по одной на категорию |
| `renderCards(teas)` | Рендерит карточки чаёв в `#tea-grid` |
| `renderPagination(total, currentPage)` | Рендерит кнопки страниц в `#pagination` |
| `setActiveCategory(categoryId)` | Переключает `.active` на кнопках категорий |
| `showError(message)` | Показывает ошибку в `#empty-state` |
| `init()` | Параллельная загрузка категорий + чаёв, рендер, подключение обработчиков |

### Обработчики событий (через делегирование)
- `#category-filter` — клик по `button[data-category-id]` → обновляет `currentCategoryId`, сбрасывает `currentPage = 1`, вызывает `loadTeas` + `renderCards` + `renderPagination`
- `#pagination` — клик по `button[data-page]` → обновляет `currentPage`, вызывает `loadTeas` + `renderCards` + `renderPagination`

### Текущий Supabase-запрос в `loadTeas`
```js
supabase
  .from('teas')
  .select('*, categories(name, slug)', { count: 'exact' })
  .eq('in_stock', true)
  .order('name', { ascending: true })
  .range(from, to)
  // опционально:
  .eq('category_id', categoryId)
```
Фильтрация по `tea_characteristics` не реализована.

---

## HTML-структура (`catalog.html`)

```html
<div id="category-filter"></div>   <!-- кнопки категорий — JS заполняет -->
<div id="loading">Загрузка...</div>
<div id="empty-state" hidden></div>
<div id="tea-grid" class="tea-grid"></div>
<nav id="pagination"></nav>
```

Блока для фильтра по характеристикам нет. В `<head>` подключены:
- `catalog.css`
- `catalog.js` (type="module")
- `header.js` (type="module")
- Supabase CDN (`@supabase/supabase-js@2`)

---

## CSS-структура (`catalog.css`)

| Селектор | Роль |
|---|---|
| `#category-filter` | flex, overflow-x: auto, gap 8px |
| `.category-btn` | таб-кнопка с border-radius 20px, border 2px solid #2e7d32 |
| `.category-btn.active` | зелёный фон #2e7d32, белый текст |
| `#loading` | центрированный блок min-height 200px |
| `#empty-state` | flex column, centered |
| `.tea-grid` | CSS grid, 3 колонки → 2 → 1 (брейкпоинты 959px, 599px) |
| `.tea-card` | flex column, box-shadow, hover анимация |

Стилей для фильтра характеристик нет.

---

## Паттерн Supabase SDK для M:N фильтрации (факт)

PostgREST v2 (Supabase JS SDK v2) поддерживает inner join с фильтром по связанной таблице:

```js
supabase
  .from('teas')
  .select('*, categories(name, slug), tea_characteristics!inner(characteristic_id)')
  .eq('tea_characteristics.characteristic_id', characteristicId)
```

Суффикс `!inner` превращает embed в INNER JOIN — чаи без нужной характеристики исключаются.
`count: 'exact'` работает корректно с этим синтаксисом.

Альтернативный подход — двухэтапный: сначала получить `tea_id[]` из `tea_characteristics`, затем `.in('id', teaIds)`. Менее эффективен (два запроса вместо одного).

---

## Выводы (только факты)

1. Фильтр по категории реализован полностью: UI (кнопки-табы), состояние (`currentCategoryId`), запрос (`.eq('category_id', ...)`).
2. Фильтра по характеристикам нет ни в JS, ни в HTML, ни в CSS.
3. Данные для фильтра есть: 10 вкусовых (`taste`) характеристик, 7 ароматических (`aroma`), 5 эффектов (`effect`).
4. RLS разрешает публичное чтение всех нужных таблиц — новые политики не нужны.
5. Supabase SDK v2 позволяет фильтровать по M:N через `!inner` join в одном запросе.
6. Пагинация привязана к `totalCount` — при добавлении фильтра характеристик `count: 'exact'` должен учитывать оба фильтра одновременно.
7. Состояние модуля потребует новой переменной (например, `currentCharacteristicId`).
8. HTML потребует нового блока для панели характеристик (место — между `#category-filter` и `#loading`).