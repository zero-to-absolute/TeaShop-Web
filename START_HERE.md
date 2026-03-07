# TeaShop — С чего начать разработку

## Что уже готово

- `teashop_project_brief.md` — описание проекта (ЧТО делаем)
- `teashop-engineering.md` — инженерный процесс (КАК делаем)
- `CLAUDE.md` — постоянный контекст для Claude (загружается автоматически)
- `.claude/skills/` — скиллы для каждой фазы разработки
- Структура папок `src/`, `docs/`, `tests/`

---

## Порядок разработки фич

Каждая фича проходит 4 фазы. Каждая фаза — **отдельный чат** (или `/clear`).

```
/research [задача]  →  /design [задача]  →  /plan [задача]  →  /implement [файл фазы]
```

---

## Какие модели использовать и когда

### Claude Code (этот чат) — основная разработка

| Когда | Команда |
|---|---|
| Изучить проект, составить research | `/research каталог чаёв` |
| Спроектировать архитектуру фичи | `/design каталог чаёв` |
| Разбить дизайн на шаги реализации | `/plan каталог чаёв` |
| Написать код одной фазы | `/implement docs/plans/plan_catalog/01_data_model.md` |
| Исправить баг | Описать баг в чате, Claude найдёт и исправит |

### Gemini / AI Studio — стили и изображения

| Когда | Что делать |
|---|---|
| CSS для страницы готов HTML | Передать HTML в Gemini, попросить написать CSS |
| Нужны фото чаёв / ингредиентов | Imagen в AI Studio |

**Важно:** CSS и изображения делаются **после** того, как HTML-структура страницы готова.

---

## Рекомендуемый порядок разработки фич

Начинать с фундамента — данные и подключение к БД, потом UI.

```
1. БД + Supabase
   └── Схема таблиц (teas, ingredients, compatibility, recipes, profiles, cart)
   └── RLS-политики для каждой таблицы

2. Shared / Config
   └── src/js/shared/config.js       — Supabase URL + anon key
   └── src/js/shared/supabase.js     — инициализация клиента

3. Авторизация
   └── src/js/auth/                  — вход, регистрация, выход, профиль

4. Каталог
   └── src/js/catalog/               — список чаёв, фильтрация, карточки

5. Конструктор
   └── src/js/constructor/           — анкета, подбор, scoring, результат

6. Корзина
   └── src/js/cart/                  — добавление, отображение, оформление

7. CSS (через Gemini)
   └── src/css/                      — стили для каждой страницы
```

---

## Первые шаги прямо сейчас

### Шаг 1 — Настрой Supabase

1. Создай проект на supabase.com
2. Скопируй `Project URL` и `anon public key`
3. Создай `src/js/shared/config.js`:

```js
// Конфигурация Supabase
export const SUPABASE_URL = 'https://xxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

> **Никогда не коммить этот файл с реальными ключами в публичный репозиторий.**
> Добавь его в `.gitignore` или используй переменные окружения.

### Шаг 2 — Спроектируй схему БД

Запусти в этом чате:
```
/research схема базы данных TeaShop: таблицы для чаёв, ингредиентов, совместимости, рецептов, корзины, профилей
```

Получи research → `/design` → `/plan` → создай таблицы в Supabase.

### Шаг 3 — Начни с авторизации

Авторизация нужна для корзины и профилей. Начни с неё после БД:
```
/research авторизация через Supabase Auth: вход, регистрация, выход, триггер создания профиля
```

---

## Структура проекта

```
TeaShop/
├── CLAUDE.md                          — контекст для Claude (автозагрузка)
├── START_HERE.md                      — этот файл
├── teashop_project_brief.md           — описание проекта
├── teashop-engineering.md             — инженерный процесс
│
├── .claude/
│   └── skills/
│       ├── research.md               — /research
│       ├── design.md                 — /design
│       ├── plan.md                   — /plan
│       └── implement.md              — /implement
│
├── docs/
│   ├── research/                     — research_*.md файлы
│   ├── design/                       — design_*.md файлы
│   └── plans/                        — plan_*/01_*.md файлы
│
├── src/
│   ├── js/
│   │   ├── catalog/
│   │   ├── constructor/
│   │   ├── cart/
│   │   ├── auth/
│   │   └── shared/                   — config.js, supabase.js, utils.js
│   ├── css/
│   └── pages/                        — index.html, catalog.html, ...
│
└── tests/
```
