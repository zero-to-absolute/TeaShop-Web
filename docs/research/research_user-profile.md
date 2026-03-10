# Research: профиль пользователя — просмотр и редактирование данных

**Дата:** 2026-03-10
**Статус:** завершён

---

## 1. Затронутые файлы

| Файл | Статус |
|---|---|
| `src/pages/profile.html` | Существует |
| `src/js/auth/profile.js` | Существует |
| `src/css/auth.css` | Существует, содержит стили профиля |
| `src/js/auth/auth-state.js` | Существует, импортируется в profile.js |
| `src/js/shared/supabase.js` | Существует, импортируется в profile.js |
| `src/js/shared/header.js` | Существует, подключается как side-effect |
| `supabase/migrations/001_initial_schema.sql` | Содержит таблицу `profiles` и RLS |

---

## 2. Таблица БД: `profiles`

```sql
CREATE TABLE profiles (
    id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name  text,
    avatar_url text,        -- ← есть в схеме, НЕ используется на странице
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Поля:** `id`, `full_name`, `avatar_url`, `created_at`, `updated_at`

Профиль создаётся **автоматически** при регистрации через триггер `on_auth_user_created`:
- функция `handle_new_user()` (SECURITY DEFINER)
- вставляет `id` и `full_name` из `raw_user_meta_data`

---

## 3. RLS-политики на таблице `profiles`

| Политика | Операция | Условие |
|---|---|---|
| «Профиль: чтение своего» | SELECT | `auth.uid() = id` |
| «Профиль: обновление своего» | UPDATE | `auth.uid() = id` (USING + WITH CHECK) |
| «Профиль: создание своего» | INSERT | `auth.uid() = id` (WITH CHECK) |

RLS включён (`ENABLE ROW LEVEL SECURITY`). DELETE-политики нет.

---

## 4. HTML-страница `src/pages/profile.html`

**Подключаемые ресурсы:**
- Supabase CDN: `@supabase/supabase-js@2`
- `src/css/auth.css`
- `src/js/auth/profile.js` (type="module")

**Структура `<header>`:**
- `id="site-header"` — зелёный фон (#2e7d32)
- `id="guest-nav"` — ссылки «Вход» / «Регистрация»
- `id="user-nav"` — ссылка «Профиль» + `id="logout-btn"` (изначально `display:none`)

**Структура `<main class="auth-page">`:**

| Элемент | id / class | Содержимое |
|---|---|---|
| `<div>` | `class="auth-card"` | Карточка профиля |
| `<h1>` | `class="auth-title"` | «Профиль» |
| `<div>` | `class="profile-email-section"` | Секция email (только чтение) |
| `<span>` | `id="user-email"` | Email пользователя |
| `<form>` | `id="profile-form"` | Форма редактирования |
| `<input type="text">` | `id="full-name"`, `name="full_name"` | Поле имени |
| `<button type="submit">` | — | «Сохранить» |
| `<p>` | `id="status-message"` | Статус (скрыт по умолчанию) |

**Что отсутствует в HTML:** поле для `avatar_url`, ссылка на смену пароля, кнопка удаления аккаунта.

---

## 5. JS-модуль `src/js/auth/profile.js`

**Импорты:**
```js
import { supabase } from '../shared/supabase.js';
import { getCurrentUser } from './auth-state.js';
import '../shared/header.js'; // side-effect
```

**Функции:**

| Функция | Назначение |
|---|---|
| `showStatus(message, isError)` | Показывает `#status-message` с классом `.success` / `.error` |
| `hideStatus()` | Скрывает `#status-message` |
| DOMContentLoaded callback (async) | Точка входа: guard + загрузка + форма |

**Логика инициализации:**
1. Guard: `getCurrentUser()` → если `null`, редирект на `login.html?redirect=...`
2. Отображение email: `user.email` → `#user-email`
3. Запрос профиля:
   ```js
   supabase.from('profiles').select('full_name').eq('id', user.id).single()
   ```
   — загружает только поле `full_name`, `avatar_url` не запрашивается
4. Обработчик `submit`:
   - Валидация: `fullName` не пустой
   - Блокировка кнопки
   - Запрос:
     ```js
     supabase.from('profiles').update({ full_name, updated_at }).eq('id', user.id)
     ```
   - Разблокировка кнопки в `finally`

**Обработка ошибок:** try/catch для каждого Supabase-запроса, `console.error` + `showStatus`.

---

## 6. Зависимые модули

### `src/js/auth/auth-state.js`

Экспортирует:
- `getCurrentUser()` — `supabase.auth.getSession()` → `data.session?.user ?? null`
- `onAuthChange(callback)` — обёртка над `supabase.auth.onAuthStateChange`
- `logout()` — `supabase.auth.signOut()`

### `src/js/shared/supabase.js`

```js
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Клиент через CDN (`window.supabase`), ключи из `config.js`.

### `src/js/shared/header.js`

- Импортирует `getCurrentUser`, `onAuthChange`, `logout` из `auth-state.js`
- Переключает `guest-nav` / `user-nav` по auth-состоянию
- Обрабатывает клик по `#logout-btn` → `logout()` + редирект на `/`
- Подписывается на `onAuthChange` для реактивного обновления

---

## 7. CSS: `src/css/auth.css`

Стили для страницы профиля (добавлены в фазе 5 auth):

| Селектор | Назначение |
|---|---|
| `.profile-email-section` | flex-колонка, отступ снизу, разделитель border-bottom |
| `.profile-label` | Метка поля (0.875rem, #555) |
| `.profile-email-value` | Значение email (1rem, word-break: break-all) |
| `#status-message` | Скрыт по умолчанию, 0.875rem, border-radius 4px |
| `#status-message.success` | Зелёный текст (#2e7d32), фон #e8f5e9 |
| `#status-message.error` | Красный текст (#d32f2f), фон #fce4ec |

Адаптивность: мобильные до 768px — навигация под логотипом; десктоп — карточка max-width: 400px.

---

## 8. Используемые методы Supabase SDK

| Метод | Файл | Назначение |
|---|---|---|
| `supabase.auth.getSession()` | auth-state.js | Получение текущей сессии |
| `supabase.auth.onAuthStateChange()` | auth-state.js | Подписка на смену auth-состояния |
| `supabase.auth.signOut()` | auth-state.js | Выход |
| `.from('profiles').select('full_name').eq('id', ...).single()` | profile.js | Чтение профиля |
| `.from('profiles').update({...}).eq('id', ...)` | profile.js | Обновление профиля |

---

## 9. Текущее состояние функциональности

**Реализовано:**
- Отображение email (из `auth.users`, только чтение)
- Отображение `full_name` из таблицы `profiles`
- Редактирование `full_name` с сохранением в `profiles`
- Guard-редирект для гостей
- Статус-сообщения (успех / ошибка)
- Блокировка кнопки во время запроса
- Навигация (header с «Профиль» / «Выход»)

**Есть в БД, НЕ реализовано на странице:**
- `avatar_url` — поле в таблице `profiles` не отображается и не редактируется

**Отсутствует и в БД, и на странице:**
- Смена email (требует `supabase.auth.updateUser`)
- Смена пароля (требует `supabase.auth.updateUser`)
- Удаление аккаунта

---

## 10. Связанные документы

- `docs/plans/plan_auth-email-supabase/05_profile-page.md` — план реализации (выполнен)
- `docs/design/design_database.md` — полная схема БД с RLS
- `supabase/migrations/001_initial_schema.sql` — SQL-миграция (таблица profiles, триггер, RLS)
