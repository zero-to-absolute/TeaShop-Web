# Фаза 5: Страница профиля

**Зависимости:** Фазы 1–4 (все предыдущие)
**Основание:** RLS-политики profiles (SELECT/UPDATE только свои), ADR-4 (redirect-guard)

---

## Что реализуется

Страница профиля пользователя. После этой фазы авторизация полностью завершена:
- Гость, зашедший на `/profile.html`, автоматически перенаправляется на `/login.html?redirect=/pages/profile.html`
- Авторизованный видит свой email и имя
- Может изменить `full_name` и сохранить изменения в таблице `profiles`
- Навигация работает (кнопка «Выход» доступна)

---

## Создаваемые файлы

| Файл | Действие |
|---|---|
| `src/pages/profile.html` | Создать |
| `src/js/auth/profile.js` | Создать |

## Изменяемые файлы

| Файл | Что меняется |
|---|---|
| `src/css/auth.css` | Добавить стили для страницы профиля |

---

## HTML-структура `profile.html`

Ключевые элементы:

| Элемент | id/class | Назначение |
|---|---|---|
| `<header>` | `id="site-header"` + разметка nav | Навигация (как в login/register + user-nav) |
| `<span>` | `id="user-email"` | Отображение email (только чтение) |
| `<form>` | `id="profile-form"` | Форма редактирования |
| `<input type="text">` | `id="full-name"` | Поле имени (редактируемое) |
| `<button type="submit">` | — | Кнопка «Сохранить» |
| `<p>` (статус) | `id="status-message"` | Сообщение «Сохранено» / ошибка, скрыт по умолчанию |

Подключаемые скрипты:
- Supabase CDN
- `<link rel="stylesheet" href="../css/auth.css">`
- `<script type="module" src="../js/auth/profile.js"></script>`

---

## Логика `profile.js`

### Инициализация (при `DOMContentLoaded`)
- Импортирует `supabase` из `../shared/supabase.js`
- Импортирует `getCurrentUser` из `./auth-state.js`
- Импортирует `../shared/header.js` (side-effect)

### Guard: проверка авторизации
1. Вызывает `getCurrentUser()`
2. Если `user === null`:
   - Редирект: `window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname)`
   - Останавливает выполнение (`return`)
3. Если `user !== null` — продолжает загрузку профиля

### Загрузка профиля
1. Показывает `user.email` в `#user-email`
2. Запрашивает: `supabase.from('profiles').select('full_name').eq('id', user.id).single()`
3. При ошибке: показывает сообщение об ошибке
4. При успехе: заполняет `#full-name` значением `profile.full_name`

### Обработчик формы `profile-form` (событие `submit`)
1. `event.preventDefault()`
2. Читает `fullName` из `#full-name` (после trim)
3. Валидация: `fullName` не пустой
4. Блокирует кнопку
5. Вызывает:
   ```
   supabase.from('profiles')
     .update({ full_name: fullName, updated_at: new Date().toISOString() })
     .eq('id', user.id)
   ```
6. При ошибке: показывает ошибку, разблокирует кнопку
7. При успехе: показывает «Сохранено» в `#status-message`, разблокирует кнопку

### Функции `showStatus(message, isError)` / `hideStatus()`
- Устанавливают текст и класс `.error` / `.success` в `#status-message`
- `hideStatus()` скрывает элемент

---

## Изменения в `auth.css`

Добавить стили для страницы профиля:
- Секция профиля: отображение email (не форма — просто текст)
- `#status-message`: два варианта — `.success` (зелёный) и `.error` (красный)
- Разделитель секций если нужен

---

## Проверка RLS

Операции в этой фазе:
- `SELECT profiles WHERE id = auth.uid()` → покрыта политикой «Профиль: чтение своего»
- `UPDATE profiles WHERE id = auth.uid()` → покрыта политикой «Профиль: обновление своего»

Новых политик не требуется.

---

## Критерии приёмки

- [ ] `profile.html` создан, открывается без ошибок в консоли
- [ ] Гость, открывающий `profile.html`, перенаправляется на `login.html?redirect=...`
- [ ] После входа через redirect — возврат на `profile.html`
- [ ] Email пользователя отображается в `#user-email`
- [ ] `full_name` из таблицы `profiles` загружается в поле формы
- [ ] Изменение имени и сохранение обновляет запись в `profiles`
- [ ] В Supabase Table Editor → profiles: `updated_at` обновился
- [ ] Попытка сохранить с пустым именем → ошибка валидации
- [ ] Ошибка Supabase → отображается сообщение об ошибке
- [ ] Кнопка «Выход» в header работает корректно
- [ ] Навигация показывает user-nav (Профиль / Выход) для авторизованного

## Как проверить руками

1. Выйти из аккаунта (или открыть в инкогнито)
2. Открыть `profile.html` → проверить редирект на `login.html` с `?redirect=`
3. Войти → убедиться в возврате на `profile.html`
4. Проверить отображение email и имени
5. Изменить имя → сохранить → убедиться в появлении «Сохранено»
6. Открыть Supabase Dashboard → profiles → проверить обновлённые данные
7. Перезагрузить страницу → убедиться, что новое имя загрузилось

---

## Итоговое состояние после фазы 5

Авторизация полностью реализована:

```
src/
├── js/
│   ├── auth/
│   │   ├── auth-state.js   ✓
│   │   ├── login.js        ✓
│   │   ├── register.js     ✓
│   │   └── profile.js      ✓
│   └── shared/
│       ├── config.js       ✓ (существовал)
│       ├── supabase.js     ✓ (существовал)
│       └── header.js       ✓
├── css/
│   └── auth.css            ✓
└── pages/
    ├── login.html          ✓
    ├── register.html       ✓
    └── profile.html        ✓
```

Пользователь может: зарегистрироваться, войти, просмотреть и редактировать профиль, выйти.
Гость видит правильную навигацию. Страницы защищены guard-редиректом.