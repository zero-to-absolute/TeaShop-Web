# Фаза 2: HTML и CSS — структура и оформление страницы профиля

**Зависимости:** Фаза 1 (bucket существует)
**Основание:** Секция 5, 7 из `docs/design/design_user-profile.md`

---

## Что реализуется

Переработка `profile.html` под трёхсекционную структуру и добавление CSS-стилей
в `auth.css`. После фазы страница корректно отображается визуально,
JS-логика подключается в фазе 3.

---

## Файлы

| Файл | Действие |
|---|---|
| `src/pages/profile.html` | Изменить — новая структура |
| `src/css/auth.css` | Изменить — добавить стили профиля |

---

## `profile.html` — новая структура `<main>`

Заменить содержимое `<main class="auth-page">` на:

```
<div class="profile-card">
  <h1 class="auth-title">Профиль</h1>

  <!-- Секция 1: Аватар -->
  <section class="profile-section profile-avatar-section">
    <!-- <img id="avatar-preview"> ИЛИ <div id="avatar-placeholder"> -->
    <div id="avatar-preview-wrapper">...</div>
    <div class="avatar-actions">
      <button id="avatar-change-btn" type="button">Изменить фото</button>
      <input type="file" id="avatar-input" accept="image/jpeg,image/png,image/webp" hidden>
    </div>
    <p id="avatar-status" class="status-msg"></p>
  </section>

  <!-- Разделитель -->
  <hr class="profile-divider">

  <!-- Секция 2: Личные данные -->
  <section class="profile-section">
    <h2 class="section-title">Личные данные</h2>

    <div class="profile-readonly-field">
      <span class="profile-label">Email</span>
      <span id="user-email" class="profile-value"></span>
    </div>

    <div class="profile-readonly-field">
      <span class="profile-label">Дата регистрации</span>
      <span id="user-created-at" class="profile-value"></span>
    </div>

    <form id="profile-form" novalidate>
      <div class="form-group">
        <label for="full-name">Имя</label>
        <input type="text" id="full-name" name="full_name"
               placeholder="Ваше имя" autocomplete="name">
      </div>
      <p id="profile-status" class="status-msg"></p>
      <button type="submit">Сохранить имя</button>
    </form>
  </section>

  <!-- Разделитель -->
  <hr class="profile-divider">

  <!-- Секция 3: Безопасность -->
  <section class="profile-section">
    <h2 class="section-title">Безопасность</h2>

    <form id="password-form" novalidate>
      <div class="form-group">
        <label for="new-password">Новый пароль</label>
        <input type="password" id="new-password" name="new_password"
               placeholder="Минимум 6 символов" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label for="new-password-confirm">Подтверждение пароля</label>
        <input type="password" id="new-password-confirm"
               placeholder="Повторите пароль" autocomplete="new-password">
      </div>
      <p id="password-status" class="status-msg"></p>
      <button type="submit">Сменить пароль</button>
    </form>
  </section>
</div>
```

---

## `auth.css` — добавляемые стили

### Карточка профиля

```css
/* profile-card расширяет auth-card, но шире */
.profile-card {
  /* те же свойства что у .auth-card */
  max-width: 480px; /* вместо 400px */
}
```

### Секции

```css
.profile-section { /* отступы между секциями */ }
.profile-divider { /* горизонтальный разделитель */ }
.section-title { /* заголовок секции, небольшой, uppercase */ }
```

### Аватар

```css
.profile-avatar-section { /* flex, по центру */ }
#avatar-preview-wrapper { /* контейнер 96×96 */ }
#avatar-preview { /* img: круг 96×96, object-fit: cover */ }
.avatar-placeholder { /* div: круг 96×96, фон #2e7d32, буква белая 2rem */ }
.avatar-actions { /* кнопка изменения, margin-top */ }
#avatar-change-btn { /* стиль как текстовая ссылка */ }
```

### Read-only поля

```css
.profile-readonly-field { /* flex column, gap, margin-bottom */ }
.profile-label { /* 0.875rem, #555, font-weight 500 */ }
.profile-value { /* 1rem, #333 */ }
```

### Статус-сообщения (унификация)

```css
/* Заменить #status-message на класс .status-msg */
.status-msg { /* скрыт по умолчанию */ }
.status-msg.success { /* зелёный */ }
.status-msg.error { /* красный */ }
```

**Важно:** старый `#status-message` в CSS оставить для обратной совместимости
с login/register страницами, которые его используют.

---

## Критерии приёмки

- [ ] `profile.html` открывается без ошибок в консоли
- [ ] Страница отображает три визуальные секции с разделителями
- [ ] Секция аватара: виден круглый placeholder (JS ещё не подключён — статично)
- [ ] Секция личных данных: поля email, дата, форма имени
- [ ] Секция безопасности: форма смены пароля с двумя полями
- [ ] Адаптивность: на 375px всё умещается, нет горизонтального скролла
- [ ] На десктопе карточка не шире 480px, центрирована
