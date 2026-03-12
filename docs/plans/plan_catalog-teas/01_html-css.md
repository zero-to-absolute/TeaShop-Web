# Фаза 1: HTML-скелет и CSS-стили каталога

**Файл:** `01_html-css.md`
**Зависимости:** нет (первая фаза)

---

## Что реализуется

Статическая HTML-страница каталога с полной CSS-разметкой. Данных из Supabase ещё нет —
только структура и оформление. После этой фазы каталог выглядит правильно на всех
breakpoint'ах, но карточки в нём — статические-заглушки или пустые.

---

## Файлы

| Файл | Действие | Описание |
|---|---|---|
| `src/pages/catalog.html` | **создать** | HTML-страница каталога |
| `src/css/catalog.css` | **создать** | Стили каталога |

---

## Что входит в `catalog.html`

### `<head>`
- `charset`, `viewport`, `<title>Каталог чаёв — TeaShop</title>`
- `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` — Supabase CDN
- `<link rel="stylesheet" href="../css/catalog.css">`
- `<script type="module" src="../js/catalog/catalog.js">` — основной модуль (создаётся в фазе 2)
- `<script type="module" src="../js/shared/header.js">` — шапка

### `<header id="site-header">`
Точная копия паттерна из `login.html`:
- `.logo` — ссылка «TeaShop» на `/`
- `#guest-nav` — Вход / Регистрация
- `#user-nav` (display:none) — Профиль / Выход (кнопка `#logout-btn`)

### `<main class="catalog-page">`
- `<h1>` — «Каталог чаёв»
- `<div id="category-filter">` — контейнер кнопок категорий (пустой, JS заполнит)
- `<div id="loading">` — индикатор загрузки («Загрузка...»), виден по умолчанию
- `<div id="empty-state" hidden>` — заглушка «Нет чаёв» / сообщение об ошибке
- `<div id="tea-grid" class="tea-grid">` — CSS Grid контейнер (пустой, JS заполнит)
- `<nav id="pagination" aria-label="Страницы каталога">` — контейнер кнопок пагинации (пустой)

---

## Что входит в `catalog.css`

### Общая страница
- `.catalog-page` — `max-width`, `padding`, центрирование

### Шапка (переиспользовать стили, при необходимости вынести общее)
- Паттерн шапки уже описан в `auth.css` — если общие стили задублируются, это ОК для учебного проекта

### Фильтр категорий `#category-filter`
- `display: flex`, `gap`, `overflow-x: auto`, `white-space: nowrap` (горизонтальный скролл на мобильных)
- `.category-btn` — базовые стили кнопки-таба (border, padding, cursor, border-radius)
- `.category-btn.active` — активное состояние (акцентный цвет фона)

### Индикатор загрузки `#loading`
- Текст «Загрузка...», центрирование, минимальная высота

### Сетка карточек `.tea-grid`
- `display: grid`
- Desktop (≥ 960px): `grid-template-columns: repeat(3, 1fr)`, `gap: 24px`
- Планшет (600–959px): `repeat(2, 1fr)`, `gap: 16px`
- Мобильный (375–599px): `1fr`, `gap: 12px`

### Карточка `.tea-card`
- `display: flex`, `flex-direction: column`
- `border-radius`, `box-shadow`, `overflow: hidden`
- Hover-эффект: лёгкий `transform: translateY(-2px)`, усиление `box-shadow`

**Части карточки:**
- `.tea-card__image` — блок изображения, фиксированная высота (например, 180px)
  - Фоновый цвет-placeholder (например, `#f0ebe3`)
  - Символ чашки: `::before { content: '🍵'; font-size: 3rem; ... }` — центрирован через flex
  - Если есть `<img>` внутри — `width: 100%; height: 100%; object-fit: cover`
- `.tea-card__category` — бейдж, маленький шрифт, фоновый цвет
- `.tea-card__name` — `font-weight: bold`, `font-size: 1rem`
- `.tea-card__description` — `font-size: 0.875rem`, `color: gray`
- `.tea-card__pricing` — flex-строка, align-items baseline
  - `.tea-card__price` — крупный шрифт, акцентный цвет
  - `.tea-card__price-per-gram` — маленький, серый
- `.tea-card__weight` — маленький, вспомогательный текст

**Состояние «нет в наличии»:**
- `.tea-card--out-of-stock` — `opacity: 0.55`, cursor обычный

### Заглушка `#empty-state`
- Центрирование, иконка или текст
- Разные тексты управляются из JS

### Пагинация `#pagination`
- `display: flex`, `gap`, `justify-content: center`
- `.pagination__btn` — квадратные кнопки, border
- `.pagination__btn--active` — акцентный цвет
- `.pagination__btn:disabled` — `opacity: 0.4`, `cursor: not-allowed`

---

## Критерии приёмки

- [ ] `catalog.html` открывается в браузере без ошибок в консоли (JS-файл `catalog.js` ещё не существует — это нормально, ошибка импорта будет исправлена в фазе 2)
- [ ] Шапка отображается корректно: видны ссылки «Вход» и «Регистрация» (гостевой режим)
- [ ] `#category-filter` пустой, но видна его область
- [ ] `#loading` виден (текст «Загрузка...»)
- [ ] `#tea-grid` пустой, но занимает место в потоке
- [ ] Ширина страницы на 375px — горизонтальная прокрутка отсутствует
- [ ] На 960px+ секция `#tea-grid` имеет потенциал для 3-колоночной сетки (можно проверить добавив 3 `<article>` вручную)
- [ ] CSS-переменные цветовой схемы (если используются) задокументированы в комментарии

---

## Ручное тестирование

1. Открыть `catalog.html` в браузере напрямую через `file://` или через Live Server
2. Сузить окно до 375px — убедиться, что нет горизонтальной прокрутки
3. Временно добавить 3 `<article class="tea-card">` с заглушками — убедиться, что grid работает
4. Удалить временные карточки перед следующей фазой
