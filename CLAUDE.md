# TeaShop — Постоянный контекст для Claude

## Проект

Учебный дипломный проект. Онлайн-витрина чайного магазина «TeaShop» с конструктором
персонализированных чайных смесей.

## Стек

- HTML5 + Tailwind CSS 4 (через Vite-плагин)
- JavaScript ES6+ (без фреймворков, ES modules)
- Vite — сборщик и dev-сервер
- Supabase: PostgreSQL + Auth + Storage
- Безопасность через Row Level Security (RLS)
- Lucide Icons (CDN), Google Fonts (Inter + Playfair Display)

## Архитектура

- JAMstack без бэкенда — вся логика на клиенте (JS в браузере)
- Supabase JS SDK для БД, Auth, Storage (CDN)
- Модульная структура: `catalog`, `constructor`, `cart`, `auth`, `shared`
- Vite обрабатывает Tailwind CSS и multi-page HTML

## Разработка

```bash
npm install     # установка зависимостей
npm run dev     # Vite dev-сервер на порту 3000
npm run build   # production-сборка в dist/
```

## Структура

```
index.html              — главная страница (Vite entry point)
vite.config.ts          — конфигурация Vite + Tailwind
src/
├── index.css           — Tailwind entry point с @theme (цвета, шрифты)
├── js/
│   ├── main.js         — навигация (auth UI, Tailwind-кнопки)
│   ├── catalog/        — каталог чаёв и ингредиентов
│   ├── constructor/    — конструктор смесей (анкета + подбор + результат)
│   ├── cart/           — корзина (только авторизованные)
│   ├── auth/           — вход, регистрация, профиль, auth-state
│   └── shared/         — supabase-клиент, утилиты, config
└── pages/              — HTML-страницы (catalog, login, register, profile)
supabase/               — миграции БД
docs/                   — research, design, plans
```

## Стандарты кода

- ES modules (`import/export`) везде
- Обработка ошибок для КАЖДОГО Supabase-запроса (try/catch или `.catch()`)
- Проверка `auth`-состояния перед операциями с корзиной
- Комментарии на русском языке
- Имена переменных и функций на английском
- Адаптивный дизайн от 375px
- Ключи и URL Supabase: `import.meta.env` с fallback в `src/js/shared/config.js`
- XSS-защита: `escapeHtml()` из `utils.js` для всех innerHTML-вставок

## Что НЕ делать

- НЕ добавлять серверный уровень (бэкенд, Edge Functions и т.п.)
- НЕ использовать фреймворки (React, Vue, Svelte и т.д.)
- НЕ хардкодить ключи/URL Supabase в JS-файлах кроме config.js
- НЕ игнорировать RLS — каждая новая таблица должна иметь политики

## Пользователи

| Режим | Доступ |
|---|---|
| Гость | Каталог, конструктор |
| Авторизованный | + корзина, сохранение составов |

## Инженерный процесс

Каждая фича проходит 4 фазы: **RESEARCH → DESIGN → PLAN → IMPLEMENT**
Каждая фаза — отдельный чат (или `/clear`). Код пишется только на фазе IMPLEMENT.

Подробнее: `teashop-engineering.md`
