# TeaShop — С чего начать разработку

## Что уже готово

- `teashop_project_brief.md` — описание проекта (ЧТО делаем)
- `teashop-engineering.md` — инженерный процесс (КАК делаем)
- `CLAUDE.md` — постоянный контекст для Claude (загружается автоматически)
- `.claude/skills/` — скиллы для каждой фазы разработки
- Структура папок `src/`, `docs/`, `tests/`

---

## Быстрый старт

```bash
npm install       # установка зависимостей (Vite + Tailwind CSS)
npm run dev       # запуск dev-сервера на http://localhost:3000
npm run build     # production-сборка в dist/
npm run preview   # просмотр production-сборки
```

**Важно:** Проект использует Vite + Tailwind CSS. Открывать страницы через Live Server **не получится** — Tailwind требует сборщик для компиляции стилей. Всегда используйте `npm run dev`.

---

## Конфигурация Supabase

Ключи Supabase хранятся в `.env` файле (не в репозитории):

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Fallback-значения также хранятся в `src/js/shared/config.js`.

---

## Порядок разработки фич

Каждая фича проходит 4 фазы. Каждая фаза — **отдельный чат** (или `/clear`).

```
/research [задача]  →  /design [задача]  →  /plan [задача]  →  /implement [файл фазы]
```

---

## Структура проекта

```
TeaShop/
├── index.html                          — главная страница (Vite entry point)
├── vite.config.ts                      — конфигурация Vite + Tailwind
├── package.json                        — зависимости и скрипты
├── .env                                — переменные окружения (не в git)
├── CLAUDE.md                           — контекст для Claude
├── START_HERE.md                       — этот файл
│
├── src/
│   ├── index.css                       — Tailwind entry point (@theme, компоненты)
│   ├── js/
│   │   ├── main.js                     — навигация (auth UI)
│   │   ├── catalog/                    — каталог чаёв с фильтрами
│   │   ├── constructor/                — конструктор смесей
│   │   ├── cart/                       — корзина
│   │   ├── auth/                       — вход, регистрация, профиль, auth-state
│   │   └── shared/                     — config.js, supabase.js, utils.js
│   └── pages/                          — catalog.html, login.html, register.html, profile.html
│
├── supabase/                           — миграции БД
├── docs/                               — research, design, plans
└── tests/
```

---

## Рекомендуемый порядок разработки

```
1. БД + Supabase ✅
2. Shared / Config ✅
3. Авторизация ✅
4. Каталог ✅
5. Конструктор (в разработке)
6. Корзина (в разработке)
```
