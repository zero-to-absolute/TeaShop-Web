# RESEARCH: shared/utils.js — форматирование цен, slug'ов, обработка ошибок Supabase

## Затронутые файлы

### Существующие (читают/используют утилиты)
- `src/js/shared/config.js` — конфиг Supabase
- `src/js/shared/supabase.js` — клиент Supabase
- `src/js/shared/header.js` — шапка + auth-sync
- `src/js/auth/auth-state.js` — управление состоянием авторизации
- `src/js/auth/login.js`
- `src/js/auth/register.js`
- `src/js/auth/profile.js`

### Новый файл (создаётся задачей)
- `src/js/shared/utils.js` — **не существует**

### Будущие потребители (ещё не реализованы)
- `src/js/catalog/` — форматирование цен, slug'и товаров
- `src/js/constructor/` — цены ингредиентов, slug смесей
- `src/js/cart/` — итоговая сумма

---

## Ценообразование (formatPrice)

**Текущее состояние**: функция не существует, цены нигде не отображаются.

**Где потребуется**:
- Каталог: цена за 100 г (столбец `price_per_100g` в таблице `teas`)
- Конструктор: цены ингредиентов, итог смеси
- Корзина: цена за позицию, итого заказа

**Формат по проекту**: явно не задан. Единственный пример даты — `dd.mm.yyyy` (русская локаль), поэтому цены логично форматировать в рублях.

---

## Slug-утилиты

**Текущее состояние**: slug нигде не используется.

**Где потребуется**:
- `catalog/` — URL-адреса карточек чаёв (`/tea/zelenyj-drakon`)
- Slug генерируется из названия на русском → транслитерация → kebab-case

**Пример**: `«Зелёный дракон»` → `zelenyj-drakon`

**Таблица БД**: `teas.slug` — столбец, вероятно, будет в схеме (нужно уточнить в DESIGN).

---

## Обработка ошибок Supabase

### Паттерн 1: проверка ответа SDK (используется везде)
```js
const { data, error } = await supabase.from(...).select(...);
if (error) { /* показать пользователю */ return; }
```
Файлы: `auth-state.js`, `login.js`, `register.js`, `profile.js`

### Паттерн 2: try-catch вокруг async-функций
```js
try {
  // supabase-операция
} catch (err) {
  console.error('Контекст:', err);
}
```
Всего 12 блоков try-catch в 5 модулях.

### Паттерн 3: console.error
14 вызовов во всех auth-файлах. Формат: `'Описание на русском:', error.message`

### Паттерн 4: отображение ошибки пользователю
- `login.js` / `register.js`: `showError(message)` / `hideError()`
- `profile.js`: `showSectionStatus(element, message, type)` — поддерживает `'error'` и `'success'`

**Что сейчас отсутствует**: централизованной функции `handleSupabaseError()` нет. Каждый модуль показывает ошибку по-своему.

---

## Методы Supabase SDK, уже используемые

| Метод | Где |
|---|---|
| `supabase.auth.getSession()` | `auth-state.js` |
| `supabase.auth.signInWithPassword()` | `login.js` |
| `supabase.auth.signUp()` | `register.js` |
| `supabase.auth.updateUser()` | `profile.js` |
| `supabase.auth.signOut()` | `auth-state.js` |
| `supabase.auth.onAuthStateChange()` | `auth-state.js` |
| `.from().select().eq().single()` | `profile.js` |
| `.from().update().eq()` | `profile.js` |
| `storage.from().upload()` | `profile.js` |
| `storage.from().getPublicUrl()` | `profile.js` |

---

## Таблицы БД (связанные с задачей)

| Таблица | Поля, важные для утилит |
|---|---|
| `teas` | `price_per_100g`, `slug` (предположительно) |
| `ingredients` | `price_per_gram` (предположительно) |
| `profiles` | `full_name`, `avatar_url`, `created_at` |

**RLS**: каждая таблица должна иметь политики. Текущий код работает строго через RLS.

---

## HTML-страницы

| Файл | Отношение к задаче |
|---|---|
| `src/pages/login.html` | нет — auth только |
| `src/pages/register.html` | нет — auth только |
| `src/pages/profile.html` | нет — пока без цен |
| `src/pages/catalog.html` | **не существует** — потребует formatPrice, slug |
| `src/pages/constructor.html` | **не существует** — потребует formatPrice |
| `src/pages/cart.html` | **не существует** — потребует formatPrice |

---

## Существующий пример форматирования (дата)

В `profile.js` (строки 114–118) — единственная функция форматирования в проекте:
```js
const date = new Date(profile.created_at);
const dd = String(date.getDate()).padStart(2, '0');
const mm = String(date.getMonth() + 1).padStart(2, '0');
const yyyy = date.getFullYear();
createdAtEl.textContent = dd + '.' + mm + '.' + yyyy;
```
Это **инлайн-код**, не утилита. Показывает паттерн: форматирование встроено в компонент.

---

## Защита XSS

Везде используется `textContent` (не `innerHTML`) для вывода пользовательских данных и сообщений об ошибках.

---

## Что отсутствует (факт, не решение)

- `src/js/shared/utils.js` — файл не создан
- `formatPrice()` — не реализована
- `generateSlug()` / `slugify()` — не реализована
- `handleSupabaseError()` — не реализована
- Централизованного форматирования дат нет
