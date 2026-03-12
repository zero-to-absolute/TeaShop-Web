---
name: Главная страница (index.html)
description: Факты о текущем состоянии проекта для создания главной страницы и исправления ссылки логотипа
type: project
---

# RESEARCH: Главная страница (index.html)

## 1. Что сейчас есть — HTML-страницы

Все HTML-файлы находятся в `src/pages/`:

| Файл | Назначение |
|------|-----------|
| `src/pages/catalog.html` | Каталог чаёв |
| `src/pages/login.html` | Вход |
| `src/pages/register.html` | Регистрация |
| `src/pages/profile.html` | Профиль пользователя |

**`index.html` отсутствует** — ни в корне проекта, ни в `src/pages/`.

## 2. Текущее поведение логотипа

Во всех четырёх страницах логотип разметан одинаково:

```html
<a href="/" class="logo">TeaShop</a>
```

- `href="/"` — ведёт на корень сайта (ожидает `index.html` в корне)
- Класс `logo` — уже стилизован в `auth.css` и `catalog.css`
- При клике на логотип сейчас переход ведёт в никуда (файла нет)

Также в `header.js` после logout:
```js
window.location.href = '/';
```
— тоже ведёт в корень.

## 3. Стили шапки (шаблон для index.html)

Стили шапки (`#site-header`, `.logo`, `nav`) **дублированы** в двух файлах:
- `src/css/auth.css` (строки 23–85)
- `src/css/catalog.css` (строки 30–90)

Акцентный цвет шапки: `#2e7d32` (тёмно-зелёный).

Стили `.logo`:
- `color: #fff`
- `font-size: 1.25rem`
- `font-weight: 700`
- `letter-spacing: 0.5px`
- `text-decoration: none`

Адаптивность шапки (из `auth.css`, строки 397–407):
- до 768px: `flex-direction: column`, навигация под логотипом
- от 768px: горизонтальная раскладка

## 4. JS-модули, связанные с задачей

### `src/js/shared/header.js`
- Универсальный модуль навигации — подключается на **каждой** странице
- Переключает `#guest-nav` / `#user-nav` в зависимости от auth-состояния
- Ожидает в DOM: `#guest-nav`, `#user-nav`, `#logout-btn`
- Зависит от: `auth/auth-state.js` → `getCurrentUser`, `onAuthChange`, `logout`

### `src/js/auth/auth-state.js`
- `getCurrentUser()` — получает текущего пользователя из сессии Supabase
- `onAuthChange(callback)` — реактивная подписка на изменение auth
- `logout()` — выход, после которого редирект на `/`

## 5. Паттерн подключения модулей на страницах

Каждый HTML по шаблону:
```html
<!-- Supabase CDN (обязателен на страницах с auth/data) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Page-specific CSS -->
<link rel="stylesheet" href="../css/[page].css">

<!-- Page-specific JS -->
<script type="module" src="../js/[module]/[page].js"></script>

<!-- Общая логика шапки -->
<script type="module" src="../js/shared/header.js"></script>
```

Главная страница как витрина **не требует** обращений к Supabase-данным. `header.js` нужен для auth-навигации.

## 6. Структура шапки (HTML-шаблон для index.html)

```html
<header id="site-header">
  <a href="/" class="logo">TeaShop</a>

  <nav id="guest-nav">
    <a href="login.html">Вход</a>
    <a href="register.html">Регистрация</a>
  </nav>

  <nav id="user-nav" style="display: none;">
    <a href="profile.html">Профиль</a>
    <button id="logout-btn">Выход</button>
  </nav>
</header>
```

## 7. Вопрос размещения index.html

Текущие страницы (`src/pages/`) ссылаются друг на друга по **относительным путям без директории**:
- `href="login.html"`, `href="register.html"`, `href="profile.html"`, `href="catalog.html"`

Логотип и logout ссылаются на `href="/"` → ожидается `index.html` **в корне проекта**.

Если `index.html` лежит в корне, пути к CSS и JS будут:
- `src/css/[page].css`
- `src/js/shared/header.js`

Если `index.html` лежит в `src/pages/`, пути:
- `../css/[page].css`
- `../js/shared/header.js`
- Но тогда ссылки из других страниц на главную — `href="index.html"` вместо `href="/"`

## 8. Таблицы БД

Главная страница **не использует** таблицы Supabase (это статичная витрина). RLS-политики не затрагиваются.

## 9. CSS-файлы, которые нужны

| Задача | Статус |
|--------|--------|
| Стили шапки | Уже есть в `auth.css` и `catalog.css` |
| Стили главной страницы (hero, навигация) | Нет — нужно создать `src/css/index.css` |

## 10. Что нужно создать / изменить

- **Создать**: `index.html` (местоположение — решается на фазе DESIGN)
- **Создать**: CSS для главной (или переиспользовать существующий)
- **Возможно**: скорректировать `href` в ссылках на главную в `src/pages/*.html` (если `index.html` окажется в `src/pages/`)
- **Ничего менять** в `header.js` и `auth-state.js` не нужно