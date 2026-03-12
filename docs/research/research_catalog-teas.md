# RESEARCH: Каталог чаёв — список карточек, пагинация, данные из таблицы teas

**Дата:** 2026-03-11
**Фаза:** RESEARCH
**Задача:** Каталог чаёв: список карточек, пагинация, данные из таблицы teas

---

## 1. Затронутые файлы

### Уже существуют
| Файл | Роль |
|---|---|
| `src/js/shared/config.js` | SUPABASE_URL и SUPABASE_ANON_KEY |
| `src/js/shared/supabase.js` | Инициализация клиента через `window.supabase.createClient()` |
| `src/js/shared/utils.js` | Утилиты: `formatPrice`, `formatPricePerGram`, `calculatePrice`, `getErrorMessage` |
| `src/js/shared/header.js` | Шапка с навигацией, зависит от auth-состояния |
| `src/js/auth/auth-state.js` | `getCurrentUser`, `onAuthChange`, `logout` |
| `src/css/auth.css` | Стили авторизации (для справки по паттерну CSS) |
| `supabase/migrations/001_initial_schema.sql` | Схема БД, RLS |
| `supabase/migrations/002_seed_data.sql` | Тестовые данные: 18 чаёв, 7 категорий |

### Не существуют (нужно создать)
| Файл | Назначение |
|---|---|
| `src/pages/catalog.html` | Страница каталога чаёв |
| `src/js/catalog/catalog.js` | Главный модуль каталога (загрузка, рендер, пагинация) |
| `src/css/catalog.css` | Стили каталога |

---

## 2. Таблица `teas` — структура

| Поле | Тип | Описание |
|---|---|---|
| `id` | INT (identity) | Первичный ключ |
| `name` | TEXT | Название чая |
| `slug` | TEXT UNIQUE | URL-дружественный идентификатор |
| `description` | TEXT | Описание |
| `category_id` | INT FK → categories.id | Категория |
| `price_per_gram` | NUMERIC(10,2) | Цена за 1 грамм в рублях |
| `weight_grams` | SMALLINT | Стандартная фасовка в граммах |
| `image_url` | TEXT | URL изображения (nullable) |
| `in_stock` | BOOLEAN | Наличие (default true) |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

### Связанные таблицы для каталога
| Таблица | Связь | Назначение |
|---|---|---|
| `categories` | `teas.category_id → categories.id` | Категория чая (name, slug) |
| `tea_characteristics` | `tea_id → teas.id`, `characteristic_id → characteristics.id` | М:N — характеристики чая |
| `characteristics` | через `tea_characteristics` | Вкус, аромат, эффект (type + name) |

---

## 3. Seed-данные

- **18 чаёв** в 7 категориях
- **7 категорий:** Чёрный чай, Зелёный чай, Улун, Пуэр, Белый чай, Травяной чай, Ройбос
- Все 18 чаёв имеют `in_stock = true`
- `image_url` — NULL во всех seed-записях (изображений нет)
- `weight_grams` варьируется: 25, 50, 100 г
- `price_per_gram` варьируется: 2,40 — 43,00 ₽/г

---

## 4. RLS-политики, связанные с задачей

### Публичное чтение (доступно гостям и авторизованным)
| Таблица | Политика |
|---|---|
| `teas` | `"Чаи: публичное чтение"` — `FOR SELECT USING (true)` |
| `categories` | `"Каталог: публичное чтение"` — `FOR SELECT USING (true)` |
| `characteristics` | `"Характеристики: публичное чтение"` — `FOR SELECT USING (true)` |
| `tea_characteristics` | `"Характеристики чаёв: публичное чтение"` — `FOR SELECT USING (true)` |

**Вывод:** каталог чаёв не требует авторизации.

---

## 5. Supabase SDK — методы, доступные для каталога

### Уже используются в проекте
- `supabase.auth.getSession()` — в `auth-state.js`
- `supabase.auth.onAuthStateChange()` — в `auth-state.js`
- `supabase.auth.signOut()` — в `auth-state.js`

### Для каталога (ещё не используются)
- `supabase.from('teas').select(...)` — чтение данных
- `.eq('in_stock', true)` — фильтрация по наличию
- `.eq('category_id', id)` — фильтрация по категории
- `.order('name', { ascending: true })` — сортировка
- `.range(from, to)` — пагинация (0-based, включительно)
- `.select('*, categories(name, slug)')` — join через PostgREST
- `.select('count', { count: 'exact', head: true })` — подсчёт всего числа записей

### Пагинация через `.range()`
```js
// Страница 1 (items per page = 9):
.range(0, 8)   // возвращает записи 0–8
// Страница 2:
.range(9, 17)  // возвращает записи 9–17
```

---

## 6. HTML-страницы

### Существующие страницы (для справки по структуре)
- `src/pages/login.html` — паттерн подключения Supabase CDN + CSS + JS module
- `src/pages/profile.html` — паттерн шапки с `#guest-nav` / `#user-nav`

### Структура шапки (из `login.html` и `header.js`)
```html
<header id="site-header">
  <a href="/" class="logo">TeaShop</a>
  <nav id="guest-nav">...</nav>
  <nav id="user-nav" style="display: none;">...</nav>
</header>
```
`header.js` управляет видимостью через `updateHeader(user)`.

---

## 7. Действующие паттерны проекта

### Подключение JS-модуля к HTML
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script type="module" src="../js/catalog/catalog.js"></script>
```

### Импорт Supabase-клиента в JS-модуле
```js
import { supabase } from '../shared/supabase.js';
```

### Обработка ошибок (обязательно для каждого запроса)
```js
try {
  const { data, error } = await supabase.from('teas').select('*');
  if (error) throw error;
  // ...
} catch (err) {
  console.error('Ошибка:', err);
}
```

### Утилиты из `utils.js`
- `formatPrice(price)` → `"450 ₽"` или `"6,88 ₽"`
- `formatPricePerGram(pricePerGram)` → `"6,88 ₽/г"`
- `calculatePrice(pricePerGram, weightGrams)` → число
- `getErrorMessage(error, context)` → строка для UI

### Стандарты кода
- ES modules (`import/export`)
- Комментарии на **русском** языке
- Имена переменных и функций на **английском** языке
- Адаптивный дизайн от **375px**

---

## 8. Что уже готово (не нужно делать)

- Схема БД: таблица `teas`, `categories`, `tea_characteristics`, `characteristics`
- RLS-политики: публичное чтение для всех каталожных таблиц
- Seed-данные: 18 чаёв
- Supabase-клиент: `supabase.js` + `config.js`
- Утилиты форматирования цены: `utils.js`
- Шапка с навигацией: `header.js`

---

## 9. Что отсутствует (предстоит реализовать)

- Страница `src/pages/catalog.html`
- Модуль `src/js/catalog/catalog.js` с функциями:
  - загрузка чаёв из Supabase (с join на `categories`)
  - рендер карточек
  - фильтрация по категории
  - пагинация (`.range()`)
- Стили `src/css/catalog.css`:
  - grid-сетка карточек
  - фильтры по категории
  - элементы пагинации
  - адаптивность от 375px
- Нет ни одной существующей HTML-страницы каталога
- `image_url` в seed-данных — NULL; нужно учитывать placeholder-изображение