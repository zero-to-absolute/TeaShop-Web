# Фаза 1: Главная страница (index.html + index.css + фикс ссылок логотипа)

## Что реализуется

1. Исправляются ссылки логотипа `href="/"` → `href="index.html"` во всех существующих страницах и `header.js`
2. Создаётся `src/css/index.css` со стилями главной страницы
3. Создаётся `src/pages/index.html` — главная страница с шапкой, hero-секцией и карточками разделов

Страница статическая — без собственного JS-модуля. `header.js` подключается для auth-навигации.

> Визуальный дизайн (фото, типографика hero) будет доработан позже в Google AI Studio.

## Файлы, которые создаются

| Файл | Что содержит |
|------|-------------|
| `src/pages/index.html` | Главная страница |
| `src/css/index.css` | Стили главной страницы |

## Файлы, которые изменяются

| Файл | Что меняется |
|------|-------------|
| `src/pages/login.html` | `href="/"` → `href="index.html"` у логотипа |
| `src/pages/register.html` | то же |
| `src/pages/profile.html` | то же |
| `src/pages/catalog.html` | то же |
| `src/js/shared/header.js` | `window.location.href = '/'` → `'index.html'` (строка 47) |

## HTML-структура index.html

```
<head>
  charset, viewport
  <title>TeaShop — Чайный магазин</title>
  Supabase CDN
  <link rel="stylesheet" href="../css/index.css">
  <script type="module" src="../js/shared/header.js">

<body>
  <header id="site-header">
    <a href="index.html" class="logo">TeaShop</a>
    <nav id="guest-nav">   ← Вход, Регистрация
    <nav id="user-nav">    ← Профиль, Выход (скрыт по умолчанию)

  <main class="home-page">
    <section class="hero">
      <h1>Найди свой чай</h1>
      <p>Каталог отборных сортов...</p>
      <a class="cta-btn" href="catalog.html">Перейти в каталог</a>

    <section class="features">
      <article class="feature-card">  ← Каталог чаёв → catalog.html
      <article class="feature-card">  ← Конструктор смесей → (ссылка заглушка)
      <article class="feature-card">  ← Личный кабинет → profile.html

  <footer class="site-footer">
    <p>© 2025 TeaShop</p>
```

## CSS-структура index.css

```
/* Сброс и базовые стили */           — box-sizing, body (как в auth.css)
/* Шапка #site-header */              — дублирование из auth.css (учебный проект)
/* Логотип, навигация, logout-btn */  — дублирование из auth.css
/* Адаптивность шапки */              — @media max-width: 767px
/* Hero-секция */                     — .hero { min-height, flex, центрирование }
/* CTA-кнопка */                      — .cta-btn { зелёная кнопка, hover }
/* Секция карточек */                 — .features { CSS Grid, gap }
/* Карточка раздела */                — .feature-card { белый фон, border-radius, hover }
/* Футер */                           — .site-footer { базовый, padding }
/* Адаптивность главной */            — @media breakpoints 375px, 768px
```

Акцентный цвет: `#2e7d32`. Фон: `#f5f5f5`. Шрифт: system-ui stack (как в auth.css).

## Критерии приёмки

- [ ] В `login.html`, `register.html`, `profile.html`, `catalog.html` логотип имеет `href="index.html"`
- [ ] В `header.js` редирект после logout — `'index.html'`
- [ ] `src/pages/index.html` существует и открывается в браузере
- [ ] `src/css/index.css` существует и подключён
- [ ] Шапка содержит `#guest-nav` и `#user-nav`, переключается по auth-состоянию
- [ ] `.hero` с `<h1>`, `<p>` и CTA-кнопкой → `catalog.html`
- [ ] `.features` с тремя карточками; «Каталог» → `catalog.html`, «Профиль» → `profile.html`
- [ ] Страница адаптивна от 375px (нет горизонтального скролла)
- [ ] В консоли браузера нет ошибок JS

## Тесты (ручные)

1. Открыть `src/pages/index.html` (не авторизован) — шапка показывает «Вход» и «Регистрация», hero и карточки видны
2. Кликнуть CTA «Перейти в каталог» — переход на `catalog.html`
3. Кликнуть логотип на `catalog.html`, `login.html` — переход на `index.html`
4. Войти в аккаунт, открыть `index.html` — шапка показывает «Профиль» и «Выход»
5. Нажать «Выход» — редирект на `index.html`, шапка переключилась на guest-nav
6. Сузить браузер до 375px — нет горизонтального скролла, карточки в один столбец