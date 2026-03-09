# RESEARCH: Авторизация — вход и регистрация через email + Supabase Auth

**Дата:** 2026-03-09
**Фаза:** RESEARCH
**Задача:** Авторизация: вход и регистрация через email + Supabase Auth

---

## 1. Затронутые файлы

### Уже существуют
| Файл | Роль |
|---|---|
| `src/js/shared/config.js` | SUPABASE_URL и SUPABASE_ANON_KEY |
| `src/js/shared/supabase.js` | Инициализация клиента через `window.supabase.createClient()` |
| `supabase/migrations/001_initial_schema.sql` | Схема БД, триггер создания профиля, RLS |

### Не существуют (нужно создать)
| Файл | Назначение |
|---|---|
| `src/pages/login.html` | Страница входа |
| `src/pages/register.html` | Страница регистрации |
| `src/pages/profile.html` | Страница профиля |
| `src/js/auth/login.js` | Логика входа |
| `src/js/auth/register.js` | Логика регистрации |
| `src/js/auth/profile.js` | Логика профиля |
| `src/js/auth/auth-state.js` | Отслеживание состояния сессии |
| `src/css/auth.css` | Стили форм авторизации |

---

## 2. Supabase SDK — методы, связанные с задачей

### Инициализация (уже есть в `supabase.js`)
```js
window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```
Клиент подключается через CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
Экспортируется как модуль: `export const supabase = createClient(...)`

### Методы Auth (не используются, доступны через SDK)
- `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` — регистрация
- `supabase.auth.signInWithPassword({ email, password })` — вход
- `supabase.auth.signOut()` — выход
- `supabase.auth.getSession()` — получить текущую сессию
- `supabase.auth.onAuthStateChange(callback)` — подписка на изменения состояния

---

## 3. Таблицы БД, связанные с задачей

### `auth.users` (управляется Supabase, не напрямую)
- Создаётся автоматически при `signUp()`
- Поля: `id` (UUID), `email`, `raw_user_meta_data` (JSON с `full_name`)

### `profiles` (кастомная таблица, `001_initial_schema.sql`)
| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | PK, ссылается на `auth.users.id` |
| `full_name` | TEXT | Имя пользователя |
| `avatar_url` | TEXT | URL аватара |
| `created_at` | TIMESTAMPTZ | Дата регистрации |
| `updated_at` | TIMESTAMPTZ | Дата обновления |

### Триггер `on_auth_user_created`
- Вызывает функцию `handle_new_user()` после `INSERT` в `auth.users`
- Автоматически создаёт запись в `profiles`
- Берёт `full_name` из `NEW.raw_user_meta_data->>'full_name'`
- Использует `SECURITY DEFINER` для обхода RLS при вставке

---

## 4. RLS-политики, связанные с задачей

### Таблица `profiles`
| Операция | Политика |
|---|---|
| SELECT | `auth.uid() = id` — только свой профиль |
| INSERT | `auth.uid() = id` — только свой профиль (на случай ручного создания) |
| UPDATE | `auth.uid() = id` — только свой профиль |

### Таблицы с зависимостью от auth-состояния
- `cart_items`: SELECT/INSERT/UPDATE/DELETE только если `auth.uid() = user_id`
- `recipes`: INSERT/DELETE только если `auth.uid() IS NOT NULL`

---

## 5. Режимы доступа пользователей

| Режим | Доступ |
|---|---|
| Гость (не авторизован) | Каталог, конструктор |
| Авторизованный | + корзина, профиль, сохранение составов |

---

## 6. HTML-страницы, задействованные в задаче

**Не существуют** — директория `src/pages/` пуста.

Планируемые страницы на основе проектной документации:
- `login.html` — форма входа (email + password)
- `register.html` — форма регистрации (email + password + full_name)
- `profile.html` — просмотр и редактирование профиля

---

## 7. Действующие паттерны проекта

### Стандарты из `CLAUDE.md`
- ES modules (`import/export`) везде
- Комментарии на **русском** языке
- Имена переменных и функций на **английском** языке
- `try/catch` или `.catch()` для КАЖДОГО Supabase-запроса
- Проверка auth-состояния перед операциями с корзиной
- Адаптивный дизайн от **375px**
- Ключи и URL Supabase — только в `src/js/shared/config.js`

### Инициализация клиента (`supabase.js`)
```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

---

## 8. Что уже готово (не нужно делать)

- Схема БД — таблицы `profiles`, `auth.users` (через Supabase)
- Триггер автосоздания профиля при регистрации
- RLS-политики для `profiles`, `cart_items`, `recipes`
- Конфиг Supabase (`config.js`)
- Инициализация клиента (`supabase.js`)

---

## 9. Что отсутствует (предстоит реализовать)

- HTML-страницы: `login.html`, `register.html`, `profile.html`
- JS-модули: `auth/login.js`, `auth/register.js`, `auth/profile.js`, `auth/auth-state.js`
- CSS-стили для форм
- Вызовы Auth SDK: `signUp`, `signInWithPassword`, `signOut`, `onAuthStateChange`
- Навигация и смена UI в зависимости от состояния авторизации